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
  FileText,
  Plus,
  Edit,
  Copy,
  Eye,
  Download,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Brain,
  Zap,
  Target,
  Users,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  Activity,
  Search,
  Filter,
  Share2,
  Link,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react"

// 表单字段类型
interface FormField {
  id: string
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "date" | "phone" | "email" | "number" | "file"
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  conditional?: {
    dependsOn: string
    value: string
    action: "show" | "hide"
  }
}

// 表单模板类型
interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  fields: FormField[]
  settings: {
    title: string
    description: string
    submitText: string
    successMessage: string
    allowMultiple: boolean
    requireLogin: boolean
    collectEmail: boolean
  }
  status: "draft" | "published" | "archived"
  createdAt: string
  updatedAt: string
  submissions: number
  conversionRate: number
  averageTime: number
  tags: string[]
}

// 表单提交数据类型
interface FormSubmission {
  id: string
  formId: string
  formName: string
  data: Record<string, any>
  submittedAt: string
  submitterInfo: {
    ip: string
    userAgent: string
    location: string
    device: string
  }
  status: "new" | "processed" | "contacted" | "converted"
  score: number
  tags: string[]
  notes: string
}

// 表单统计类型
interface FormAnalytics {
  formId: string
  formName: string
  totalViews: number
  totalSubmissions: number
  conversionRate: number
  averageTime: number
  bounceRate: number
  topSources: { source: string; count: number }[]
  deviceStats: { device: string; percentage: number }[]
  timeStats: { hour: number; submissions: number }[]
  fieldStats: { fieldId: string; completionRate: number }[]
}

// 模拟表单模板数据
const mockFormTemplates: FormTemplate[] = [
  {
    id: "1",
    name: "客户需求调研表",
    description: "收集客户的家装需求和预算信息",
    category: "客户调研",
    fields: [
      {
        id: "name",
        type: "text",
        label: "姓名",
        placeholder: "请输入您的姓名",
        required: true,
      },
      {
        id: "phone",
        type: "phone",
        label: "联系电话",
        placeholder: "请输入手机号码",
        required: true,
        validation: {
          pattern: "^1[3-9]\\d{9}$",
          message: "请输入正确的手机号码",
        },
      },
      {
        id: "email",
        type: "email",
        label: "邮箱地址",
        placeholder: "请输入邮箱地址",
        required: false,
      },
      {
        id: "projectType",
        type: "select",
        label: "项目类型",
        required: true,
        options: ["全屋整装", "局部装修", "家具配置", "设计服务"],
      },
      {
        id: "budget",
        type: "select",
        label: "预算范围",
        required: true,
        options: ["10万以下", "10-20万", "20-40万", "40-60万", "60万以上"],
      },
      {
        id: "requirements",
        type: "textarea",
        label: "具体需求",
        placeholder: "请详细描述您的需求...",
        required: false,
      },
    ],
    settings: {
      title: "客户需求调研",
      description: "请填写以下信息，我们将为您提供专业的家装建议",
      submitText: "提交需求",
      successMessage: "感谢您的提交！我们将在24小时内联系您。",
      allowMultiple: false,
      requireLogin: false,
      collectEmail: true,
    },
    status: "published",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    submissions: 1250,
    conversionRate: 68.5,
    averageTime: 180,
    tags: ["客户获取", "需求收集", "高转化"],
  },
  {
    id: "2",
    name: "产品满意度调查",
    description: "收集客户对产品和服务的满意度反馈",
    category: "满意度调查",
    fields: [
      {
        id: "customerName",
        type: "text",
        label: "客户姓名",
        required: true,
      },
      {
        id: "orderNumber",
        type: "text",
        label: "订单号",
        required: true,
      },
      {
        id: "productSatisfaction",
        type: "radio",
        label: "产品满意度",
        required: true,
        options: ["非常满意", "满意", "一般", "不满意", "非常不满意"],
      },
      {
        id: "serviceSatisfaction",
        type: "radio",
        label: "服务满意度",
        required: true,
        options: ["非常满意", "满意", "一般", "不满意", "非常不满意"],
      },
      {
        id: "recommendation",
        type: "radio",
        label: "推荐意愿",
        required: true,
        options: ["非常愿意", "愿意", "一般", "不愿意", "非常不愿意"],
      },
      {
        id: "feedback",
        type: "textarea",
        label: "意见建议",
        placeholder: "请分享您的宝贵意见...",
        required: false,
      },
    ],
    settings: {
      title: "产品满意度调查",
      description: "您的反馈对我们非常重要，帮助我们提供更好的产品和服务",
      submitText: "提交反馈",
      successMessage: "感谢您的宝贵反馈！",
      allowMultiple: false,
      requireLogin: false,
      collectEmail: false,
    },
    status: "published",
    createdAt: "2024-01-18",
    updatedAt: "2024-01-22",
    submissions: 890,
    conversionRate: 85.2,
    averageTime: 120,
    tags: ["满意度", "客户反馈", "服务改进"],
  },
  {
    id: "3",
    name: "预约到店体验表",
    description: "客户预约到店体验的信息收集",
    category: "预约管理",
    fields: [
      {
        id: "customerName",
        type: "text",
        label: "客户姓名",
        required: true,
      },
      {
        id: "phone",
        type: "phone",
        label: "联系电话",
        required: true,
      },
      {
        id: "preferredDate",
        type: "date",
        label: "期望日期",
        required: true,
      },
      {
        id: "preferredTime",
        type: "select",
        label: "期望时间",
        required: true,
        options: ["上午9-12点", "下午1-5点", "晚上6-8点"],
      },
      {
        id: "storeLocation",
        type: "select",
        label: "门店选择",
        required: true,
        options: ["北京朝阳店", "上海浦东店", "深圳南山店", "广州天河店"],
      },
      {
        id: "interests",
        type: "checkbox",
        label: "感兴趣的产品",
        required: false,
        options: ["沙发", "床具", "餐桌椅", "茶几", "电视柜", "衣柜"],
      },
      {
        id: "specialRequests",
        type: "textarea",
        label: "特殊要求",
        placeholder: "如有特殊要求请说明...",
        required: false,
      },
    ],
    settings: {
      title: "预约到店体验",
      description: "预约到店体验，享受专业的产品介绍和设计建议",
      submitText: "确认预约",
      successMessage: "预约成功！我们将在1小时内电话确认。",
      allowMultiple: false,
      requireLogin: false,
      collectEmail: true,
    },
    status: "published",
    createdAt: "2024-01-20",
    updatedAt: "2024-01-22",
    submissions: 456,
    conversionRate: 92.3,
    averageTime: 150,
    tags: ["预约管理", "到店体验", "高转化"],
  },
]

// 模拟提交数据
const mockSubmissions: FormSubmission[] = [
  {
    id: "1",
    formId: "1",
    formName: "客户需求调研表",
    data: {
      name: "张明",
      phone: "138****8888",
      email: "zhang.ming@email.com",
      projectType: "全屋整装",
      budget: "30-50万",
      requirements: "现代简约风格，三室两厅，注重环保材质",
    },
    submittedAt: "2024-01-22 14:30",
    submitterInfo: {
      ip: "192.168.1.100",
      userAgent: "Chrome/120.0.0.0",
      location: "北京市朝阳区",
      device: "Desktop",
    },
    status: "processed",
    score: 95,
    tags: ["高意向", "预算充足", "环保要求"],
    notes: "客户对环保材质要求很高，已安排专业顾问跟进",
  },
  {
    id: "2",
    formId: "2",
    formName: "产品满意度调查",
    data: {
      customerName: "李华",
      orderNumber: "ZY202401001",
      productSatisfaction: "非常满意",
      serviceSatisfaction: "满意",
      recommendation: "非常愿意",
      feedback: "产品质量很好，服务也很专业，会推荐给朋友",
    },
    submittedAt: "2024-01-22 16:15",
    submitterInfo: {
      ip: "192.168.1.101",
      userAgent: "Safari/17.0",
      location: "上海市浦东新区",
      device: "Mobile",
    },
    status: "new",
    score: 88,
    tags: ["满意客户", "推荐意愿强", "复购潜力"],
    notes: "客户满意度很高，可以邀请参与推荐活动",
  },
  {
    id: "3",
    formId: "3",
    formName: "预约到店体验表",
    data: {
      customerName: "王芳",
      phone: "139****6666",
      preferredDate: "2024-01-25",
      preferredTime: "下午1-5点",
      storeLocation: "深圳南山店",
      interests: ["沙发", "茶几"],
      specialRequests: "希望看真皮沙发",
    },
    submittedAt: "2024-01-22 18:45",
    submitterInfo: {
      ip: "192.168.1.102",
      userAgent: "Chrome/120.0.0.0",
      location: "深圳市南山区",
      device: "Tablet",
    },
    status: "contacted",
    score: 82,
    tags: ["预约客户", "真皮偏好", "到店意向"],
    notes: "已电话确认预约，客户对真皮沙发很感兴趣",
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
}

export default function IntelligentForms() {
  const [activeTab, setActiveTab] = useState("overview")
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>(mockFormTemplates)
  const [submissions, setSubmissions] = useState<FormSubmission[]>(mockSubmissions)
  const [selectedForm, setSelectedForm] = useState<FormTemplate | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // 筛选表单模板
  const filteredTemplates = formTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter
    const matchesStatus = statusFilter === "all" || template.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500"
      case "draft":
        return "bg-orange-500"
      case "archived":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "已发布"
      case "draft":
        return "草稿"
      case "archived":
        return "已归档"
      default:
        return "未知"
    }
  }

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500"
      case "processed":
        return "bg-orange-500"
      case "contacted":
        return "bg-purple-500"
      case "converted":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getSubmissionStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "新提交"
      case "processed":
        return "已处理"
      case "contacted":
        return "已联系"
      case "converted":
        return "已转化"
      default:
        return "未知"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50"
    if (score >= 80) return "text-blue-600 bg-blue-50"
    if (score >= 70) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }

  // 统计数据计算
  const totalForms = formTemplates.length
  const publishedForms = formTemplates.filter((f) => f.status === "published").length
  const totalSubmissions = submissions.length
  const averageConversion = formTemplates.reduce((sum, f) => sum + f.conversionRate, 0) / totalForms

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            智能表单管理中心
          </h2>
          <p className="text-gray-600 mt-1">拖拽式表单设计，智能数据收集，自动化处理流程</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              创建表单
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                创建新表单
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">表单名称</label>
                  <Input placeholder="请输入表单名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">表单分类</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="客户调研">客户调研</SelectItem>
                      <SelectItem value="满意度调查">满意度调查</SelectItem>
                      <SelectItem value="预约管理">预约管理</SelectItem>
                      <SelectItem value="信息收集">信息收集</SelectItem>
                      <SelectItem value="反馈建议">反馈建议</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">表单描述</label>
                <Textarea placeholder="请描述表单的用途和目标..." rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">创建方式</label>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 cursor-pointer hover:bg-teal-50 border-2 hover:border-teal-300 transition-all duration-300">
                    <div className="text-center">
                      <Plus className="w-8 h-8 mx-auto mb-2 text-teal-600" />
                      <div className="font-medium">从空白开始</div>
                      <div className="text-xs text-gray-600">自定义设计</div>
                    </div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:bg-blue-50 border-2 hover:border-blue-300 transition-all duration-300">
                    <div className="text-center">
                      <Copy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <div className="font-medium">使用模板</div>
                      <div className="text-xs text-gray-600">快速创建</div>
                    </div>
                  </Card>
                  <Card className="p-4 cursor-pointer hover:bg-purple-50 border-2 hover:border-purple-300 transition-all duration-300">
                    <div className="text-center">
                      <Brain className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <div className="font-medium">AI生成</div>
                      <div className="text-xs text-gray-600">智能推荐</div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                开始创建
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 导航标签 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <BarChart3 className="w-4 h-4" />
            数据总览
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <FileText className="w-4 h-4" />
            表单管理
          </TabsTrigger>
          <TabsTrigger
            value="designer"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Edit className="w-4 h-4" />
            表单设计器
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Users className="w-4 h-4" />
            数据收集
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <PieChart className="w-4 h-4" />
            数据分析
          </TabsTrigger>
          <TabsTrigger
            value="automation"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Zap className="w-4 h-4" />
            自动化
          </TabsTrigger>
        </TabsList>

        {/* 数据总览页面 */}
        <TabsContent value="overview" className="mt-6">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.teal.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-800 bg-clip-text text-transparent">
                  {totalForms}
                </div>
                <div className="text-sm text-gray-600 mt-1">表单总数</div>
                <div className="text-xs text-teal-600 mt-1">{publishedForms} 个已发布</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {totalSubmissions.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">总提交数</div>
                <div className="text-xs text-blue-600 mt-1">+156 今日新增</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {averageConversion.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">平均转化率</div>
                <div className="text-xs text-green-600 mt-1">+5.2% 较上月</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  150
                </div>
                <div className="text-sm text-gray-600 mt-1">平均完成时间(秒)</div>
                <div className="text-xs text-orange-600 mt-1">优化中</div>
              </CardContent>
            </Card>
          </div>

          {/* 表单性能排行 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  高转化率表单
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formTemplates
                    .sort((a, b) => b.conversionRate - a.conversionRate)
                    .slice(0, 5)
                    .map((form, index) => (
                      <div key={form.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-white"
                                : index === 1
                                  ? "bg-gray-400 text-white"
                                  : index === 2
                                    ? "bg-orange-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{form.name}</div>
                            <div className="text-xs text-gray-600">{form.submissions} 次提交</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{form.conversionRate.toFixed(1)}%</div>
                          <Progress value={form.conversionRate} className="w-16 h-1 mt-1" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  表单分类统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["客户调研", "满意度调查", "预约管理", "信息收集", "反馈建议"].map((category, index) => {
                    const count = formTemplates.filter((f) => f.category === category).length
                    const percentage = (count / totalForms) * 100
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0
                                ? "bg-blue-500"
                                : index === 1
                                  ? "bg-green-500"
                                  : index === 2
                                    ? "bg-orange-500"
                                    : index === 3
                                      ? "bg-purple-500"
                                      : "bg-rose-500"
                            }`}
                          ></div>
                          <span className="text-sm font-medium">{category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 最近活动 */}
          <Card
            className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                最近活动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: "submission", form: "客户需求调研表", user: "张明", time: "5分钟前", status: "new" },
                  {
                    type: "form_created",
                    form: "产品体验反馈表",
                    user: "系统管理员",
                    time: "1小时前",
                    status: "created",
                  },
                  { type: "submission", form: "预约到店体验表", user: "李华", time: "2小时前", status: "processed" },
                  {
                    type: "form_published",
                    form: "客户满意度调查",
                    user: "市场部",
                    time: "3小时前",
                    status: "published",
                  },
                  { type: "submission", form: "产品满意度调查", user: "王芳", time: "4小时前", status: "converted" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "submission"
                          ? "bg-green-500"
                          : activity.type === "form_created"
                            ? "bg-blue-500"
                            : activity.type === "form_published"
                              ? "bg-purple-500"
                              : "bg-orange-500"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="text-sm">
                        {activity.type === "submission" && (
                          <>
                            <span className="font-medium">{activity.user}</span> 提交了
                            <span className="font-medium text-purple-600"> {activity.form}</span>
                          </>
                        )}
                        {activity.type === "form_created" && (
                          <>
                            <span className="font-medium">{activity.user}</span> 创建了表单
                            <span className="font-medium text-blue-600"> {activity.form}</span>
                          </>
                        )}
                        {activity.type === "form_published" && (
                          <>
                            <span className="font-medium">{activity.user}</span> 发布了表单
                            <span className="font-medium text-green-600"> {activity.form}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">{activity.time}</div>
                    </div>
                    <Badge
                      className={`${
                        activity.status === "new"
                          ? "bg-blue-500"
                          : activity.status === "processed"
                            ? "bg-orange-500"
                            : activity.status === "converted"
                              ? "bg-green-500"
                              : activity.status === "created"
                                ? "bg-purple-500"
                                : "bg-gray-500"
                      } text-white text-xs`}
                    >
                      {activity.status === "new"
                        ? "新"
                        : activity.status === "processed"
                          ? "已处理"
                          : activity.status === "converted"
                            ? "已转化"
                            : activity.status === "created"
                              ? "已创建"
                              : activity.status === "published"
                                ? "已发布"
                                : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 表单管理页面 */}
        <TabsContent value="templates" className="mt-6">
          {/* 搜索和筛选 */}
          <Card
            className={`border-l-4 ${colorSystem.blue.primary} shadow-lg hover:shadow-xl transition-all duration-300 mb-6`}
          >
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="搜索表单名称或描述..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-2 focus:border-blue-500 transition-colors duration-300"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40 border-2 focus:border-blue-500">
                    <SelectValue placeholder="分类筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    <SelectItem value="客户调研">客户调研</SelectItem>
                    <SelectItem value="满意度调查">满意度调查</SelectItem>
                    <SelectItem value="预约管理">预约管理</SelectItem>
                    <SelectItem value="信息收集">信息收集</SelectItem>
                    <SelectItem value="反馈建议">反馈建议</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 border-2 focus:border-blue-500">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 表单列表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group`}
                onClick={() => setSelectedForm(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-teal-600 transition-colors duration-300">
                      {template.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={`${getStatusColor(template.status)} text-white shadow-sm`}>
                        {getStatusText(template.status)}
                      </Badge>
                      <Badge variant="outline" className="text-teal-600 border-teal-200">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 line-clamp-2">{template.description}</div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-teal-50 rounded-lg">
                      <div className="font-bold text-teal-600">{template.submissions}</div>
                      <div className="text-gray-600">提交数</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                      <div className="font-bold text-green-600">{template.conversionRate.toFixed(1)}%</div>
                      <div className="text-gray-600">转化率</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>平均完成时间：{template.averageTime}秒</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-teal-200 text-teal-700">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs border-gray-200">
                        +{template.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-600">
                    <span>创建：{template.createdAt}</span>
                    <span>更新：{template.updatedAt}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-teal-50 hover:border-teal-300 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedForm(template)
                        setIsPreviewDialogOpen(true)
                      }}
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

          {/* 空状态 */}
          {filteredTemplates.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无表单</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
                    ? "没有找到符合条件的表单，请调整筛选条件"
                    : "还没有创建表单，点击上方按钮创建第一个表单"}
                </p>
                {!searchTerm && categoryFilter === "all" && statusFilter === "all" && (
                  <Button
                    className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    创建表单
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 表单设计器页面 */}
        <TabsContent value="designer" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 组件面板 */}
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                  表单组件
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">基础组件</div>
                  {[
                    { type: "text", label: "单行文本", icon: "📝" },
                    { type: "textarea", label: "多行文本", icon: "📄" },
                    { type: "select", label: "下拉选择", icon: "📋" },
                    { type: "radio", label: "单选按钮", icon: "⚪" },
                    { type: "checkbox", label: "多选框", icon: "☑️" },
                    { type: "date", label: "日期选择", icon: "📅" },
                    { type: "phone", label: "手机号码", icon: "📱" },
                    { type: "email", label: "邮箱地址", icon: "📧" },
                    { type: "number", label: "数字输入", icon: "🔢" },
                    { type: "file", label: "文件上传", icon: "📎" },
                  ].map((component, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                      draggable
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{component.icon}</span>
                        <span className="text-sm font-medium">{component.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 设计画布 */}
            <div className="lg:col-span-2">
              <Card
                className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl min-h-[600px]`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Edit className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                      表单设计画布
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        预览
                      </Button>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        保存
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[500px] bg-gray-50">
                    <div className="text-center text-gray-500">
                      <Edit className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">从左侧拖拽组件到此处开始设计表单</div>
                      <div className="text-xs mt-1">或选择模板快速开始</div>
                    </div>

                    {/* 示例表单预览 */}
                    <div className="mt-8 max-w-md mx-auto space-y-4 bg-white p-6 rounded-lg shadow-sm">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">客户需求调研表</h3>
                        <p className="text-sm text-gray-600">请填写以下信息，我们将为您提供专业建议</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">姓名 *</label>
                        <Input placeholder="请输入您的姓名" disabled />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">联系电话 *</label>
                        <Input placeholder="请输入手机号码" disabled />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">项目类型 *</label>
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择项目类型" />
                          </SelectTrigger>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">具体需求</label>
                        <Textarea placeholder="请详细描述您的需求..." rows={3} disabled />
                      </div>

                      <Button className="w-full bg-teal-500 hover:bg-teal-600" disabled>
                        提交需求
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 属性面板 */}
            <Card
              className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  属性设置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">表单设置</div>

                  <div>
                    <label className="block text-sm font-medium mb-1">表单标题</label>
                    <Input placeholder="请输入表单标题" defaultValue="客户需求调研表" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">表单描述</label>
                    <Textarea placeholder="请输入表单描述" rows={2} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">提交按钮文字</label>
                    <Input placeholder="提交" defaultValue="提交需求" />
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">高级设置</div>

                    <label className="flex items-center">
                      <Switch defaultChecked />
                      <span className="ml-2 text-sm">允许重复提交</span>
                    </label>

                    <label className="flex items-center">
                      <Switch />
                      <span className="ml-2 text-sm">需要登录</span>
                    </label>

                    <label className="flex items-center">
                      <Switch defaultChecked />
                      <span className="ml-2 text-sm">收集邮箱</span>
                    </label>

                    <label className="flex items-center">
                      <Switch defaultChecked />
                      <span className="ml-2 text-sm">自动回复</span>
                    </label>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm font-medium text-gray-700 mb-2">响应式预览</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Monitor className="w-3 h-3 mr-1" />
                        桌面
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Tablet className="w-3 h-3 mr-1" />
                        平板
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        <Smartphone className="w-3 h-3 mr-1" />
                        手机
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 数据收集页面 */}
        <TabsContent value="submissions" className="mt-6">
          {/* 提交统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {submissions.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">总提交数</div>
                <div className="text-xs text-green-600 mt-1">+23 今日新增</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {submissions.filter((s) => s.status === "new").length}
                </div>
                <div className="text-sm text-gray-600 mt-1">待处理</div>
                <div className="text-xs text-blue-600 mt-1">需要跟进</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {submissions.filter((s) => s.status === "processed").length}
                </div>
                <div className="text-sm text-gray-600 mt-1">已处理</div>
                <div className="text-xs text-orange-600 mt-1">处理中</div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {submissions.filter((s) => s.status === "converted").length}
                </div>
                <div className="text-sm text-gray-600 mt-1">已转化</div>
                <div className="text-xs text-purple-600 mt-1">成功转化</div>
              </CardContent>
            </Card>
          </div>

          {/* 提交数据列表 */}
          <Card
            className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  提交数据管理
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" className="hover:bg-green-50 hover:border-green-300 bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    导出数据
                  </Button>
                  <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 bg-transparent">
                    <Filter className="w-4 h-4 mr-2" />
                    筛选
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 border rounded-lg hover:bg-green-50 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            submission.formName === "客户需求调研表"
                              ? "bg-blue-500"
                              : submission.formName === "产品满意度调查"
                                ? "bg-green-500"
                                : "bg-purple-500"
                          }`}
                        ></div>
                        <div>
                          <div className="font-medium">{submission.formName}</div>
                          <div className="text-sm text-gray-600">
                            {submission.data.name || submission.data.customerName} · {submission.submittedAt}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getScoreColor(submission.score)}>{submission.score}分</Badge>
                        <Badge className={`${getSubmissionStatusColor(submission.status)} text-white`}>
                          {getSubmissionStatusText(submission.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{submission.data.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{submission.submitterInfo.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        <span>{submission.submitterInfo.device}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {submission.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-green-200 text-green-700">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {submission.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">{submission.notes}</div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300 bg-transparent"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        联系
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-purple-50 hover:border-purple-300 bg-transparent"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        标记已处理
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据分析页面 */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                  提交来源分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: "官网直接访问", count: 1250, percentage: 45.2 },
                    { source: "微信分享", count: 890, percentage: 32.1 },
                    { source: "搜索引擎", count: 456, percentage: 16.5 },
                    { source: "社交媒体", count: 178, percentage: 6.2 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === 0
                              ? "bg-blue-500"
                              : index === 1
                                ? "bg-green-500"
                                : index === 2
                                  ? "bg-orange-500"
                                  : "bg-purple-500"
                          }`}
                        ></div>
                        <span className="text-sm font-medium">{item.source}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20 h-2" />
                        <span className="text-sm font-medium w-12">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                  设备使用统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { device: "手机端", count: 1680, percentage: 60.8 },
                    { device: "桌面端", count: 890, percentage: 32.2 },
                    { device: "平板端", count: 194, percentage: 7.0 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Smartphone className="w-4 h-4 text-purple-500" />}
                        {index === 1 && <Monitor className="w-4 h-4 text-purple-500" />}
                        {index === 2 && <Tablet className="w-4 h-4 text-purple-500" />}
                        <span className="text-sm font-medium">{item.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.percentage} className="w-20 h-2" />
                        <span className="text-sm font-medium w-12">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 表单性能分析 */}
          <Card
            className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl mb-8`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                表单性能分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {formTemplates.map((template) => (
                  <div key={template.id} className="p-4 bg-indigo-50 rounded-lg">
                    <div className="font-semibold mb-2">{template.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>提交数：</span>
                        <span className="font-medium">{template.submissions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>转化率：</span>
                        <span className="font-medium text-green-600">{template.conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>完成时间：</span>
                        <span className="font-medium">{template.averageTime}秒</span>
                      </div>
                      <Progress value={template.conversionRate} colorScheme="green" className="h-2 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI分析洞察 */}
          <Card
            className={`border-l-4 ${colorSystem.rose.primary} ${colorSystem.rose.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className={`w-5 h-5 ${colorSystem.rose.icon}`} />
                AI智能分析洞察
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-rose-600">优化建议</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-600">表单长度优化</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        建议将"客户需求调研表"字段数量减少到6个以内，可提升15%完成率
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-600">移动端优化</span>
                      </div>
                      <div className="text-sm text-gray-600">60%用户使用移动端，建议优化移动端体验，简化输入流程</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-orange-600">提交时间分析</span>
                      </div>
                      <div className="text-sm text-gray-600">晚上8-10点提交率最高，建议在此时段推送表单链接</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-rose-600">数据洞察</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-600 mb-1">用户行为模式</div>
                      <div className="text-sm text-gray-600">用户平均在第3个字段开始犹豫，建议在此处添加引导提示</div>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="font-medium text-indigo-600 mb-1">转化关键因素</div>
                      <div className="text-sm text-gray-600">包含"免费咨询"关键词的表单转化率提升23%</div>
                    </div>
                    <div className="p-3 bg-teal-50 rounded-lg">
                      <div className="font-medium text-teal-600 mb-1">质量评分预测</div>
                      <div className="text-sm text-gray-600">AI预测本月表单整体质量分将提升至88.5分</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 自动化页面 */}
        <TabsContent value="automation" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.rose.primary} ${colorSystem.rose.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${colorSystem.rose.icon}`} />
                  自动化规则
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "高分客户自动标记",
                      description: "评分≥90分的提交自动标记为高价值客户",
                      trigger: "表单提交",
                      action: "添加标签 + 分配销售",
                      isActive: true,
                      executions: 156,
                    },
                    {
                      name: "自动回复邮件",
                      description: "表单提交后自动发送确认邮件",
                      trigger: "表单提交",
                      action: "发送邮件模板",
                      isActive: true,
                      executions: 1250,
                    },
                    {
                      name: "预约提醒通知",
                      description: "预约表单提交后自动创建日历提醒",
                      trigger: "预约表单提交",
                      action: "创建日历事件",
                      isActive: false,
                      executions: 45,
                    },
                  ].map((rule, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-rose-50 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <div className="flex items-center gap-2">
                          <Switch checked={rule.isActive} />
                          <Badge className={rule.isActive ? colorSystem.green.badge : "bg-gray-500"}>
                            {rule.isActive ? "启用" : "禁用"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{rule.description}</div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="text-gray-600">触发条件：</span>
                          <span className="font-medium">{rule.trigger}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">执行次数：</span>
                          <span className="font-medium">{rule.executions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  工作流配置
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-semibold mb-3 text-indigo-600">表单提交工作流</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>1. 接收表单数据</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>2. AI质量评分</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>3. 自动分类标记</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>4. 分配销售人员</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>5. 发送确认通知</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-600">自动化效果</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-green-600">95%</div>
                        <div className="text-gray-600">处理准确率</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-600">3分钟</div>
                        <div className="text-gray-600">平均响应时间</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">80%</div>
                        <div className="text-gray-600">人工节省</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">24/7</div>
                        <div className="text-gray-600">全天候服务</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 集成配置 */}
          <Card
            className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className={`w-5 h-5 ${colorSystem.teal.icon}`} />
                第三方集成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    name: "微信企业号",
                    description: "表单提交后自动推送到企业微信群",
                    status: "connected",
                    icon: "💬",
                  },
                  {
                    name: "钉钉机器人",
                    description: "高价值客户提交时自动通知销售团队",
                    status: "connected",
                    icon: "🤖",
                  },
                  {
                    name: "邮件系统",
                    description: "自动发送确认邮件和跟进提醒",
                    status: "connected",
                    icon: "📧",
                  },
                  {
                    name: "CRM系统",
                    description: "表单数据自动同步到CRM客户库",
                    status: "disconnected",
                    icon: "👥",
                  },
                  {
                    name: "短信平台",
                    description: "重要表单提交后发送短信通知",
                    status: "disconnected",
                    icon: "📱",
                  },
                  {
                    name: "数据分析",
                    description: "表单数据自动导入分析平台",
                    status: "connected",
                    icon: "📊",
                  },
                ].map((integration, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-teal-50 transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{integration.icon}</span>
                        <span className="font-medium">{integration.name}</span>
                      </div>
                      <Badge className={integration.status === "connected" ? colorSystem.green.badge : "bg-gray-500"}>
                        {integration.status === "connected" ? "已连接" : "未连接"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{integration.description}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`w-full ${
                        integration.status === "connected"
                          ? "hover:bg-red-50 hover:border-red-300"
                          : "hover:bg-teal-50 hover:border-teal-300"
                      } bg-transparent`}
                    >
                      {integration.status === "connected" ? "断开连接" : "立即连接"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 表单详情弹窗 */}
      {selectedForm && (
        <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                表单详情 - {selectedForm.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-teal-600">基本信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">表单名称：</span>
                      <span className="font-medium">{selectedForm.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">分类：</span>
                      <span className="font-medium">{selectedForm.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">状态：</span>
                      <Badge className={`${getStatusColor(selectedForm.status)} text-white`}>
                        {getStatusText(selectedForm.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">创建时间：</span>
                      <span className="font-medium">{selectedForm.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-blue-600">性能数据</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">提交数量：</span>
                      <span className="font-medium">{selectedForm.submissions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">转化率：</span>
                      <span className="font-medium text-green-600">{selectedForm.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">平均完成时间：</span>
                      <span className="font-medium">{selectedForm.averageTime}秒</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-green-600">表单字段</h4>
                  <div className="space-y-2">
                    {selectedForm.fields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{field.label}</span>
                          {field.required && <span className="text-red-500">*</span>}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-purple-600">标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedForm.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">表单描述</h4>
                  <div className="text-sm leading-relaxed">{selectedForm.description}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" className="hover:bg-teal-50 hover:border-teal-300 bg-transparent">
                <Eye className="w-4 h-4 mr-2" />
                预览表单
              </Button>
              <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 bg-transparent">
                <Edit className="w-4 h-4 mr-2" />
                编辑表单
              </Button>
              <Button className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700">
                <Share2 className="w-4 h-4 mr-2" />
                分享表单
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 提交详情弹窗 */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                提交详情 - {selectedSubmission.formName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-green-600">提交信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">提交时间：</span>
                      <span className="font-medium">{selectedSubmission.submittedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">质量评分：</span>
                      <Badge className={getScoreColor(selectedSubmission.score)}>{selectedSubmission.score}分</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">处理状态：</span>
                      <Badge className={`${getSubmissionStatusColor(selectedSubmission.status)} text-white`}>
                        {getSubmissionStatusText(selectedSubmission.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-3 text-blue-600">访问信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">IP地址：</span>
                      <span className="font-medium">{selectedSubmission.submitterInfo.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">设备类型：</span>
                      <span className="font-medium">{selectedSubmission.submitterInfo.device}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">地理位置：</span>
                      <span className="font-medium">{selectedSubmission.submitterInfo.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold mb-3 text-orange-600">表单数据</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedSubmission.data).map(([key, value], index) => (
                    <div key={index} className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">{key}：</div>
                      <div className="text-sm bg-white p-2 rounded border">
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-purple-600">标签</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSubmission.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedSubmission.notes && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">备注信息</h4>
                  <div className="text-sm leading-relaxed">{selectedSubmission.notes}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" className="hover:bg-green-50 hover:border-green-300 bg-transparent">
                <Phone className="w-4 h-4 mr-2" />
                联系客户
              </Button>
              <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 bg-transparent">
                <Edit className="w-4 h-4 mr-2" />
                编辑信息
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                标记已处理
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 表单预览弹窗 */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-teal-600" />
              表单预览 - {selectedForm?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="py-4">
              <div className="max-w-md mx-auto space-y-4 bg-white p-6 rounded-lg border">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">{selectedForm.settings.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedForm.settings.description}</p>
                </div>

                {selectedForm.fields.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === "text" && <Input placeholder={field.placeholder} disabled />}
                    {field.type === "textarea" && <Textarea placeholder={field.placeholder} rows={3} disabled />}
                    {field.type === "select" && (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder={field.placeholder || "请选择"} />
                        </SelectTrigger>
                      </Select>
                    )}
                    {field.type === "phone" && <Input placeholder={field.placeholder} disabled />}
                    {field.type === "email" && <Input placeholder={field.placeholder} disabled />}
                    {field.type === "date" && <Input type="date" disabled />}
                    {field.type === "radio" && field.options && (
                      <div className="space-y-2">
                        {field.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center">
                            <input type="radio" name={field.id} className="mr-2" disabled />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {field.type === "checkbox" && field.options && (
                      <div className="space-y-2">
                        {field.options.map((option, optIndex) => (
                          <label key={optIndex} className="flex items-center">
                            <input type="checkbox" className="mr-2" disabled />
                            <span className="text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <Button className="w-full bg-teal-500 hover:bg-teal-600" disabled>
                  {selectedForm.settings.submitText}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
