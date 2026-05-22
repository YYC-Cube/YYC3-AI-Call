"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Users,
  DollarSign,
  Heart,
  Star,
  MapPin,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Brain,
  Search,
  MessageSquare,
} from "lucide-react"

// 360度客户画像数据类型
interface CustomerProfile360 {
  id: string
  basicInfo: {
    name: string
    phone: string
    email: string
    age: number
    gender: string
    location: string
    avatar: string
  }
  behaviorData: {
    visitFrequency: number
    avgSessionDuration: number
    pageViews: number
    lastVisit: string
    deviceType: string[]
    preferredTime: string
  }
  preferenceAnalysis: {
    productCategories: { name: string; score: number }[]
    priceRange: { min: number; max: number }
    stylePreference: string[]
    colorPreference: string[]
    materialPreference: string[]
  }
  socialNetwork: {
    platform: string
    followers: number
    influence: number
    interests: string[]
    shareFrequency: number
  }
  financialProfile: {
    creditScore: number
    incomeLevel: string
    spendingPower: number
    paymentMethod: string[]
    purchaseHistory: number
  }
  riskAssessment: {
    churnRisk: number
    paymentRisk: number
    complaintHistory: number
    satisfactionScore: number
    loyaltyIndex: number
  }
  tags: string[]
  rfmScore: {
    recency: number
    frequency: number
    monetary: number
    segment: string
  }
  lifecycle: string
  predictedValue: number
  recommendations: string[]
}

// 模拟客户数据
const mockCustomerProfile: CustomerProfile360 = {
  id: "C001",
  basicInfo: {
    name: "张明",
    phone: "138****8888",
    email: "zhang.ming@email.com",
    age: 35,
    gender: "男",
    location: "北京市朝阳区",
    avatar: "/placeholder.svg?height=80&width=80&text=张明",
  },
  behaviorData: {
    visitFrequency: 12,
    avgSessionDuration: 480,
    pageViews: 156,
    lastVisit: "2024-01-22 15:30",
    deviceType: ["手机", "电脑"],
    preferredTime: "晚上8-10点",
  },
  preferenceAnalysis: {
    productCategories: [
      { name: "沙发", score: 95 },
      { name: "茶几", score: 78 },
      { name: "电视柜", score: 65 },
      { name: "餐桌", score: 45 },
    ],
    priceRange: { min: 8000, max: 25000 },
    stylePreference: ["现代简约", "北欧风格"],
    colorPreference: ["灰色", "白色", "原木色"],
    materialPreference: ["真皮", "布艺", "实木"],
  },
  socialNetwork: {
    platform: "微信朋友圈",
    followers: 280,
    influence: 75,
    interests: ["家居装修", "生活品质", "科技数码"],
    shareFrequency: 3,
  },
  financialProfile: {
    creditScore: 780,
    incomeLevel: "中高收入",
    spendingPower: 85,
    paymentMethod: ["微信支付", "信用卡", "花呗"],
    purchaseHistory: 3,
  },
  riskAssessment: {
    churnRisk: 15,
    paymentRisk: 8,
    complaintHistory: 0,
    satisfactionScore: 92,
    loyaltyIndex: 88,
  },
  tags: ["高价值客户", "设计敏感", "品质追求", "决策理性", "复购潜力"],
  rfmScore: {
    recency: 85,
    frequency: 78,
    monetary: 92,
    segment: "重要价值客户",
  },
  lifecycle: "成长期",
  predictedValue: 45000,
  recommendations: ["推荐高端真皮沙发系列", "提供专属设计师服务", "邀请参加VIP客户活动", "推送新品预览信息"],
}

const colorSystem = {
  green: {
    primary: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-600",
    badge: "bg-green-500",
    progress: "bg-gradient-to-r from-green-400 to-green-600",
    hover: "hover:bg-green-50",
    icon: "text-green-500",
  },
  blue: {
    primary: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    badge: "bg-blue-500",
    progress: "bg-gradient-to-r from-blue-400 to-blue-600",
    hover: "hover:bg-blue-50",
    icon: "text-blue-500",
  },
  orange: {
    primary: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-500",
    progress: "bg-gradient-to-r from-orange-400 to-orange-600",
    hover: "hover:bg-orange-50",
    icon: "text-orange-500",
  },
  purple: {
    primary: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    badge: "bg-purple-500",
    progress: "bg-gradient-to-r from-purple-400 to-purple-600",
    hover: "hover:bg-purple-50",
    icon: "text-purple-500",
  },
  rose: {
    primary: "border-l-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-600",
    badge: "bg-rose-500",
    progress: "bg-gradient-to-r from-rose-400 to-rose-600",
    hover: "hover:bg-rose-50",
    icon: "text-rose-500",
  },
  indigo: {
    primary: "border-l-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    badge: "bg-indigo-500",
    progress: "bg-gradient-to-r from-indigo-400 to-indigo-600",
    hover: "hover:bg-indigo-50",
    icon: "text-indigo-500",
  },
}

export default function CustomerProfile360() {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile360>(mockCustomerProfile)
  const [activeTab, setActiveTab] = useState("overview")

  const getRiskColor = (risk: number) => {
    if (risk <= 20) return "text-green-600 bg-green-50"
    if (risk <= 50) return "text-orange-600 bg-orange-50"
    return "text-red-600 bg-red-50"
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* 客户搜索和基本信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 客户搜索 */}
        <Card
          className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className={`w-5 h-5 ${colorSystem.blue.icon}`} />
              客户搜索
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="输入客户姓名或电话" />
            <Button className={`w-full ${colorSystem.blue.badge} hover:opacity-90`}>
              <Search className="w-4 h-4 mr-2" />
              搜索客户
            </Button>
            <div className="text-sm text-gray-600">
              <div>最近查看：</div>
              <div className="space-y-1 mt-1">
                <div className="cursor-pointer hover:text-blue-600">张明 (138****8888)</div>
                <div className="cursor-pointer hover:text-blue-600">李华 (139****6666)</div>
                <div className="cursor-pointer hover:text-blue-600">王芳 (136****9999)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 客户基本信息 */}
        <Card
          className={`lg:col-span-3 border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className={`w-5 h-5 ${colorSystem.green.icon}`} />
              客户基本信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <img
                  src={selectedCustomer.basicInfo.avatar || "/placeholder.svg"}
                  alt={selectedCustomer.basicInfo.name}
                  className="w-20 h-20 rounded-full border-4 border-green-200"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold">{selectedCustomer.basicInfo.name}</h3>
                  <Badge className={`${colorSystem.green.badge} text-white`}>{selectedCustomer.rfmScore.segment}</Badge>
                  <Badge variant="outline" className="text-blue-600">
                    {selectedCustomer.lifecycle}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedCustomer.basicInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedCustomer.basicInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedCustomer.basicInfo.age}岁</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{selectedCustomer.basicInfo.location}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCustomer.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-green-600">
                  ¥{selectedCustomer.predictedValue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">预测价值</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细画像信息 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-6 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            总览
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            行为分析
          </TabsTrigger>
          <TabsTrigger value="preference" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            偏好分析
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            社交画像
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            财务画像
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            风险评估
          </TabsTrigger>
        </TabsList>

        {/* 总览页面 */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className={`border-l-4 ${colorSystem.green.primary} text-center`}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{selectedCustomer.rfmScore.recency}</div>
                <div className="text-sm text-gray-600">最近购买(R)</div>
                <Progress value={selectedCustomer.rfmScore.recency} className="mt-2" colorScheme="green" />
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${colorSystem.blue.primary} text-center`}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{selectedCustomer.rfmScore.frequency}</div>
                <div className="text-sm text-gray-600">购买频率(F)</div>
                <Progress value={selectedCustomer.rfmScore.frequency} className="mt-2" colorScheme="blue" />
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${colorSystem.orange.primary} text-center`}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-orange-600">{selectedCustomer.rfmScore.monetary}</div>
                <div className="text-sm text-gray-600">购买金额(M)</div>
                <Progress value={selectedCustomer.rfmScore.monetary} className="mt-2" colorScheme="orange" />
              </CardContent>
            </Card>
            <Card className={`border-l-4 ${colorSystem.purple.primary} text-center`}>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">{selectedCustomer.riskAssessment.loyaltyIndex}</div>
                <div className="text-sm text-gray-600">忠诚度指数</div>
                <Progress value={selectedCustomer.riskAssessment.loyaltyIndex} className="mt-2" colorScheme="purple" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`border-l-4 ${colorSystem.indigo.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  AI智能推荐
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedCustomer.recommendations.map((rec, index) => (
                    <div key={index} className={`p-3 ${colorSystem.indigo.bg} rounded-lg flex items-center gap-2`}>
                      <Zap className={`w-4 h-4 ${colorSystem.indigo.icon}`} />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${colorSystem.rose.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className={`w-5 h-5 ${colorSystem.rose.icon}`} />
                  客户价值分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">历史消费总额</span>
                    <span className="font-bold text-rose-600">¥68,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">平均客单价</span>
                    <span className="font-bold text-rose-600">¥22,833</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">购买频次</span>
                    <span className="font-bold text-rose-600">3次/年</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">预测生命周期价值</span>
                    <span className="font-bold text-rose-600">¥{selectedCustomer.predictedValue.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 行为分析页面 */}
        <TabsContent value="behavior" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`border-l-4 ${colorSystem.blue.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  在线行为分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedCustomer.behaviorData.visitFrequency}
                      </div>
                      <div className="text-sm text-gray-600">月访问次数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.floor(selectedCustomer.behaviorData.avgSessionDuration / 60)}分钟
                      </div>
                      <div className="text-sm text-gray-600">平均停留时间</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">页面浏览量</span>
                      <span className="font-medium">{selectedCustomer.behaviorData.pageViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">最后访问</span>
                      <span className="font-medium">{selectedCustomer.behaviorData.lastVisit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">偏好访问时间</span>
                      <span className="font-medium">{selectedCustomer.behaviorData.preferredTime}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">使用设备</div>
                    <div className="flex gap-2">
                      {selectedCustomer.behaviorData.deviceType.map((device, index) => (
                        <Badge key={index} variant="outline">
                          {device}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${colorSystem.green.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  行为趋势分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-600">行为特征</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 活跃用户，访问频率较高</li>
                      <li>• 深度浏览，停留时间长</li>
                      <li>• 移动端使用为主</li>
                      <li>• 晚间活跃度最高</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-600">兴趣点分析</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">产品详情页</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">价格对比页</span>
                        <span className="text-sm font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">用户评价页</span>
                        <span className="text-sm font-medium">18%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">售后服务页</span>
                        <span className="text-sm font-medium">9%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 偏好分析页面 */}
        <TabsContent value="preference" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`border-l-4 ${colorSystem.orange.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                  产品偏好分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">产品类别偏好</h4>
                    <div className="space-y-2">
                      {selectedCustomer.preferenceAnalysis.productCategories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{category.name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={category.score} className="w-20 h-2" colorScheme="orange" />
                            <span className="text-sm font-medium w-8">{category.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">价格偏好</h4>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-center">
                        <span className="text-lg font-bold text-orange-600">
                          ¥{selectedCustomer.preferenceAnalysis.priceRange.min.toLocaleString()} - ¥
                          {selectedCustomer.preferenceAnalysis.priceRange.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 text-center mt-1">预算区间</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${colorSystem.purple.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${colorSystem.purple.icon}`} />
                  风格与材质偏好
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">风格偏好</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.preferenceAnalysis.stylePreference.map((style, index) => (
                        <Badge key={index} className={`${colorSystem.purple.badge} text-white`}>
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">颜色偏好</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.preferenceAnalysis.colorPreference.map((color, index) => (
                        <Badge key={index} variant="outline">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">材质偏好</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.preferenceAnalysis.materialPreference.map((material, index) => (
                        <Badge key={index} variant="outline">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-purple-600">AI偏好洞察</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 偏爱简约现代风格，注重实用性</li>
                      <li>• 对材质品质要求较高</li>
                      <li>• 色彩选择偏向中性色调</li>
                      <li>• 价格敏感度中等，更看重性价比</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 社交画像页面 */}
        <TabsContent value="social" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`border-l-4 ${colorSystem.blue.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  社交网络分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedCustomer.socialNetwork.followers}</div>
                      <div className="text-sm text-gray-600">社交关注数</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedCustomer.socialNetwork.influence}
                      </div>
                      <div className="text-sm text-gray-600">影响力指数</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">主要平台</span>
                      <span className="text-sm">{selectedCustomer.socialNetwork.platform}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">分享频率</span>
                      <span className="text-sm">{selectedCustomer.socialNetwork.shareFrequency}次/周</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">兴趣标签</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.socialNetwork.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${colorSystem.green.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  社交行为特征
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-600">社交特征</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 社交活跃度较高，乐于分享</li>
                      <li>• 关注生活品质相关内容</li>
                      <li>• 对家居装修话题敏感</li>
                      <li>• 具有一定的意见领袖特质</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-600">营销建议</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 可邀请参与产品体验活动</li>
                      <li>• 鼓励分享使用心得获得奖励</li>
                      <li>• 提供专属推荐码增加转介绍</li>
                      <li>• 定期推送高质量内容素材</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">分享意愿</div>
                      <div className="text-green-600">高</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">互动频率</div>
                      <div className="text-blue-600">中等</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">传播价值</div>
                      <div className="text-purple-600">较高</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 财务画像页面 */}
        <TabsContent value="financial" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`border-l-4 ${colorSystem.green.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className={`w-5 h-5 ${colorSystem.green.icon}`} />
                  财务状况分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedCustomer.financialProfile.creditScore}
                      </div>
                      <div className="text-sm text-gray-600">信用评分</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedCustomer.financialProfile.spendingPower}
                      </div>
                      <div className="text-sm text-gray-600">消费能力</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">收入水平</span>
                      <span className="font-medium text-green-600">
                        {selectedCustomer.financialProfile.incomeLevel}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">历史购买次数</span>
                      <span className="font-medium">{selectedCustomer.financialProfile.purchaseHistory}次</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">支付方式偏好</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.financialProfile.paymentMethod.map((method, index) => (
                        <Badge key={index} variant="outline">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${colorSystem.orange.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className={`w-5 h-5 ${colorSystem.orange.icon}`} />
                  消费行为分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-orange-600">消费特征</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 消费能力强，属于中高端客户</li>
                      <li>• 信用记录良好，支付风险低</li>
                      <li>• 偏好多元化支付方式</li>
                      <li>• 复购意愿较强</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">消费稳定性</span>
                        <span className="text-sm font-medium">85%</span>
                      </div>
                      <Progress value={85} className="h-2" colorScheme="orange" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">价格敏感度</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <Progress value={45} className="h-2" colorScheme="orange" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">冲动消费倾向</span>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <Progress value={30} className="h-2" colorScheme="orange" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 风险评估页面 */}
        <TabsContent value="risk" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className={`border-l-4 ${colorSystem.rose.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${colorSystem.rose.icon}`} />
                  风险评估指标
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`text-center p-3 rounded-lg ${getRiskColor(selectedCustomer.riskAssessment.churnRisk)}`}
                    >
                      <div className="text-2xl font-bold">{selectedCustomer.riskAssessment.churnRisk}%</div>
                      <div className="text-sm">流失风险</div>
                    </div>
                    <div
                      className={`text-center p-3 rounded-lg ${getRiskColor(selectedCustomer.riskAssessment.paymentRisk)}`}
                    >
                      <div className="text-2xl font-bold">{selectedCustomer.riskAssessment.paymentRisk}%</div>
                      <div className="text-sm">支付风险</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">客户满意度</span>
                        <span
                          className={`text-sm font-medium ${getScoreColor(selectedCustomer.riskAssessment.satisfactionScore)}`}
                        >
                          {selectedCustomer.riskAssessment.satisfactionScore}分
                        </span>
                      </div>
                      <Progress
                        value={selectedCustomer.riskAssessment.satisfactionScore}
                        className="h-2"
                        colorScheme="rose"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">忠诚度指数</span>
                        <span
                          className={`text-sm font-medium ${getScoreColor(selectedCustomer.riskAssessment.loyaltyIndex)}`}
                        >
                          {selectedCustomer.riskAssessment.loyaltyIndex}分
                        </span>
                      </div>
                      <Progress
                        value={selectedCustomer.riskAssessment.loyaltyIndex}
                        className="h-2"
                        colorScheme="rose"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">投诉历史</span>
                      <span className="font-medium">{selectedCustomer.riskAssessment.complaintHistory}次</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${colorSystem.indigo.primary}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
                  AI风险预警
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold text-green-600">低风险客户</h4>
                    </div>
                    <ul className="text-sm space-y-1">
                      <li>• 满意度高，忠诚度强</li>
                      <li>• 支付记录良好</li>
                      <li>• 无投诉历史</li>
                      <li>• 流失风险极低</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-600">维护建议</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 保持定期沟通联系</li>
                      <li>• 提供VIP专属服务</li>
                      <li>• 邀请参与新品体验</li>
                      <li>• 鼓励推荐新客户</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-medium text-green-600">稳定性</div>
                      <div>优秀</div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-medium text-blue-600">价值度</div>
                      <div>高</div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-medium text-purple-600">潜力</div>
                      <div>很大</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
