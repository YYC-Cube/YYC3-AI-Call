"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Smartphone,
  Download,
  QrCode,
  Bell,
  MapPin,
  Users,
  Phone,
  BarChart3,
  Settings,
  Shield,
  MessageSquare,
  Calendar,
  Plus,
  Edit,
  Share2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Globe,
  Camera,
  Mic,
  Clock,
  Database,
  Layers,
  Monitor,
  Upload,
} from "lucide-react"

// 移动应用数据类型
interface MobileApp {
  id: string
  name: string
  version: string
  platform: "iOS" | "Android" | "Web"
  status: "published" | "beta" | "development" | "maintenance"
  downloads: number
  rating: number
  reviews: number
  features: string[]
  screenshots: string[]
  description: string
  releaseDate: string
  lastUpdate: string
  size: string
  compatibility: string[]
}

interface MobileUser {
  id: string
  name: string
  email: string
  phone: string
  role: "销售" | "客服" | "经理" | "管理员"
  department: string
  avatar: string
  isOnline: boolean
  lastActive: string
  deviceInfo: {
    platform: string
    version: string
    model: string
    location: string
  }
  permissions: string[]
  stats: {
    callsToday: number
    customersManaged: number
    tasksCompleted: number
    performance: number
  }
}

interface MobileFeature {
  id: string
  name: string
  icon: string
  description: string
  category: "核心功能" | "辅助工具" | "数据分析" | "系统设置"
  isEnabled: boolean
  usage: number
  rating: number
  lastUsed: string
}

interface PushNotification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "error" | "reminder"
  priority: "low" | "normal" | "high" | "urgent"
  targetUsers: string[]
  scheduledTime?: string
  sentTime?: string
  status: "draft" | "scheduled" | "sent" | "failed"
  clickRate: number
  openRate: number
}

// 模拟移动应用数据
const mockMobileApps: MobileApp[] = [
  {
    id: "1",
    name: "锦澜家居销售助手",
    version: "2.1.3",
    platform: "iOS",
    status: "published",
    downloads: 15600,
    rating: 4.8,
    reviews: 1240,
    features: ["智能外呼", "客户管理", "数据同步", "离线模式", "语音识别", "地图导航"],
    screenshots: [
      "/placeholder.svg?height=600&width=300&text=iOS主界面",
      "/placeholder.svg?height=600&width=300&text=客户列表",
      "/placeholder.svg?height=600&width=300&text=通话界面",
    ],
    description: "专为销售团队打造的移动客户管理应用，支持智能外呼、客户跟进、数据分析等功能",
    releaseDate: "2024-01-15",
    lastUpdate: "2024-01-20",
    size: "45.2 MB",
    compatibility: ["iOS 14.0+", "iPhone 8+", "iPad Air 2+"],
  },
  {
    id: "2",
    name: "锦澜家居销售助手",
    version: "2.1.1",
    platform: "Android",
    status: "published",
    downloads: 23400,
    rating: 4.6,
    reviews: 1890,
    features: ["智能外呼", "客户管理", "数据同步", "离线模式", "语音识别", "地图导航"],
    screenshots: [
      "/placeholder.svg?height=600&width=300&text=Android主界面",
      "/placeholder.svg?height=600&width=300&text=客户管理",
      "/placeholder.svg?height=600&width=300&text=数据统计",
    ],
    description: "Android版销售助手，功能全面，性能优化，支持多种Android设备",
    releaseDate: "2024-01-12",
    lastUpdate: "2024-01-18",
    size: "38.7 MB",
    compatibility: ["Android 8.0+", "RAM 3GB+", "存储空间 100MB+"],
  },
  {
    id: "3",
    name: "锦澜家居Web应用",
    version: "3.0.2",
    platform: "Web",
    status: "published",
    downloads: 45600,
    rating: 4.9,
    reviews: 2340,
    features: ["响应式设计", "PWA支持", "离线缓存", "推送通知", "多设备同步"],
    screenshots: [
      "/placeholder.svg?height=400&width=600&text=Web界面",
      "/placeholder.svg?height=400&width=600&text=移动适配",
      "/placeholder.svg?height=400&width=600&text=功能面板",
    ],
    description: "基于PWA技术的Web应用，支持多平台访问，无需安装即可使用",
    releaseDate: "2024-01-10",
    lastUpdate: "2024-01-22",
    size: "缓存 15.3 MB",
    compatibility: ["Chrome 90+", "Safari 14+", "Firefox 88+", "Edge 90+"],
  },
]

// 模拟移动用户数据
const mockMobileUsers: MobileUser[] = [
  {
    id: "1",
    name: "张明",
    email: "zhang.ming@jinlan.com",
    phone: "138****8888",
    role: "销售",
    department: "华北销售部",
    avatar: "/placeholder.svg?height=60&width=60&text=张明",
    isOnline: true,
    lastActive: "刚刚",
    deviceInfo: {
      platform: "iOS",
      version: "17.2",
      model: "iPhone 14 Pro",
      location: "北京市朝阳区",
    },
    permissions: ["客户管理", "外呼功能", "数据查看", "报表生成"],
    stats: {
      callsToday: 23,
      customersManaged: 156,
      tasksCompleted: 8,
      performance: 92,
    },
  },
  {
    id: "2",
    name: "李华",
    email: "li.hua@jinlan.com",
    phone: "139****6666",
    role: "客服",
    department: "客户服务部",
    avatar: "/placeholder.svg?height=60&width=60&text=李华",
    isOnline: true,
    lastActive: "5分钟前",
    deviceInfo: {
      platform: "Android",
      version: "13",
      model: "华为 Mate 50",
      location: "上海市浦东新区",
    },
    permissions: ["客户服务", "工单处理", "知识库", "满意度调查"],
    stats: {
      callsToday: 18,
      customersManaged: 89,
      tasksCompleted: 12,
      performance: 88,
    },
  },
  {
    id: "3",
    name: "王芳",
    email: "wang.fang@jinlan.com",
    phone: "136****9999",
    role: "经理",
    department: "华南销售部",
    avatar: "/placeholder.svg?height=60&width=60&text=王芳",
    isOnline: false,
    lastActive: "2小时前",
    deviceInfo: {
      platform: "iOS",
      version: "17.1",
      model: "iPhone 15",
      location: "深圳市南山区",
    },
    permissions: ["团队管理", "数据分析", "业绩考核", "系统配置"],
    stats: {
      callsToday: 12,
      customersManaged: 234,
      tasksCompleted: 15,
      performance: 95,
    },
  },
]

// 模拟功能模块数据
const mockMobileFeatures: MobileFeature[] = [
  {
    id: "1",
    name: "智能外呼",
    icon: "📞",
    description: "AI辅助的智能外呼系统，支持自动拨号和通话记录",
    category: "核心功能",
    isEnabled: true,
    usage: 89,
    rating: 4.8,
    lastUsed: "刚刚",
  },
  {
    id: "2",
    name: "客户管理",
    icon: "👥",
    description: "全面的客户信息管理，支持客户画像和跟进记录",
    category: "核心功能",
    isEnabled: true,
    usage: 95,
    rating: 4.9,
    lastUsed: "2分钟前",
  },
  {
    id: "3",
    name: "地图导航",
    icon: "🗺️",
    description: "集成地图服务，支持客户位置导航和路线规划",
    category: "辅助工具",
    isEnabled: true,
    usage: 67,
    rating: 4.6,
    lastUsed: "1小时前",
  },
  {
    id: "4",
    name: "语音识别",
    icon: "🎤",
    description: "智能语音转文字，自动生成通话记录和客户备注",
    category: "辅助工具",
    isEnabled: true,
    usage: 78,
    rating: 4.7,
    lastUsed: "30分钟前",
  },
  {
    id: "5",
    name: "数据分析",
    icon: "📊",
    description: "实时业绩分析和数据报表，支持多维度数据展示",
    category: "数据分析",
    isEnabled: true,
    usage: 56,
    rating: 4.5,
    lastUsed: "3小时前",
  },
  {
    id: "6",
    name: "离线模式",
    icon: "📱",
    description: "支持离线工作，数据自动同步到云端",
    category: "系统设置",
    isEnabled: true,
    usage: 34,
    rating: 4.4,
    lastUsed: "昨天",
  },
]

// 模拟推送通知数据
const mockPushNotifications: PushNotification[] = [
  {
    id: "1",
    title: "新客户分配提醒",
    message: "您有3个新客户待跟进，请及时联系",
    type: "info",
    priority: "normal",
    targetUsers: ["销售"],
    sentTime: "2024-01-22 09:00",
    status: "sent",
    clickRate: 78.5,
    openRate: 92.3,
  },
  {
    id: "2",
    title: "系统维护通知",
    message: "系统将于今晚22:00-24:00进行维护升级",
    type: "warning",
    priority: "high",
    targetUsers: ["全部用户"],
    sentTime: "2024-01-22 15:30",
    status: "sent",
    clickRate: 45.2,
    openRate: 87.6,
  },
  {
    id: "3",
    title: "业绩达成祝贺",
    message: "恭喜您本月业绩已达成目标的120%！",
    type: "success",
    priority: "normal",
    targetUsers: ["张明", "王芳"],
    sentTime: "2024-01-22 18:00",
    status: "sent",
    clickRate: 95.8,
    openRate: 98.2,
  },
]

const colorSystem = {
  green: {
    primary: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-600",
    badge: "bg-green-500",
    hover: "hover:bg-green-50",
    icon: "text-green-500",
  },
  blue: {
    primary: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    badge: "bg-blue-500",
    hover: "hover:bg-blue-50",
    icon: "text-blue-500",
  },
  orange: {
    primary: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-500",
    hover: "hover:bg-orange-50",
    icon: "text-orange-500",
  },
  purple: {
    primary: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    badge: "bg-purple-500",
    hover: "hover:bg-purple-50",
    icon: "text-purple-500",
  },
  rose: {
    primary: "border-l-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-600",
    badge: "bg-rose-500",
    hover: "hover:bg-rose-50",
    icon: "text-rose-500",
  },
  indigo: {
    primary: "border-l-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    badge: "bg-indigo-500",
    hover: "hover:bg-indigo-50",
    icon: "text-indigo-500",
  },
  teal: {
    primary: "border-l-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-600",
    badge: "bg-teal-500",
    hover: "hover:bg-teal-50",
    icon: "text-teal-500",
  },
  pink: {
    primary: "border-l-pink-500",
    bg: "bg-pink-50",
    text: "text-pink-600",
    badge: "bg-pink-500",
    hover: "hover:bg-pink-50",
    icon: "text-pink-500",
  },
}

export default function MobileApplication() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedApp, setSelectedApp] = useState<MobileApp | null>(null)
  const [selectedUser, setSelectedUser] = useState<MobileUser | null>(null)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500"
      case "beta":
        return "bg-blue-500"
      case "development":
        return "bg-orange-500"
      case "maintenance":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "已发布"
      case "beta":
        return "测试版"
      case "development":
        return "开发中"
      case "maintenance":
        return "维护中"
      default:
        return "未知"
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "iOS":
        return "🍎"
      case "Android":
        return "🤖"
      case "Web":
        return "🌐"
      default:
        return "📱"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "销售":
        return "bg-blue-500"
      case "客服":
        return "bg-green-500"
      case "经理":
        return "bg-purple-500"
      case "管理员":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-500"
      case "warning":
        return "bg-orange-500"
      case "success":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      case "reminder":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50"
      case "high":
        return "text-orange-600 bg-orange-50"
      case "normal":
        return "text-blue-600 bg-blue-50"
      case "low":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  // 筛选应用
  const filteredApps = mockMobileApps.filter((app) => selectedPlatform === "all" || app.platform === selectedPlatform)

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            移动应用管理中心
          </h2>
          <p className="text-gray-600 mt-1">多平台移动应用开发、发布、用户管理和数据分析</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <QrCode className="w-4 h-4 mr-2" />
                下载二维码
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-pink-600" />
                  应用下载二维码
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">扫描二维码下载移动应用</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-2xl mb-1">🍎</div>
                    <div>iOS版</div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="text-2xl mb-1">🤖</div>
                    <div>Android版</div>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <div className="text-2xl mb-1">🌐</div>
                    <div>Web版</div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-300 bg-transparent shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Download className="w-4 h-4 mr-2" />
            发布管理
          </Button>
        </div>
      </div>

      {/* 导航标签 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 mb-6 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <BarChart3 className="w-4 h-4" />
            应用总览
          </TabsTrigger>
          <TabsTrigger
            value="apps"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Smartphone className="w-4 h-4" />
            应用管理
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Users className="w-4 h-4" />
            用户管理
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Layers className="w-4 h-4" />
            功能模块
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Bell className="w-4 h-4" />
            推送通知
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <TrendingUp className="w-4 h-4" />
            数据分析
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Settings className="w-4 h-4" />
            系统设置
          </TabsTrigger>
        </TabsList>

        {/* 应用总览页面 */}
        <TabsContent value="overview" className="mt-6">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.pink.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                  {mockMobileApps.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">应用总数</div>
                <div className="text-xs text-pink-600 mt-1">
                  {mockMobileApps.filter((app) => app.status === "published").length} 个已发布
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {mockMobileApps.reduce((sum, app) => sum + app.downloads, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">总下载量</div>
                <div className="text-xs text-blue-600 mt-1">+2,340 本周新增</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {mockMobileUsers.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">活跃用户</div>
                <div className="text-xs text-green-600 mt-1">
                  {mockMobileUsers.filter((user) => user.isOnline).length} 人在线
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {(mockMobileApps.reduce((sum, app) => sum + app.rating, 0) / mockMobileApps.length).toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">平均评分</div>
                <div className="text-xs text-orange-600 mt-1">
                  {mockMobileApps.reduce((sum, app) => sum + app.reviews, 0).toLocaleString()} 条评价
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 平台分布和用户活跃度 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                  平台分布统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMobileApps.map((app, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getPlatformIcon(app.platform)}</span>
                        <div>
                          <div className="font-medium">{app.platform}</div>
                          <div className="text-sm text-gray-600">v{app.version}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600">{app.downloads.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">下载量</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${colorSystem.teal.icon}`} />
                  用户活跃度分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">
                        {mockMobileUsers.filter((user) => user.isOnline).length}
                      </div>
                      <div className="text-sm text-gray-600">在线用户</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(
                          mockMobileUsers.reduce((sum, user) => sum + user.stats.performance, 0) /
                            mockMobileUsers.length,
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-600">平均绩效</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {["销售", "客服", "经理"].map((role, index) => {
                      const count = mockMobileUsers.filter((user) => user.role === role).length
                      const percentage = (count / mockMobileUsers.length) * 100
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getRoleColor(role)} text-white`}>{role}</Badge>
                            <span className="text-sm">{count}人</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2 progress-colorful" />
                            <span className="text-sm font-medium w-12">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 功能使用排行 */}
          <Card
            className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                功能使用排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockMobileFeatures
                  .sort((a, b) => b.usage - a.usage)
                  .slice(0, 6)
                  .map((feature, index) => (
                    <div key={feature.id} className="p-4 bg-indigo-50 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-500 text-white"
                              : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                  ? "bg-orange-500 text-white"
                                  : "bg-indigo-200 text-indigo-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-1">
                            <span className="text-lg">{feature.icon}</span>
                            {feature.name}
                          </div>
                          <div className="text-xs text-gray-600">{feature.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">使用率</div>
                        <div className="flex items-center gap-2">
                          <Progress value={feature.usage} className="w-16 h-2 progress-colorful" />
                          <span className="text-sm font-bold text-indigo-600">{feature.usage}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="text-sm text-gray-600">评分</div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{feature.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 应用管理页面 */}
        <TabsContent value="apps" className="mt-6">
          <Card
            className={`border-l-4 ${colorSystem.blue.primary} shadow-lg hover:shadow-xl transition-all duration-300 mb-6`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">平台筛选：</span>
                </div>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-40 border-2 focus:border-blue-500">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部平台</SelectItem>
                    <SelectItem value="iOS">iOS</SelectItem>
                    <SelectItem value="Android">Android</SelectItem>
                    <SelectItem value="Web">Web应用</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    新建应用
                  </Button>
                  <Button variant="outline" className="hover:bg-green-50 hover:border-green-300 bg-transparent">
                    <Upload className="w-4 h-4 mr-2" />
                    上传版本
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <Card
                key={app.id}
                className={`border-l-4 ${colorSystem.pink.primary} ${colorSystem.pink.hover} transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group`}
                onClick={() => setSelectedApp(app)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{getPlatformIcon(app.platform)}</div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-pink-600 transition-colors duration-300">
                          {app.name}
                        </CardTitle>
                        <div className="text-sm text-gray-600">v{app.version}</div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(app.status)} text-white shadow-sm`}>
                      {getStatusText(app.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-2">{app.description}</div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-pink-50 rounded-lg">
                      <div className="font-bold text-pink-600">{app.downloads.toLocaleString()}</div>
                      <div className="text-gray-600 text-xs">下载量</div>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <div className="font-bold text-yellow-600 flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {app.rating}
                      </div>
                      <div className="text-gray-600 text-xs">评分</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <div className="font-bold text-blue-600">{app.reviews.toLocaleString()}</div>
                      <div className="text-gray-600 text-xs">评价</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>更新：{app.lastUpdate}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span>大小：{app.size}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {app.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-pink-200 text-pink-700">
                        {feature}
                      </Badge>
                    ))}
                    {app.features.length > 3 && (
                      <Badge variant="outline" className="text-xs border-gray-200">
                        +{app.features.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-pink-50 hover:border-pink-300 bg-transparent"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      预览
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="hover:bg-green-50 hover:border-green-300 bg-transparent"
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 用户管理页面 */}
        <TabsContent value="users" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {mockMobileUsers.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">总用户数</div>
                <div className="text-xs text-green-600 mt-1">+12 本周新增</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {mockMobileUsers.filter((user) => user.isOnline).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">在线用户</div>
                <div className="text-xs text-blue-600 mt-1">
                  {((mockMobileUsers.filter((user) => user.isOnline).length / mockMobileUsers.length) * 100).toFixed(0)}
                  % 在线率
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {mockMobileUsers.reduce((sum, user) => sum + user.stats.callsToday, 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">今日通话</div>
                <div className="text-xs text-orange-600 mt-1">总通话次数</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {Math.round(
                    mockMobileUsers.reduce((sum, user) => sum + user.stats.performance, 0) / mockMobileUsers.length,
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600 mt-1">平均绩效</div>
                <div className="text-xs text-purple-600 mt-1">团队表现</div>
              </CardContent>
            </Card>
          </div>

          {/* 用户列表 */}
          <Card
            className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  移动用户管理
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" className="hover:bg-green-50 hover:border-green-300 bg-transparent">
                    <Plus className="w-4 h-4 mr-2" />
                    添加用户
                  </Button>
                  <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    导出数据
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMobileUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 border rounded-lg hover:bg-green-50 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={user.avatar || "/placeholder.svg"}
                            alt={user.name}
                            className="w-12 h-12 rounded-full border-2 border-green-200"
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              user.isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {user.name}
                            <Badge className={`${getRoleColor(user.role)} text-white text-xs`}>{user.role}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">{user.department}</div>
                          <div className="text-xs text-gray-500">最后活跃：{user.lastActive}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">绩效评分</div>
                        <div className="flex items-center gap-2">
                          <Progress value={user.stats.performance} className="w-16 h-2 progress-colorful" />
                          <span className="text-sm font-bold text-green-600">{user.stats.performance}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{user.deviceInfo.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        <span>
                          {user.deviceInfo.platform} {user.deviceInfo.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gray-500" />
                        <span>{user.deviceInfo.model}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center text-sm bg-gray-50 p-3 rounded-lg">
                      <div>
                        <div className="font-bold text-blue-600">{user.stats.callsToday}</div>
                        <div className="text-gray-600 text-xs">今日通话</div>
                      </div>
                      <div>
                        <div className="font-bold text-green-600">{user.stats.customersManaged}</div>
                        <div className="text-gray-600 text-xs">管理客户</div>
                      </div>
                      <div>
                        <div className="font-bold text-orange-600">{user.stats.tasksCompleted}</div>
                        <div className="text-gray-600 text-xs">完成任务</div>
                      </div>
                      <div>
                        <div className="font-bold text-purple-600">{user.stats.performance}%</div>
                        <div className="text-gray-600 text-xs">绩效评分</div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300 bg-transparent"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        消息
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        权限
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-purple-50 hover:border-purple-300 bg-transparent"
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        统计
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 功能模块页面 */}
        <TabsContent value="features" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mockMobileFeatures.map((feature) => (
              <Card
                key={feature.id}
                className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl hover:scale-105`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{feature.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{feature.name}</CardTitle>
                        <div className="text-sm text-gray-600">{feature.category}</div>
                      </div>
                    </div>
                    <Switch checked={feature.isEnabled} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">{feature.description}</div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-purple-50 rounded-lg">
                      <div className="font-bold text-purple-600">{feature.usage}%</div>
                      <div className="text-gray-600 text-xs">使用率</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 rounded-lg">
                      <div className="font-bold text-yellow-600 flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {feature.rating}
                      </div>
                      <div className="text-gray-600 text-xs">评分</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>最后使用：{feature.lastUsed}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">使用率</span>
                    <div className="flex items-center gap-2">
                      <Progress value={feature.usage} className="w-20 h-2 progress-colorful" />
                      <span className="text-sm font-medium">{feature.usage}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-purple-50 hover:border-purple-300 bg-transparent"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      配置
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      统计
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 功能分类统计 */}
          <Card
            className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl mt-8`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                功能模块统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {["核心功能", "辅助工具", "数据分析", "系统设置"].map((category, index) => {
                  const features = mockMobileFeatures.filter((f) => f.category === category)
                  const avgUsage = features.reduce((sum, f) => sum + f.usage, 0) / features.length
                  const avgRating = features.reduce((sum, f) => sum + f.rating, 0) / features.length
                  return (
                    <div key={index} className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-lg font-bold text-indigo-600">{features.length}</div>
                      <div className="text-sm text-gray-600 mb-2">{category}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>平均使用率：</span>
                          <span className="font-medium">{avgUsage.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>平均评分：</span>
                          <span className="font-medium">{avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 推送通知页面 */}
        <TabsContent value="notifications" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {mockPushNotifications.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">总通知数</div>
                <div className="text-xs text-orange-600 mt-1">本月发送</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {mockPushNotifications.filter((n) => n.status === "sent").length}
                </div>
                <div className="text-sm text-gray-600 mt-1">已发送</div>
                <div className="text-xs text-green-600 mt-1">成功发送</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {(
                    mockPushNotifications.reduce((sum, n) => sum + n.openRate, 0) / mockPushNotifications.length
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-gray-600 mt-1">平均打开率</div>
                <div className="text-xs text-blue-600 mt-1">用户参与度</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {(
                    mockPushNotifications.reduce((sum, n) => sum + n.clickRate, 0) / mockPushNotifications.length
                  ).toFixed(1)}
                  %
                </div>
                <div className="text-sm text-gray-600 mt-1">平均点击率</div>
                <div className="text-xs text-purple-600 mt-1">转化效果</div>
              </CardContent>
            </Card>
          </div>

          {/* 推送通知管理 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                    推送通知列表
                  </CardTitle>
                  <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                        <Plus className="w-4 h-4 mr-2" />
                        新建通知
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Bell className="w-5 h-5 text-orange-600" />
                          创建推送通知
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">通知标题</label>
                            <Input placeholder="请输入通知标题" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">通知类型</label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="选择类型" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="info">信息通知</SelectItem>
                                <SelectItem value="warning">警告通知</SelectItem>
                                <SelectItem value="success">成功通知</SelectItem>
                                <SelectItem value="error">错误通知</SelectItem>
                                <SelectItem value="reminder">提醒通知</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">通知内容</label>
                          <Textarea placeholder="请输入通知内容..." rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">优先级</label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="选择优先级" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">低</SelectItem>
                                <SelectItem value="normal">普通</SelectItem>
                                <SelectItem value="high">高</SelectItem>
                                <SelectItem value="urgent">紧急</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">目标用户</label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="选择用户群体" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">全部用户</SelectItem>
                                <SelectItem value="sales">销售人员</SelectItem>
                                <SelectItem value="service">客服人员</SelectItem>
                                <SelectItem value="manager">管理人员</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">发送时间</label>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 bg-transparent">
                              立即发送
                            </Button>
                            <Button variant="outline" className="flex-1 bg-transparent">
                              定时发送
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsNotificationDialogOpen(false)}>
                          取消
                        </Button>
                        <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                          发送通知
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPushNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border rounded-lg hover:bg-orange-50 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getNotificationTypeColor(notification.type)} text-white`}>
                            {notification.type === "info"
                              ? "信息"
                              : notification.type === "warning"
                                ? "警告"
                                : notification.type === "success"
                                  ? "成功"
                                  : notification.type === "error"
                                    ? "错误"
                                    : "提醒"}
                          </Badge>
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority === "urgent"
                              ? "紧急"
                              : notification.priority === "high"
                                ? "高"
                                : notification.priority === "normal"
                                  ? "普通"
                                  : "低"}
                          </Badge>
                        </div>
                        <Badge className={notification.status === "sent" ? "bg-green-500" : "bg-gray-500"}>
                          {notification.status === "sent" ? "已发送" : "草稿"}
                        </Badge>
                      </div>
                      <div className="font-medium mb-1">{notification.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{notification.message}</div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>发送时间：{notification.sentTime}</span>
                        <span>
                          目标：
                          {Array.isArray(notification.targetUsers)
                            ? notification.targetUsers.join(", ")
                            : notification.targetUsers}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div className="flex justify-between">
                          <span>打开率：</span>
                          <span className="font-medium text-blue-600">{notification.openRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>点击率：</span>
                          <span className="font-medium text-purple-600">{notification.clickRate}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className={`w-5 h-5 ${colorSystem.teal.icon}`} />
                  推送效果分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-teal-600">通知类型效果</h4>
                    <div className="space-y-2">
                      {["info", "warning", "success", "error", "reminder"].map((type, index) => {
                        const notifications = mockPushNotifications.filter((n) => n.type === type)
                        const avgOpenRate =
                          notifications.length > 0
                            ? notifications.reduce((sum, n) => sum + n.openRate, 0) / notifications.length
                            : 0
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={`${getNotificationTypeColor(type)} text-white text-xs`}>
                                {type === "info"
                                  ? "信息"
                                  : type === "warning"
                                    ? "警告"
                                    : type === "success"
                                      ? "成功"
                                      : type === "error"
                                        ? "错误"
                                        : "提醒"}
                              </Badge>
                              <span className="text-sm">{notifications.length}条</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={avgOpenRate} className="w-16 h-2 progress-colorful" />
                              <span className="text-sm font-medium w-12">{avgOpenRate.toFixed(1)}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-teal-600">最佳发送时间</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-teal-50 rounded-lg">
                        <div className="font-bold text-teal-600">上午9-11点</div>
                        <div className="text-gray-600">工作通知</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="font-bold text-blue-600">下午2-4点</div>
                        <div className="text-gray-600">业务提醒</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="font-bold text-green-600">晚上6-8点</div>
                        <div className="text-gray-600">成果分享</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="font-bold text-orange-600">紧急通知</div>
                        <div className="text-gray-600">随时发送</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-teal-600">优化建议</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>成功通知的打开率最高，建议多使用正面反馈</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span>个性化推送可提升15%的点击率</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span>避免在休息时间发送非紧急通知</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 数据分析页面 */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${colorSystem.teal.icon}`} />
                  应用使用趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <div className="text-2xl font-bold text-teal-600">+23%</div>
                      <div className="text-sm text-gray-600">月活跃增长</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">4.2小时</div>
                      <div className="text-sm text-gray-600">日均使用时长</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-sm text-gray-600">用户留存率</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-teal-600">平台使用分布</h4>
                    <div className="space-y-2">
                      {mockMobileApps.map((app, index) => {
                        const percentage =
                          (app.downloads / mockMobileApps.reduce((sum, a) => sum + a.downloads, 0)) * 100
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getPlatformIcon(app.platform)}</span>
                              <span className="text-sm font-medium">{app.platform}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={percentage} className="w-20 h-2 progress-colorful" />
                              <span className="text-sm font-medium w-12">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  用户行为分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 text-indigo-600">功能使用热力图</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {mockMobileFeatures.slice(0, 6).map((feature, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-center text-xs ${
                            feature.usage >= 80
                              ? "bg-red-500 text-white"
                              : feature.usage >= 60
                                ? "bg-orange-500 text-white"
                                : feature.usage >= 40
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-500 text-white"
                          }`}
                        >
                          <div className="font-medium">{feature.name}</div>
                          <div>{feature.usage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-indigo-600">用户活跃时段</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { time: "09:00-12:00", usage: 85, label: "上午工作时间" },
                        { time: "14:00-17:00", usage: 92, label: "下午工作时间" },
                        { time: "19:00-21:00", usage: 67, label: "晚间时间" },
                        { time: "21:00-23:00", usage: 34, label: "夜间时间" },
                      ].map((period, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{period.time}</div>
                            <div className="text-xs text-gray-600">{period.label}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={period.usage} className="w-16 h-2 progress-colorful" />
                            <span className="text-sm font-medium w-8">{period.usage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 性能监控 */}
          <Card
            className={`border-l-4 ${colorSystem.rose.primary} ${colorSystem.rose.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className={`w-5 h-5 ${colorSystem.rose.icon}`} />
                应用性能监控
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-rose-600">性能指标</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">应用启动时间</span>
                      <span className="font-medium text-green-600">1.2秒</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">内存使用率</span>
                      <span className="font-medium text-blue-600">68%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CPU使用率</span>
                      <span className="font-medium text-orange-600">23%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">网络延迟</span>
                      <span className="font-medium text-purple-600">45ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">崩溃率</span>
                      <span className="font-medium text-green-600">0.02%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-rose-600">错误监控</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-green-50 rounded text-sm">
                      <div className="font-medium text-green-600">系统稳定</div>
                      <div className="text-gray-600">无严重错误</div>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded text-sm">
                      <div className="font-medium text-yellow-600">网络超时</div>
                      <div className="text-gray-600">3次/小时</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <div className="font-medium text-blue-600">API响应慢</div>
                      <div className="text-gray-600">偶发性</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-rose-600">优化建议</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>应用性能表现良好</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>可优化图片加载速度</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                      <Zap className="w-4 h-4 text-orange-500" />
                      <span>建议启用数据缓存</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统设置页面 */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card
              className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  应用配置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-indigo-600">基础设置</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">自动更新</div>
                          <div className="text-sm text-gray-600">应用自动检查和安装更新</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">推送通知</div>
                          <div className="text-sm text-gray-600">允许应用发送推送通知</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">数据同步</div>
                          <div className="text-sm text-gray-600">自动同步数据到云端</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">离线模式</div>
                          <div className="text-sm text-gray-600">支持离线工作模式</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-indigo-600">安全设置</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">生物识别登录</div>
                          <div className="text-sm text-gray-600">指纹或面部识别登录</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">数据加密</div>
                          <div className="text-sm text-gray-600">本地数据加密存储</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">远程擦除</div>
                          <div className="text-sm text-gray-600">支持远程清除应用数据</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className={`w-5 h-5 ${colorSystem.teal.icon}`} />
                  权限管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-teal-600">系统权限</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">相机权限</div>
                            <div className="text-sm text-gray-600">拍照和录像功能</div>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">麦克风权限</div>
                            <div className="text-sm text-gray-600">录音和语音识别</div>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">位置权限</div>
                            <div className="text-sm text-gray-600">获取地理位置信息</div>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">通话权限</div>
                            <div className="text-sm text-gray-600">拨打电话功能</div>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-teal-600">数据权限</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">客户数据访问</div>
                          <div className="text-sm text-gray-600">查看和编辑客户信息</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">通话记录访问</div>
                          <div className="text-sm text-gray-600">查看通话历史记录</div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">数据导出</div>
                          <div className="text-sm text-gray-600">导出数据到本地</div>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 版本管理 */}
          <Card
            className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl mt-6`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                版本管理与发布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockMobileApps.map((app, index) => (
                  <div key={index} className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getPlatformIcon(app.platform)}</span>
                      <div>
                        <div className="font-semibold">{app.platform}</div>
                        <div className="text-sm text-gray-600">当前版本 v{app.version}</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>发布状态：</span>
                        <Badge className={`${getStatusColor(app.status)} text-white`}>
                          {getStatusText(app.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>下载量：</span>
                        <span className="font-medium">{app.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>最后更新：</span>
                        <span className="font-medium">{app.lastUpdate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Edit className="w-3 h-3 mr-1" />
                        编辑
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Upload className="w-3 h-3 mr-1" />
                        发布
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 应用详情弹窗 */}
      {selectedApp && (
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-pink-600" />
                应用详情 - {selectedApp.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="p-4 bg-pink-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-pink-600">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">应用名称：</span>
                      <span className="font-medium">{selectedApp.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平台：</span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getPlatformIcon(selectedApp.platform)}</span>
                        <span className="font-medium">{selectedApp.platform}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">版本：</span>
                      <span className="font-medium">v{selectedApp.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">状态：</span>
                      <Badge className={`${getStatusColor(selectedApp.status)} text-white`}>
                        {getStatusText(selectedApp.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">大小：</span>
                      <span className="font-medium">{selectedApp.size}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-blue-600">下载统计</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">总下载量：</span>
                      <span className="font-medium">{selectedApp.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">用户评分：</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="font-medium">{selectedApp.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">评价数量：</span>
                      <span className="font-medium">{selectedApp.reviews.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-green-600">功能特性</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="border-green-200 text-green-700">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-orange-600">兼容性</h4>
                  <div className="space-y-1 text-sm">
                    {selectedApp.compatibility.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-purple-600">版本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">发布日期：</span>
                      <span className="font-medium">{selectedApp.releaseDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最后更新：</span>
                      <span className="font-medium">{selectedApp.lastUpdate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3 text-gray-700">应用描述</h4>
              <p className="text-sm text-gray-600">{selectedApp.description}</p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                关闭
              </Button>
              <Button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                编辑应用
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
