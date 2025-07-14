/**
 * Rate Limiter Service for managing RPC requests with throttling and retry logic
 */

export interface RateLimiterConfig {
    maxRequestsPerSecond: number
    maxRetries: number
    initialBackoffMs: number
    maxBackoffMs: number
    cacheTimeoutMs: number
}

export interface CachedResponse<T> {
    data: T
    timestamp: number
    expiresAt: number
}

export class RateLimiterService {
    private config: RateLimiterConfig
    private requestQueue: Array<() => Promise<void>> = []
    private isProcessing: boolean = false
    private lastRequestTime: number = 0
    private cache: Map<string, CachedResponse<any>> = new Map()
    private requestsInProgress: Map<string, Promise<any>> = new Map()

    constructor(config: Partial<RateLimiterConfig> = {}) {
        this.config = {
            maxRequestsPerSecond: 3, // More conservative limit for blockchain RPC endpoints
            maxRetries: 2, // Reduced since we're smarter about what to retry
            initialBackoffMs: 1000,
            maxBackoffMs: 30000,
            cacheTimeoutMs: 60000, // 1 minute cache
            ...config
        }
    }

    /**
     * Execute a function with rate limiting and retry logic
     */
    public async executeWithRateLimit<T>(
        fn: () => Promise<T>,
        cacheKey?: string,
        cacheTimeout?: number
    ): Promise<T> {
        // Check cache first
        if (cacheKey && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey)!
            if (cached.expiresAt > Date.now()) {
                console.debug(`Cache hit for ${cacheKey}`)
                return cached.data
            } else {
                this.cache.delete(cacheKey)
            }
        }

        // Check if same request is already in progress
        if (cacheKey && this.requestsInProgress.has(cacheKey)) {
            return await this.requestsInProgress.get(cacheKey)!
        }

        const executeWithRetry = async (attempt: number = 0): Promise<T> => {
            try {
                await this.waitForRateLimit()
                const result = await fn()
                
                // Cache the result
                if (cacheKey) {
                    const timeout = cacheTimeout || this.config.cacheTimeoutMs
                    this.cache.set(cacheKey, {
                        data: result,
                        timestamp: Date.now(),
                        expiresAt: Date.now() + timeout
                    })
                }
                
                return result
            } catch (error: any) {
                if (attempt < this.config.maxRetries && this.shouldRetry(error)) {
                    const backoffMs = Math.min(
                        this.config.initialBackoffMs * Math.pow(2, attempt),
                        this.config.maxBackoffMs
                    )
                    
                    console.warn(
                        `Request failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}), retrying in ${backoffMs}ms:`,
                        error.message || error.toString()
                    )
                    
                    await this.delay(backoffMs)
                    return executeWithRetry(attempt + 1)
                } else {
                    // Only log non-contract errors to avoid spam
                    const errorMessage = error.message || error.toString()
                    const isContractError = errorMessage.includes('Contract error') || 
                                          errorMessage.includes('ERC721: invalid token ID') ||
                                          errorMessage.includes('invalid token ID')
                    
                    if (!isContractError) {
                        console.error('Request failed after retries:', errorMessage)
                    }
                }
                throw error
            }
        }

        // Track request in progress
        if (cacheKey) {
            const promise = executeWithRetry()
            this.requestsInProgress.set(cacheKey, promise)
            
            try {
                const result = await promise
                return result
            } finally {
                this.requestsInProgress.delete(cacheKey)
            }
        }

        return executeWithRetry()
    }

    /**
     * Execute multiple functions with controlled concurrency
     */
    public async executeBatch<T>(
        functions: Array<() => Promise<T>>,
        batchSize: number = 3
    ): Promise<T[]> {
        const results: T[] = []
        
        for (let i = 0; i < functions.length; i += batchSize) {
            const batch = functions.slice(i, i + batchSize)
            const batchPromises = batch.map(fn => this.executeWithRateLimit(fn))
            const batchResults = await Promise.all(batchPromises)
            results.push(...batchResults)
            
            // Add a delay between batches to be more conservative with RPC endpoints
            if (i + batchSize < functions.length) {
                await this.delay(500) // Increased delay between batches
            }
        }
        
        return results
    }

    /**
     * Wait for rate limit compliance
     */
    private async waitForRateLimit(): Promise<void> {
        const now = Date.now()
        const timeSinceLastRequest = now - this.lastRequestTime
        const minInterval = 1000 / this.config.maxRequestsPerSecond

        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest
            await this.delay(waitTime)
        }

        this.lastRequestTime = Date.now()
    }

    /**
     * Determine if an error should trigger a retry
     */
    private shouldRetry(error: any): boolean {
        if (!error) return false
        
        const errorMessage = error.message || error.toString()
        
        // Debug logging to see what errors we're getting
        console.debug('shouldRetry check:', {
            errorMessage: errorMessage.substring(0, 200),
            maxRetries: this.config.maxRetries
        })
        
        // Don't retry on expected contract errors - these are permanent/logical errors
        const contractErrors = [
            'ERC721: invalid token ID',
            'invalid token ID',
            'Token does not exist',
            'Collection does not exist',
            'Execution failed',
            'revert_error',
            'unauthorized',
            'insufficient balance',
            'not approved',
            'already exists',
            'invalid address',
            'invalid parameter',
            'invalid collection',
            'token does not exist',
            'collection not found'
        ]
        
        // Check if this is a contract error that shouldn't be retried
        const shouldNotRetry = contractErrors.some(err => errorMessage.toLowerCase().includes(err.toLowerCase()))
        if (shouldNotRetry) {
            console.debug('Not retrying contract error:', errorMessage.substring(0, 100))
            return false
        }
        
        // Don't retry on most contract errors unless they're clearly rate limiting related
        if (errorMessage.includes('Contract error') && 
            !errorMessage.includes('Rate limit') && 
            !errorMessage.includes('429') &&
            !errorMessage.includes('Too Many Requests')) {
            console.debug('Not retrying generic contract error')
            return false
        }
        
        // Additional specific check for the hex-encoded ERC721 error
        if (errorMessage.includes('0x4552433732313a20696e76616c696420746f6b656e204944')) {
            console.debug('Not retrying hex-encoded ERC721 invalid token ID error')
            return false
        }
        
        // Retry on rate limit errors (429, Too Many Requests)
        if (errorMessage.includes('429') || 
            errorMessage.includes('Too Many Requests') ||
            errorMessage.includes('Rate limit')) {
            return true
        }
        
        // Retry on network connectivity issues
        if (errorMessage.includes('network') || 
            errorMessage.includes('timeout') ||
            errorMessage.includes('connection') ||
            errorMessage.includes('fetch')) {
            return true
        }
        
        // Retry on RPC server errors (5xx) but not contract errors
        if ((errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504')) &&
            !errorMessage.includes('Contract error')) {
            return true
        }
        
        return false
    }

    /**
     * Delay execution for specified milliseconds
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Clear the cache
     */
    public clearCache(): void {
        this.cache.clear()
        this.requestsInProgress.clear()
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): {
        size: number
        hitRate: number
        requestsInProgress: number
    } {
        const now = Date.now()
        let validEntries = 0
        
        for (const [key, entry] of this.cache.entries()) {
            if (entry.expiresAt > now) {
                validEntries++
            } else {
                this.cache.delete(key)
            }
        }
        
        return {
            size: validEntries,
            hitRate: 0, // We'd need to track hits/misses to calculate this
            requestsInProgress: this.requestsInProgress.size
        }
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<RateLimiterConfig>): void {
        this.config = { ...this.config, ...newConfig }
    }
}

// Export a singleton instance with fresh configuration
export const rateLimiter = new RateLimiterService({
    maxRequestsPerSecond: 3,
    maxRetries: 2,
    initialBackoffMs: 1000,
    maxBackoffMs: 30000,
    cacheTimeoutMs: 60000
})

// Clear any existing cache on initialization
rateLimiter.clearCache() 