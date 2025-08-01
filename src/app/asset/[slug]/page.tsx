"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/src/components/header"
import { Navigation } from "@/src/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { Separator } from "@/src/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs"
import { AssetTemplate } from "@/src/components/asset-template"
import {
  Share,
  ExternalLink,
  Shield,
  Send,
  MoreHorizontal,
  Copy,
  Calendar,
  Globe,
  FileText,
  Music,
  Play,
  Eye,
  ArrowLeft,
  Flag,
  Edit,
  UserPlus,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Palette,
} from "lucide-react"
import { timelineAssets, portfolioAssets } from "@/src/lib/mock-data"
import type { AssetIP } from "@/src/types/asset"
import { toast } from "@/src/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

const getMediaIcon = (iptype: string) => {
  if (!iptype) return Eye

  switch (iptype.toLowerCase()) {
    case "music":
      return Music
    case "video":
      return Play
    case "document":
      return FileText
    case "art":
    case "image":
      return Palette
    default:
      return Eye
  }
}

const getLicenseColor = (licenseType: string) => {
  if (!licenseType) return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"

  switch (licenseType) {
    case "all-rights":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "creative-commons":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "open-source":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    case "custom":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const getProtectionIcon = (status: string) => {
  if (!status) return <AlertTriangle className="w-4 h-4 text-gray-500" />

  switch (status.toLowerCase()) {
    case "protected":
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case "patent protected":
      return <Shield className="w-4 h-4 text-blue-500" />
    case "pending":
      return <Clock className="w-4 h-4 text-yellow-500" />
    case "expired":
      return <XCircle className="w-4 h-4 text-red-500" />
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />
  }
}

export default function AssetPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<AssetIP | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const assetSlug = params.slug as string

    // Find asset in timeline or portfolio by slug
    let foundAsset = timelineAssets.find((a) => a.slug === assetSlug)
    if (!foundAsset) {
      foundAsset = portfolioAssets.find((a) => a.slug === assetSlug)
    }

    if (foundAsset) {
      setAsset(foundAsset)
      setIsOwner(foundAsset.creator?.username === "you" || foundAsset.creator?.name === "You")
    }

    setLoading(false)
  }, [params.slug])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied!",
      description: "Asset link copied to clipboard",
    })
  }

  const handleTransfer = () => {
    router.push(`/transfer?asset=${asset?.slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">

        <main className="pb-20">
          <div className="px-4 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-muted rounded w-1/4"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-96 bg-muted rounded-xl"></div>
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        <main className="pb-20">
          <div className="px-4 py-8">
            <div className="max-w-6xl mx-auto text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">Asset Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The asset you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push("/")}>Back to Home</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const MediaIcon = getMediaIcon(asset.type)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <main className="pb-20">
        <div className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <Button variant="ghost" onClick={() => router.back()} className="mb-6 hover:bg-muted/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Media Section */}
              <div className="space-y-4">
                <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="relative group">
                    <Image
                      src={asset.mediaUrl || "/placeholder.svg?height=600&width=600"}
                      alt={asset.title}
                      width={600}
                      height={600}
                      className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute top-4 left-4">
                      <Badge className="bg-background/90 text-foreground border-border/50 backdrop-blur-sm">
                        {asset.type || "Unknown"}
                      </Badge>
                    </div>

                    <div className="absolute top-4 right-4">
                      <Badge className={`${getLicenseColor(asset.licenseType)} border-0 backdrop-blur-sm`}>
                        {asset.licenseType ? asset.licenseType.replace("-", " ").toUpperCase() : "UNKNOWN"}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4">
                      <Badge
                        variant="secondary"
                        className="bg-background/90 text-foreground border-border/50 backdrop-blur-sm"
                      >
                        v{asset.ipVersion || "1.0"}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={handleShare}>
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Explorer
                  </Button>
                  {isOwner && (
                    <>
                      <Button variant="outline" onClick={handleTransfer}>
                        <Send className="w-4 h-4 mr-2" />
                        Transfer
                      </Button>
                      <Button variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                  {!isOwner && (
                    <Button variant="outline" className="col-span-2">
                      <Users className="w-4 h-4 mr-2" />
                      Contact Creator
                    </Button>
                  )}
                </div>

                {/* File Information */}
                {(asset.fileSize || asset.fileDimensions || asset.fileFormat) && (
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-3">File Information</h4>
                      <div className="space-y-2 text-sm">
                        {asset.fileFormat && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Format</span>
                            <span className="font-medium text-foreground">{asset.fileFormat}</span>
                          </div>
                        )}
                        {asset.fileSize && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Size</span>
                            <span className="font-medium text-foreground">{asset.fileSize}</span>
                          </div>
                        )}
                        {asset.fileDimensions && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dimensions</span>
                            <span className="font-medium text-foreground">{asset.fileDimensions}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-foreground mb-2">{asset.title}</h1>
                      <p className="text-muted-foreground text-lg leading-relaxed">{asset.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleShare}>
                          <Share className="w-4 h-4 mr-2" />
                          Share Asset
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Explorer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Creator Info */}
                  <Card className="bg-muted/20 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={asset.creator?.avatar || "/placeholder.svg?height=48&width=48"}
                          alt={asset.creator?.name || "Unknown Creator"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-border/50"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/creator/${asset.creator?.username || "unknown"}`}
                              className="font-semibold text-foreground hover:text-primary transition-colors"
                            >
                              {asset.creator?.name || "Unknown Creator"}
                            </Link>
                            {asset.creator?.verified && <Shield className="w-4 h-4 text-blue-500" />}
                          </div>
                          <p className="text-sm text-muted-foreground">Creator • {asset.author}</p>
                        </div>
                        <Link href={`/creator/${asset.creator?.username || "unknown"}`}>
                          <Button variant="outline" size="sm">
                            <UserPlus className="w-4 h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Asset Information */}
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Asset Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Type</Label>
                        <div className="font-medium text-foreground capitalize">{asset.type || "Unknown"}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Version</Label>
                        <div className="font-medium text-foreground">v{asset.ipVersion || "1.0"}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Network</Label>
                        <div className="font-medium text-foreground">{asset.blockchain || "Unknown"}</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Registered</Label>
                        <div className="font-medium text-foreground">{asset.registrationDate || "Unknown"}</div>
                      </div>
                    </div>

                    {asset.externalUrl && (
                      <div>
                        <Label className="text-sm text-muted-foreground">External Link</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={asset.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm"
                          >
                            View External Resource
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">{asset.registrationDate || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">Registered</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-foreground">v{asset.ipVersion || "1.0"}</div>
                        <div className="text-xs text-muted-foreground">Version</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Protection Status */}
                <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-foreground">{asset.protectionStatus || "Unknown"}</h3>
                          {getProtectionIcon(asset.protectionStatus)}
                        </div>
                        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                          Protected under {(asset.protectionScope || "unknown").toLowerCase()} copyright law for{" "}
                          {asset.protectionDuration || "unknown duration"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {asset.protectionScope || "Unknown Scope"}
                          </Badge>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            {asset.protectionDuration || "Unknown Duration"}
                          </Badge>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            Blockchain Verified
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Detailed Information Tabs */}
            <Tabs defaultValue="licensing" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                <TabsTrigger value="licensing" className="data-[state=active]:bg-background">
                  Licensing
                </TabsTrigger>
                <TabsTrigger value="template" className="data-[state=active]:bg-background">
                  Template
                </TabsTrigger>
                <TabsTrigger value="attributes" className="data-[state=active]:bg-background">
                  Attributes
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-background">
                  History
                </TabsTrigger>
                <TabsTrigger value="technical" className="data-[state=active]:bg-background">
                  Technical
                </TabsTrigger>
              </TabsList>

              <TabsContent value="licensing" className="mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Licensing Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">License Type</h4>
                        <Badge className={`${getLicenseColor(asset.licenseType)} border-0 text-sm`}>
                          {asset.licenseType ? asset.licenseType.replace("-", " ").toUpperCase() : "UNKNOWN"}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground mb-3">Permissions</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-muted/20 rounded-lg">
                            <div className="w-8 h-8 mx-auto mb-2">
                              {asset.commercialUse ? (
                                <CheckCircle className="w-8 h-8 text-green-500" />
                              ) : (
                                <XCircle className="w-8 h-8 text-red-500" />
                              )}
                            </div>
                            <h5 className="font-medium text-foreground">Commercial Use</h5>
                            <p className="text-xs text-muted-foreground">
                              {asset.commercialUse ? "Allowed" : "Not Allowed"}
                            </p>
                          </div>

                          <div className="text-center p-4 bg-muted/20 rounded-lg">
                            <div className="w-8 h-8 mx-auto mb-2">
                              {asset.modifications ? (
                                <CheckCircle className="w-8 h-8 text-green-500" />
                              ) : (
                                <XCircle className="w-8 h-8 text-red-500" />
                              )}
                            </div>
                            <h5 className="font-medium text-foreground">Modifications</h5>
                            <p className="text-xs text-muted-foreground">
                              {asset.modifications ? "Allowed" : "Not Allowed"}
                            </p>
                          </div>

                          <div className="text-center p-4 bg-muted/20 rounded-lg">
                            <div className="w-8 h-8 mx-auto mb-2">
                              {asset.attribution ? (
                                <CheckCircle className="w-8 h-8 text-green-500" />
                              ) : (
                                <XCircle className="w-8 h-8 text-red-500" />
                              )}
                            </div>
                            <h5 className="font-medium text-foreground">Attribution</h5>
                            <p className="text-xs text-muted-foreground">
                              {asset.attribution ? "Required" : "Not Required"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View License Terms
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Globe className="w-4 h-4 mr-2" />
                          License Asset
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="template" className="mt-6">
                <AssetTemplate asset={asset} />
              </TabsContent>

              <TabsContent value="attributes" className="mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Asset Attributes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {asset.attributes && asset.attributes.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {asset.attributes.map((attr, index) => (
                          <div key={index} className="bg-muted/20 rounded-lg p-4">
                            <div className="text-sm text-muted-foreground mb-1">{attr.trait_type}</div>
                            <div className="font-medium text-foreground">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No attributes defined for this asset</p>
                      </div>
                    )}

                    {/* Tags */}
                    {asset.tags && (
                      <div className="mt-6">
                        <h4 className="font-medium text-foreground mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {asset.tags.split(", ").map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Asset Created</div>
                          <div className="text-sm text-muted-foreground">
                            Minted on {asset.blockchain} • Version {asset.ipVersion}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{asset.registrationDate}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="mt-6">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Technical Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Token Standard</Label>
                          <div className="font-medium text-foreground">ERC-721</div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Blockchain</Label>
                          <div className="font-medium text-foreground">{asset.blockchain || "Unknown"}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Contract Address</Label>
                          <div className="font-mono text-sm text-foreground">
                            {asset.contractAddress || "0x1234...5678"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Token ID</Label>
                          <div className="font-mono text-sm text-foreground">{asset.tokenId || asset.id}</div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <Label className="text-sm text-muted-foreground">Metadata URI</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono flex-1">
                            {asset.metadataUri || `https://api.mip.app/metadata/${asset.slug}`}
                          </code>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
