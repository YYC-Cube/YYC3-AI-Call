"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  DollarSign,
  Target,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  Activity,
  Award,
  Clock,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Eye,
  MessageSquare,
  Zap,
} from "lucide-react"

// 数据分析类型定义
interface SalesData {
  period: string
  revenue: number
  orders: number
  customers: number
  conversion: number
  growth: number
}

interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  activeCustomers: number
  churnRate: number
  avgLifetimeValue: number
  satisfactionScore: number
}

interface CallAnalytics {
  totalCalls: number
  successfulCalls: number
  avgCallDuration: number
  conversionRate: number
  peakHours: string[]
  topPerformers: { name: string; calls: number; conversion: number }[]
}

interface RegionalData {
  region: string
  revenue: number
  customers: number
  growth: number
  marketShare: number
}

// 模拟数据
const mockSalesData: SalesData[] = [
  { period: "2024-01", revenue: 2850000, orders: 156, customers: 142, conversion: 18.5, growth: 12.3 },
  { period: "2024-02", revenue: 3200000, orders: 178, customers: 165, conversion: 19.2, growth: 15.8 },
  { period: "2024-03", revenue: 2950000, orders: 164, customers: 151, conversion: 17.8, growth: 8.9 },
  { period: "2024-04", revenue: 3450000, orders: 195, customers: 182, conversion: 20.1, growth: 18.7 },
  { period: "2024-05", revenue: 3680000, orders: 208, customers: 196, conversion: 21.3, growth: 22.4 },
  { period: "2024-06", revenue: 3920000, orders: 225, customers: 211, conversion: 22.8, growth: 25.1 },
]

const mockCustomerAnalytics: CustomerAnalytics = {
  totalCustomers: 15680,
  newCustomers: 1240,
  activeCustomers: 8950,
  churnRate: 5.2,
  avgLifetimeValue: 45600,
  satisfactionScore: 4.6,
}

const mockCallAnalytics: CallAnalytics = {
  totalCalls: 12450,
  successfulCalls: 9560,
  avgCallDuration: 480,
  conversionRate: 23.8,
  peakHours: ["09:00-11:00", "14:00-16:00", "19:00-21:00"],
  topPerformers: [
    { name: "张明", calls: 456, conversion: 28.5 },
    { name: "李华", calls: 423, conversion: 26.8 },
    { name: "王芳", calls: 398, conversion: 25.2 },
    { name: "刘强", calls: 367, conversion: 24.1 },
    { name: "陈静", calls: 345, conversion: 23.6 },
  ],
}

const mockRegionalData: RegionalData[] = [
  { region: "华北地区", revenue: 8950000, customers: 3240, growth: 18.5, marketShare: 28.5 },
  { region: "华东地区", revenue: 12600000, customers: 4580, growth: 22.3, marketShare: 35.2 },
  { region: "华南地区", revenue: 7800000, customers: 2890, growth: 15.7, marketShare: 22.8 },
  { region: "西南地区", revenue: 4200000, customers: 1560, growth: 12.1, marketShare: 13.5 },
]

const colorSystem = {
  blue: {
    primary: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    badge: "bg-blue-500",
    hover: "hover:bg-blue-50",
    icon: "text-blue-500",
    gradient: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  green: {
    primary: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-600",
    badge: "bg-green-500",
    hover: "hover:bg-green-50",
    icon: "text-green-500",
    gradient: "bg-gradient-to-r from-green-500 to-green-600",
  },
  orange: {
    primary: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-500",
    hover: "hover:bg-orange-50",
    icon: "text-orange-500",
    gradient: "bg-gradient-to-r from-orange-500 to-orange-600",
  },
  purple: {
    primary: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    badge: "bg-purple-500",
    hover: "hover:bg-purple-50",
    icon: "text-purple-500",
    gradient: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
  rose: {
    primary: "border-l-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-600",
    badge: "bg-rose-500",
    hover: "hover:bg-rose-50",
    icon: "text-rose-500",
    gradient: "bg-gradient-to-r from-rose-500 to-rose-600",
  },
  indigo: {
    primary: "border-l-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    badge: "bg-indigo-500",
    hover: "hover:bg-indigo-50",
    icon: "text-indigo-500",
    gradient: "bg-gradient-to-r from-indigo-500 to-indigo-600",
  },
  teal: {
    primary: "border-l-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-600",
    badge: "bg-teal-500",
    hover: "hover:bg-teal-50",
    icon: "text-teal-500",
    gradient: "bg-gradient-to-r from-teal-500 to-teal-600",
  },
}

export default function DataAnalytics() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("6months")
  const [selectedRegion, setSelectedRegion] = useState("all")

  // 计算增长趋势
  const getGrowthTrend = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive: growth > 0,
      icon: growth > 0 ? ArrowUp : ArrowDown,
      color: growth > 0 ? "text-green-600" : "text-red-600",
    }
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + "万"
    }
    return num.toLocaleString()
  }

  // 格式化货币
  const formatCurrency = (num: number) => {
    if (num >= 10000) {
      return "¥" + (num / 10000).toFixed(1) + "万"
    }
    return "¥" + num.toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            数据分析中心
          </h2>
          <p className="text-gray-600 mt-1">全方位业务数据分析，洞察市场趋势，驱动业务增长</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 border-2 focus:border-orange-500">
              <SelectValue placeholder="时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">近7天</SelectItem>
              <SelectItem value="30days">近30天</SelectItem>
              <SelectItem value="3months">近3个月</SelectItem>
              <SelectItem value="6months">近6个月</SelectItem>
              <SelectItem value="1year">近1年</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="hover:bg-orange-50 hover:border-orange-300 bg-transparent shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </Button>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-300">
            <Download className="w-4 h-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 导航标签 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <BarChart3 className="w-4 h-4" />
            数据总览
          </TabsTrigger>
          <TabsTrigger
            value="sales"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <DollarSign className="w-4 h-4" />
            销售分析
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Users className="w-4 h-4" />
            客户分析
          </TabsTrigger>
          <TabsTrigger
            value="calls"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Phone className="w-4 h-4" />
            通话分析
          </TabsTrigger>
          <TabsTrigger
            value="regional"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <MapPin className="w-4 h-4" />
            区域分析
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
          >
            <Award className="w-4 h-4" />
            绩效分析
          </TabsTrigger>
        </TabsList>

        {/* 数据总览页面 */}
        <TabsContent value="overview" className="mt-6">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-6 h-6 text-green-600" />
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    {formatCurrency(mockSalesData[mockSalesData.length - 1].revenue)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">本月营收</div>
                <div className="flex items-center justify-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />+{mockSalesData[mockSalesData.length - 1].growth}% 较上月
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    {formatNumber(mockCustomerAnalytics.totalCustomers)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">总客户数</div>
                <div className="flex items-center justify-center gap-1 text-xs text-blue-600 mt-1">
                  <TrendingUp className="w-3 h-3" />+{formatNumber(mockCustomerAnalytics.newCustomers)} 本月新增
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Phone className="w-6 h-6 text-purple-600" />
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                    {formatNumber(mockCallAnalytics.totalCalls)}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">总通话数</div>
                <div className="flex items-center justify-center gap-1 text-xs text-purple-600 mt-1">
                  <Target className="w-3 h-3" />
                  {mockCallAnalytics.conversionRate}% 转化率
                </div>
              </CardContent>
            </Card>
            <Card
              className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-orange-600" />
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                    {mockCustomerAnalytics.satisfactionScore}
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">客户满意度</div>
                <div className="flex items-center justify-center gap-1 text-xs text-orange-600 mt-1">
                  <CheckCircle className="w-3 h-3" />
                  优秀水平
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 趋势图表和关键指标 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  营收趋势分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(mockSalesData.reduce((sum, item) => sum + item.revenue, 0))}
                      </div>
                      <div className="text-sm text-gray-600">总营收</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {(
                          mockSalesData.reduce((sum, item) => sum + item.revenue, 0) /
                          mockSalesData.length /
                          10000
                        ).toFixed(1)}
                        万
                      </div>
                      <div className="text-sm text-gray-600">月均营收</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">
                        +{(mockSalesData.reduce((sum, item) => sum + item.growth, 0) / mockSalesData.length).toFixed(1)}
                        %
                      </div>
                      <div className="text-sm text-gray-600">平均增长</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {mockSalesData.slice(-3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{item.period}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatCurrency(item.revenue)}</span>
                          <div
                            className={`flex items-center gap-1 ${item.growth > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {item.growth > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="text-xs">{Math.abs(item.growth)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  业务构成分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{mockCustomerAnalytics.activeCustomers}</div>
                      <div className="text-sm text-gray-600">活跃客户</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{mockCallAnalytics.conversionRate}%</div>
                      <div className="text-sm text-gray-600">转化率</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>新客户获取</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <Progress value={35} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>老客户维护</span>
                        <span className="font-medium">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>客户转介绍</span>
                        <span className="font-medium">20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      <span className="font-semibold text-indigo-600">AI洞察</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      客户转介绍渠道表现优异，建议加大转介绍激励政策投入，预计可提升15%的新客获取效率。
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 实时监控面板 */}
          <Card
            className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                实时业务监控
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-indigo-600" />
                    <div className="text-2xl font-bold text-indigo-600">156</div>
                  </div>
                  <div className="text-sm text-gray-600">今日访客</div>
                  <div className="text-xs text-indigo-600 mt-1">+12% 较昨日</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">89</div>
                  </div>
                  <div className="text-sm text-gray-600">进行中通话</div>
                  <div className="text-xs text-green-600 mt-1">实时更新</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-600">23</div>
                  </div>
                  <div className="text-sm text-gray-600">待处理咨询</div>
                  <div className="text-xs text-orange-600 mt-1">需要关注</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">67%</div>
                  </div>
                  <div className="text-sm text-gray-600">今日目标完成</div>
                  <div className="text-xs text-purple-600 mt-1">良好进度</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 销售分析页面 */}
        <TabsContent value="sales" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  销售业绩趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(mockSalesData[mockSalesData.length - 1].revenue)}
                      </div>
                      <div className="text-sm text-gray-600">本月营收</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {mockSalesData[mockSalesData.length - 1].orders}
                      </div>
                      <div className="text-sm text-gray-600">本月订单</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">月度销售数据</h4>
                    {mockSalesData.slice(-4).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.period}</div>
                          <div className="text-sm text-gray-600">{item.orders}个订单</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(item.revenue)}</div>
                          <div
                            className={`text-sm flex items-center gap-1 ${item.growth > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {item.growth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(item.growth)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  转化率分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {(mockSalesData.reduce((sum, item) => sum + item.conversion, 0) / mockSalesData.length).toFixed(
                        1,
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-600">平均转化率</div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>访客转化</span>
                        <span className="font-medium">12.5%</span>
                      </div>
                      <Progress value={12.5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>咨询转化</span>
                        <span className="font-medium">35.8%</span>
                      </div>
                      <Progress value={35.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>试用转化</span>
                        <span className="font-medium">68.2%</span>
                      </div>
                      <Progress value={68.2} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>成交转化</span>
                        <span className="font-medium">89.5%</span>
                      </div>
                      <Progress value={89.5} className="h-2" />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-600">优化建议</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      访客转化率偏低，建议优化首页设计和产品展示，预计可提升至15%以上。
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 产品销售排行 */}
          <Card
            className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                产品销售排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "现代简约沙发", sales: 156, revenue: 2340000, growth: 18.5, rank: 1 },
                  { name: "北欧风格茶几", sales: 134, revenue: 1890000, growth: 15.2, rank: 2 },
                  { name: "实木餐桌椅", sales: 98, revenue: 1560000, growth: 12.8, rank: 3 },
                  { name: "智能电视柜", sales: 87, revenue: 1340000, growth: 22.1, rank: 4 },
                  { name: "舒适床垫", sales: 76, revenue: 1120000, growth: 8.9, rank: 5 },
                  { name: "定制衣柜", sales: 65, revenue: 980000, growth: 25.6, rank: 6 },
                ].map((product, index) => (
                  <div key={index} className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          product.rank === 1
                            ? "bg-yellow-500 text-white"
                            : product.rank === 2
                              ? "bg-gray-400 text-white"
                              : product.rank === 3
                                ? "bg-orange-500 text-white"
                                : "bg-orange-200 text-orange-600"
                        }`}
                      >
                        {product.rank}
                      </div>
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.sales}件销售</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">销售额：</span>
                        <span className="font-bold text-orange-600">{formatCurrency(product.revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">增长率：</span>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-medium">{product.growth}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 客户分析页面 */}
        <TabsContent value="customers" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  客户概况分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(mockCustomerAnalytics.totalCustomers)}
                      </div>
                      <div className="text-sm text-gray-600">总客户数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(mockCustomerAnalytics.activeCustomers)}
                      </div>
                      <div className="text-sm text-gray-600">活跃客户</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>新客户</span>
                        <span className="font-medium">{formatNumber(mockCustomerAnalytics.newCustomers)}</span>
                      </div>
                      <Progress
                        value={(mockCustomerAnalytics.newCustomers / mockCustomerAnalytics.totalCustomers) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>活跃客户</span>
                        <span className="font-medium">{formatNumber(mockCustomerAnalytics.activeCustomers)}</span>
                      </div>
                      <Progress
                        value={(mockCustomerAnalytics.activeCustomers / mockCustomerAnalytics.totalCustomers) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>流失率</span>
                        <span className="font-medium text-red-600">{mockCustomerAnalytics.churnRate}%</span>
                      </div>
                      <Progress value={mockCustomerAnalytics.churnRate} className="h-2" />
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-600">客户满意度</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {mockCustomerAnalytics.satisfactionScore}/5.0
                    </div>
                    <div className="text-sm text-gray-600">基于最近1000份客户反馈</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  客户价值分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(mockCustomerAnalytics.avgLifetimeValue)}
                    </div>
                    <div className="text-sm text-gray-600">平均客户生命周期价值</div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600">客户价值分层</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">高价值客户 (&gt;5万)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={25} className="w-16 h-2" />
                          <span className="text-sm font-medium">25%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">中价值客户 (2-5万)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={45} className="w-16 h-2" />
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">低价值客户 (&lt;2万)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={30} className="w-16 h-2" />
                          <span className="text-sm font-medium">30%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">68%</div>
                      <div className="text-gray-600">复购率</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">3.2</div>
                      <div className="text-gray-600">平均购买次数</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 客户行为分析 */}
          <Card
            className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                客户行为分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">4.2小时</div>
                  <div className="text-sm text-gray-600 mb-2">平均浏览时长</div>
                  <div className="text-xs text-purple-600 mt-1">+15% 较上月</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">8.5页</div>
                  <div className="text-sm text-gray-600 mb-2">平均访问页面</div>
                  <div className="text-xs text-blue-600">+8% 较上月</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">23%</div>
                  <div className="text-sm text-gray-600 mb-2">跳出率</div>
                  <div className="text-xs text-green-600">-5% 较上月</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">67%</div>
                  <div className="text-sm text-gray-600 mb-2">回访率</div>
                  <div className="text-xs text-orange-600 mt-1">+12% 较上月</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-purple-600">热门访问时段</h4>
                  <div className="space-y-2">
                    {[
                      { time: "09:00-12:00", visitors: 1250, percentage: 35 },
                      { time: "14:00-17:00", visitors: 1680, percentage: 47 },
                      { time: "19:00-22:00", visitors: 890, percentage: 25 },
                      { time: "22:00-24:00", visitors: 320, percentage: 9 },
                    ].map((period, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{period.time}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={period.percentage} className="w-20 h-2" />
                          <span className="text-sm font-medium w-12">{period.visitors}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-purple-600">客户来源渠道</h4>
                  <div className="space-y-2">
                    {[
                      { source: "搜索引擎", percentage: 42, color: "bg-blue-500" },
                      { source: "社交媒体", percentage: 28, color: "bg-green-500" },
                      { source: "直接访问", percentage: 18, color: "bg-orange-500" },
                      { source: "推荐链接", percentage: 12, color: "bg-purple-500" },
                    ].map((channel, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                          <span className="text-sm">{channel.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={channel.percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{channel.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通话分析页面 */}
        <TabsContent value="calls" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                  通话数据概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatNumber(mockCallAnalytics.totalCalls)}
                      </div>
                      <div className="text-sm text-gray-600">总通话数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber(mockCallAnalytics.successfulCalls)}
                      </div>
                      <div className="text-sm text-gray-600">成功接通</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>接通率</span>
                        <span className="font-medium text-green-600">
                          {((mockCallAnalytics.successfulCalls / mockCallAnalytics.totalCalls) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={(mockCallAnalytics.successfulCalls / mockCallAnalytics.totalCalls) * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>转化率</span>
                        <span className="font-medium text-blue-600">{mockCallAnalytics.conversionRate}%</span>
                      </div>
                      <Progress value={mockCallAnalytics.conversionRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>平均通话时长</span>
                        <span className="font-medium text-orange-600">
                          {Math.floor(mockCallAnalytics.avgCallDuration / 60)}分{mockCallAnalytics.avgCallDuration % 60}
                          秒
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-600">通话高峰时段</span>
                    </div>
                    <div className="text-sm text-gray-700">{mockCallAnalytics.peakHours.join("、")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                  通话质量分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-600">85%</div>
                      <div className="text-gray-600">优质通话</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-600">12%</div>
                      <div className="text-gray-600">一般通话</div>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <div className="font-bold text-red-600">3%</div>
                      <div className="text-gray-600">待改进</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-600">质量评估指标</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">语音清晰度</span>
                        <div className="flex items-center gap-2">
                          <Progress value={92} className="w-16 h-2" />
                          <span className="text-sm font-medium">92%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">服务态度</span>
                        <div className="flex items-center gap-2">
                          <Progress value={88} className="w-16 h-2" />
                          <span className="text-sm font-medium">88%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">专业程度</span>
                        <div className="flex items-center gap-2">
                          <Progress value={90} className="w-16 h-2" />
                          <span className="text-sm font-medium">90%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">问题解决</span>
                        <div className="flex items-center gap-2">
                          <Progress value={86} className="w-16 h-2" />
                          <span className="text-sm font-medium">86%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-orange-600">改进建议</span>
                    </div>
                    <div className="text-sm text-gray-700">建议加强销售人员的产品知识培训，提升专业问题解决能力。</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 销售人员排行榜 */}
          <Card
            className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                销售人员通话排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {mockCallAnalytics.topPerformers.map((performer, index) => (
                  <div key={index} className="p-4 bg-indigo-50 rounded-lg text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
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
                    </div>
                    <div className="font-semibold mb-1">{performer.name}</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">通话数：</span>
                        <span className="font-medium">{performer.calls}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">转化率：</span>
                        <span className="font-medium text-indigo-600">{performer.conversion}%</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Progress value={performer.conversion} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 区域分析页面 */}
        <TabsContent value="regional" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.teal.primary} ${colorSystem.teal.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className={`w-5 h-5 ${colorSystem.teal.icon}`} />
                  区域业绩分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRegionalData.map((region, index) => (
                    <div key={index} className="p-4 bg-teal-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{region.region}</h4>
                        <Badge className={`${colorSystem.teal.badge} text-white`}>{region.marketShare}% 市场份额</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">营收：</div>
                          <div className="font-bold text-teal-600">{formatCurrency(region.revenue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">客户数：</div>
                          <div className="font-bold text-blue-600">{formatNumber(region.customers)}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-gray-600">增长率：</span>
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-medium">{region.growth}%</span>
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
                  <BarChart3 className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  区域对比分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-indigo-600">营收排名</h4>
                    <div className="space-y-2">
                      {mockRegionalData
                        .sort((a, b) => b.revenue - a.revenue)
                        .map((region, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                              <span className="text-sm font-medium">{region.region}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-indigo-600">{formatCurrency(region.revenue)}</div>
                              <div className="text-xs text-gray-600">{region.marketShare}% 份额</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-indigo-600">增长率对比</h4>
                    <div className="space-y-2">
                      {mockRegionalData
                        .sort((a, b) => b.growth - a.growth)
                        .map((region, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm">{region.region}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={region.growth} className="w-20 h-2" />
                              <span className="text-sm font-medium w-12">{region.growth}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 区域发展潜力分析 */}
          <Card
            className={`border-l-4 ${colorSystem.rose.primary} ${colorSystem.rose.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className={`w-5 h-5 ${colorSystem.rose.icon}`} />
                区域发展潜力分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockRegionalData.map((region, index) => (
                  <div key={index} className="p-4 bg-rose-50 rounded-lg">
                    <h4 className="font-semibold mb-3 text-rose-600">{region.region}</h4>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-rose-600">{region.marketShare}%</div>
                        <div className="text-sm text-gray-600">市场份额</div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>发展潜力：</span>
                          <span
                            className={`font-medium ${
                              region.growth > 20
                                ? "text-green-600"
                                : region.growth > 15
                                  ? "text-blue-600"
                                  : region.growth > 10
                                    ? "text-orange-600"
                                    : "text-red-600"
                            }`}
                          >
                            {region.growth > 20
                              ? "高"
                              : region.growth > 15
                                ? "中高"
                                : region.growth > 10
                                  ? "中等"
                                  : "待提升"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>竞争强度：</span>
                          <span className="font-medium text-purple-600">
                            {region.marketShare > 30 ? "激烈" : region.marketShare > 20 ? "中等" : "较低"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>投入建议：</span>
                          <span className="font-medium text-indigo-600">
                            {region.growth > 18 ? "加大投入" : region.growth > 12 ? "稳步发展" : "优化策略"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 绩效分析页面 */}
        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card
              className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  团队绩效概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">92%</div>
                      <div className="text-sm text-gray-600">目标完成率</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">4.6</div>
                      <div className="text-sm text-gray-600">平均绩效评分</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-indigo-600">部门绩效排名</h4>
                    {[
                      { dept: "华东销售部", score: 95, target: 98 },
                      { dept: "华北销售部", score: 88, target: 92 },
                      { dept: "华南销售部", score: 85, target: 88 },
                      { dept: "西南销售部", score: 78, target: 82 },
                    ].map((dept, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                          <span className="text-sm font-medium">{dept.dept}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-indigo-600">{dept.score}分</div>
                          <div className="text-xs text-gray-600">目标: {dept.target}分</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  个人绩效分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">A+</div>
                    <div className="text-sm text-gray-600">团队平均绩效等级</div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600">绩效分布</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">A级 (90-100分)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={35} className="w-16 h-2" />
                          <span className="text-sm font-medium">35%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">B级 (80-89分)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={45} className="w-16 h-2" />
                          <span className="text-sm font-medium">45%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">C级 (70-79分)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={15} className="w-16 h-2" />
                          <span className="text-sm font-medium">15%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">D级 (&lt;70分)</span>
                        <div className="flex items-center gap-2">
                          <Progress value={5} className="w-16 h-2" />
                          <span className="text-sm font-medium">5%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">绩效亮点</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      团队整体绩效表现优秀，A级员工比例较高，建议继续保持并分享成功经验。
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 绩效改进建议 */}
          <Card
            className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                AI绩效优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-600">优势保持</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• 客户满意度持续提升</li>
                    <li>• 团队协作效率较高</li>
                    <li>• 销售转化率稳定增长</li>
                    <li>• 新客户开发能力强</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-600">待改进项</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• 客户跟进及时性有待提升</li>
                    <li>• 产品知识培训需加强</li>
                    <li>• 数据分析能力待提高</li>
                    <li>• 跨部门沟通需优化</li>
                  </ul>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-600">行动建议</h4>
                  </div>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• 建立客户跟进提醒机制</li>
                    <li>• 定期组织产品培训</li>
                    <li>• 引入数据分析工具</li>
                    <li>• 优化内部沟通流程</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
