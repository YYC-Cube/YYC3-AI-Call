"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Zap,
  Mail,
  MessageSquare,
  Gift,
  Target,
  Play,
  Pause,
  Settings,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Copy,
  Plus,
  Bell,
  Sparkles,
} from "lucide-react"

// 营销自动化数据类型
interface MarketingCampaign {
  id: string
  name: string
  type: "email" | "sms" | "push" | "coupon"
  status: "active" | "paused" | "completed" | "draft"
  trigger: string
  targetAudience: string
  content: string
  schedule: string
  metrics: {
    sent: number
    opened: number
    clicked: number
    converted: number
    revenue: number
  }
  createdAt: string
  lastRun: string
}

interface AutomationRule {
  id: string
  name: string
  trigger: string
  conditions: string[]
  actions: string[]
  isActive: boolean
  executionCount: number
  successRate: number
}

interface ContentTemplate {
  id: string
  name: string
  type: "email" | "sms" | "push"
  subject: string
  content: string
  variables: string[]
  category: string
  usage: number
}

// 模拟数据
const mockCampaigns: MarketingCampaign[] = [
  {
    id: "1",
    name: "新客户欢迎系列",
    type: "email",
    status: "active",
    trigger: "客户注册后24小时",
    targetAudience: "新注册用户",
    content: "欢迎加入左右沙发大家庭！为您准备了专属新人礼包...",
    schedule: "每日执行",
    metrics: {
      sent: 1250,
      opened: 875,
      clicked: 312,
      converted: 89,
      revenue: 156800,
    },
    createdAt: "2024-01-15",
    lastRun: "2024-01-22 09:00",
  },
  {
    id: "2",
    name: "生日祝福营销",
    type: "sms",
    status: "active",
    trigger: "客户生日前3天",
    targetAudience: "所有客户",
    content: "亲爱的{客户姓名}，生日快乐！特为您准备了生日专享优惠...",
    schedule: "每日检查",
    metrics: {
      sent: 89,
      opened: 89,
      clicked: 45,
      converted: 12,
      revenue: 28900,
    },
    createdAt: "2024-01-10",
    lastRun: "2024-01-22 08:00",
  },
  {
    id: "3",
    name: "购物车挽回",
    type: "push",
    status: "active",
    trigger: "购物车放置24小时未购买",
    targetAudience: "有购物车的用户",
    content: "您的心仪商品还在等您！现在下单享受限时优惠...",
    schedule: "实时触发",
    metrics: {
      sent: 456,
      opened: 298,
      clicked: 156,
      converted: 67,
      revenue: 89500,
    },
    createdAt: "2024-01-12",
    lastRun: "2024-01-22 16:30",
  },
]

const mockAutomationRules: AutomationRule[] = [
  {
    id: "1",
    name: "高价值客户VIP升级",
    trigger: "客户累计消费超过5万元",
    conditions: ["消费金额 >= 50000", "购买次数 >= 3", "满意度 >= 90"],
    actions: ["发送VIP升级通知", "赠送专属优惠券", "分配专属客服"],
    isActive: true,
    executionCount: 23,
    successRate: 95.7,
  },
  {
    id: "2",
    name: "流失客户挽回",
    trigger: "客户90天未访问",
    conditions: ["最后访问时间 > 90天", "历史购买 > 0", "流失风险 > 60%"],
    actions: ["发送挽回邮件", "推送专属优惠", "安排客服电话"],
    isActive: true,
    executionCount: 156,
    successRate: 68.2,
  },
  {
    id: "3",
    name: "节日营销自动化",
    trigger: "节假日前7天",
    conditions: ["节假日类型匹配", "客户活跃度 > 50%"],
    actions: ["发送节日祝福", "推送节日优惠", "更新首页banner"],
    isActive: false,
    executionCount: 8,
    successRate: 82.5,
  },
]

const mockContentTemplates: ContentTemplate[] = [
  {
    id: "1",
    name: "新客户欢迎邮件",
    type: "email",
    subject: "欢迎加入左右沙发大家庭！",
    content: "亲爱的{客户姓名}，欢迎您成为左右沙发的新客户！我们为您准备了{优惠金额}元的新人专享优惠券...",
    variables: ["客户姓名", "优惠金额", "有效期"],
    category: "欢迎系列",
    usage: 1250,
  },
  {
    id: "2",
    name: "生日祝福短信",
    type: "sms",
    subject: "",
    content: "{客户姓名}，生日快乐！左右沙发为您送上生日祝福和{折扣}折专享优惠，有效期至{截止日期}。",
    variables: ["客户姓名", "折扣", "截止日期"],
    category: "节日祝福",
    usage: 89,
  },
  {
    id: "3",
    name: "购物车提醒",
    type: "push",
    subject: "您的心仪商品还在等您",
    content: "您在{时间}添加到购物车的{商品名称}现在购买可享受{优惠信息}！",
    variables: ["时间", "商品名称", "优惠信息"],
    category: "购物提醒",
    usage: 456,
  },
]

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

export default function MarketingAutomation() {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [selectedCampaign, setSelectedCampaign] = useState<MarketingCampaign | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-orange-500"
      case "completed":
        return "bg-blue-500"
      case "draft":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "运行中"
      case "paused":
        return "已暂停"
      case "completed":
        return "已完成"
      case "draft":
        return "草稿"
      default:
        return "未知"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />
      case "sms":
        return <MessageSquare className="w-4 h-4" />
      case "push":
        return <Bell className="w-4 h-4" />
      case "coupon":
        return <Gift className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const calculateROI = (campaign: MarketingCampaign) => {
    const cost = campaign.metrics.sent * 0.1 // 假设每条消息成本0.1元
    const roi = campaign.metrics.revenue > 0 ? ((campaign.metrics.revenue - cost) / cost) * 100 : 0
    return roi.toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* 营销自动化总览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`border-l-4 ${colorSystem.green.primary} text-center`}>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">12</div>
            <div className="text-sm text-gray-600">活跃营销活动</div>
            <div className="text-xs text-green-600 mt-1">+3 本月新增</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${colorSystem.blue.primary} text-center`}>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">1,795</div>
            <div className="text-sm text-gray-600">今日触发次数</div>
            <div className="text-xs text-blue-600 mt-1">+15% 较昨日</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${colorSystem.orange.primary} text-center`}>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-600">18.6%</div>
            <div className="text-sm text-gray-600">平均转化率</div>
            <div className="text-xs text-orange-600 mt-1">+2.3% 较上月</div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${colorSystem.purple.primary} text-center`}>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">¥275K</div>
            <div className="text-sm text-gray-600">本月营销收入</div>
            <div className="text-xs text-purple-600 mt-1">ROI 485%</div>
          </CardContent>
        </Card>
      </div>

      {/* 营销活动管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 活动列表 */}
        <div className="lg:col-span-2">
          <Card
            className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${colorSystem.blue.icon}`} />
                  营销活动管理
                </CardTitle>
                <Button className={`${colorSystem.blue.badge} hover:opacity-90`}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建活动
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                      selectedCampaign?.id === campaign.id ? colorSystem.blue.bg : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${colorSystem.blue.bg} rounded-lg`}>{getTypeIcon(campaign.type)}</div>
                        <div>
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <div className="text-sm text-gray-600">{campaign.targetAudience}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(campaign.status)}>{getStatusText(campaign.status)}</Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{campaign.metrics.sent}</div>
                        <div className="text-gray-600">发送量</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-green-600">
                          {((campaign.metrics.opened / campaign.metrics.sent) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-600">打开率</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">
                          {((campaign.metrics.clicked / campaign.metrics.sent) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-600">点击率</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-600">
                          {((campaign.metrics.converted / campaign.metrics.sent) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-600">转化率</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-rose-600">{calculateROI(campaign)}%</div>
                        <div className="text-gray-600">ROI</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <div>触发条件：{campaign.trigger}</div>
                      <div>最后执行：{campaign.lastRun}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 活动详情 */}
        <div>
          <Card
            className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className={`w-5 h-5 ${colorSystem.green.icon}`} />
                活动详情
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCampaign ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedCampaign.name}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>类型：{selectedCampaign.type}</div>
                      <div>状态：{getStatusText(selectedCampaign.status)}</div>
                      <div>创建时间：{selectedCampaign.createdAt}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">触发条件</h4>
                    <div className={`p-3 ${colorSystem.green.bg} rounded-lg text-sm`}>{selectedCampaign.trigger}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">目标受众</h4>
                    <div className={`p-3 ${colorSystem.blue.bg} rounded-lg text-sm`}>
                      {selectedCampaign.targetAudience}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">内容预览</h4>
                    <div className={`p-3 ${colorSystem.orange.bg} rounded-lg text-sm`}>{selectedCampaign.content}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">执行计划</h4>
                    <div className={`p-3 ${colorSystem.purple.bg} rounded-lg text-sm`}>{selectedCampaign.schedule}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className={`flex-1 ${colorSystem.green.badge} hover:opacity-90`}>
                      <Play className="w-3 h-3 mr-1" />
                      启动
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <Pause className="w-3 h-3 mr-1" />
                      暂停
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">选择一个活动查看详情</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 自动化规则管理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className={`w-5 h-5 ${colorSystem.purple.icon}`} />
              自动化规则
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAutomationRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-4 border rounded-lg ${colorSystem.purple.hover} transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.isActive} />
                      <Badge className={rule.isActive ? colorSystem.green.badge : "bg-gray-500"}>
                        {rule.isActive ? "启用" : "禁用"}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">触发条件：{rule.trigger}</div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">执行次数：</span>
                      <span className="font-medium">{rule.executionCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">成功率：</span>
                      <span className="font-medium text-green-600">{rule.successRate}%</span>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">执行动作：</div>
                    <div className="flex flex-wrap gap-1">
                      {rule.actions.slice(0, 2).map((action, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                      {rule.actions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{rule.actions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className={`w-5 h-5 ${colorSystem.orange.icon}`} />
              营销效果分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 渠道效果对比 */}
              <div>
                <h4 className="font-semibold mb-3 text-orange-600">渠道效果对比</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">邮件营销</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20 h-2" colorScheme="blue" />
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <span className="text-sm">短信营销</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={68} className="w-20 h-2" colorScheme="green" />
                      <span className="text-sm font-medium">68%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">推送通知</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={52} className="w-20 h-2" colorScheme="purple" />
                      <span className="text-sm font-medium">52%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-rose-500" />
                      <span className="text-sm">优惠券</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={89} className="w-20 h-2" colorScheme="orange" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 时间段分析 */}
              <div>
                <h4 className="font-semibold mb-3 text-orange-600">最佳发送时间</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-medium">邮件</div>
                    <div className="text-orange-600">上午9-11点</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-medium">短信</div>
                    <div className="text-green-600">晚上8-9点</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-medium">推送</div>
                    <div className="text-purple-600">下午2-4点</div>
                  </div>
                  <div className="text-center p-2 bg-rose-50 rounded">
                    <div className="font-medium">优惠券</div>
                    <div className="text-rose-600">周末全天</div>
                  </div>
                </div>
              </div>

              {/* AI优化建议 */}
              <div>
                <h4 className="font-semibold mb-3 text-orange-600">AI优化建议</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>优惠券营销效果最佳，建议增加投入</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>邮件标题优化可提升15%打开率</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>推送频率过高，建议适当降低</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 内容模板库 */}
      <Card
        className={`border-l-4 ${colorSystem.indigo.primary} ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-xl`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className={`w-5 h-5 ${colorSystem.indigo.icon}`} />
            内容模板库
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockContentTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg ${colorSystem.indigo.hover} transition-all duration-300 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(template.type)}
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>

                {template.subject && <div className="text-sm font-medium mb-1">{template.subject}</div>}

                <div className="text-xs text-gray-600 mb-2 line-clamp-2">{template.content}</div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 2).map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                    {template.variables.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 2}
                      </Badge>
                    )}
                  </div>
                  <div className="text-gray-500">使用 {template.usage} 次</div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
