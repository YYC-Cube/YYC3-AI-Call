"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  Plus,
  Search,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  User,
} from "lucide-react"

// 客户数据类型
interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  projectType: string
  budget: string
  intention: "high" | "medium" | "low" | "potential"
  requirements: string
  tags: string[]
  status: "new" | "contacted" | "interested" | "negotiating" | "closed" | "lost"
  createdAt: string
  lastContact: string
  nextFollowUp: string
  assignedTo: string
  source: string
  value: number
  notes: string[]
}

// 模拟客户数据
const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "张明",
    phone: "138****8888",
    email: "zhang.ming@email.com",
    address: "北京市朝阳区建国路88号SOHO现代城",
    projectType: "全屋整装",
    budget: "30-50万",
    intention: "high",
    requirements: "现代简约风格，三室两厅，注重环保材质，希望整体色调以灰白为主",
    tags: ["高意向", "环保要求", "预算充足", "设计敏感"],
    status: "negotiating",
    createdAt: "2024-01-20",
    lastContact: "2024-01-22",
    nextFollowUp: "2024-01-25",
    assignedTo: "李销售",
    source: "官网咨询",
    value: 400000,
    notes: ["客户对环保材质要求很高", "预算充足，决策速度快", "已预约周三到店参观"],
  },
  {
    id: "2",
    name: "王芳",
    phone: "139****6666",
    email: "wang.fang@email.com",
    address: "上海市浦东新区陆家嘴金融区世纪大道",
    projectType: "局部装修",
    budget: "10-20万",
    intention: "medium",
    requirements: "客厅沙发更换，偏好真皮材质，颜色要求深色系",
    tags: ["真皮偏好", "品质要求", "时间灵活", "价格敏感"],
    status: "interested",
    createdAt: "2024-01-18",
    lastContact: "2024-01-21",
    nextFollowUp: "2024-01-24",
    assignedTo: "张销售",
    source: "朋友推荐",
    value: 150000,
    notes: ["朋友是老客户推荐", "对价格比较敏感", "需要分期付款"],
  },
  {
    id: "3",
    name: "刘总",
    phone: "136****9999",
    email: "liu.boss@company.com",
    address: "深圳市南山区科技园腾讯大厦",
    projectType: "办公家具",
    budget: "50万以上",
    intention: "high",
    requirements: "办公室整体家具配置，现代商务风格，需要会议桌椅套装",
    tags: ["企业客户", "批量采购", "决策快", "长期合作"],
    status: "contacted",
    createdAt: "2024-01-22",
    lastContact: "2024-01-22",
    nextFollowUp: "2024-01-23",
    assignedTo: "王销售",
    source: "展会获客",
    value: 600000,
    notes: ["公司规模较大", "有长期合作意向", "决策权在手"],
  },
  {
    id: "4",
    name: "陈女士",
    phone: "135****7777",
    email: "chen.lady@email.com",
    address: "广州市天河区珠江新城CBD核心区",
    projectType: "家具配置",
    budget: "20-40万",
    intention: "medium",
    requirements: "新房家具配置，偏好欧式风格，需要卧室和客厅全套",
    tags: ["新房装修", "欧式风格", "全套配置", "品味要求高"],
    status: "new",
    createdAt: "2024-01-23",
    lastContact: "2024-01-23",
    nextFollowUp: "2024-01-24",
    assignedTo: "赵销售",
    source: "网络广告",
    value: 300000,
    notes: ["刚刚咨询", "对欧式风格很感兴趣", "需要专业设计师对接"],
  },
  {
    id: "5",
    name: "马先生",
    phone: "137****5555",
    email: "ma.sir@email.com",
    address: "杭州市西湖区文三路互联网创业园",
    projectType: "设计服务",
    budget: "5-10万",
    intention: "low",
    requirements: "只需要设计方案，暂时不购买家具，主要是空间规划",
    tags: ["设计需求", "暂不购买", "空间规划", "互联网从业"],
    status: "contacted",
    createdAt: "2024-01-21",
    lastContact: "2024-01-22",
    nextFollowUp: "2024-01-26",
    assignedTo: "李销售",
    source: "小红书",
    value: 80000,
    notes: ["目前只要设计", "后期可能有购买需求", "对设计师要求较高"],
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
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(mockCustomers)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [intentionFilter, setIntentionFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    projectType: "",
    budget: "",
    intention: "",
    requirements: "",
  })

  // 搜索和筛选逻辑
  useEffect(() => {
    let filtered = customers

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone.includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // 状态过滤
    if (statusFilter !== "all") {
      filtered = filtered.filter((customer) => customer.status === statusFilter)
    }

    // 意向过滤
    if (intentionFilter !== "all") {
      filtered = filtered.filter((customer) => customer.intention === intentionFilter)
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, statusFilter, intentionFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500"
      case "contacted":
        return "bg-yellow-500"
      case "interested":
        return "bg-green-500"
      case "negotiating":
        return "bg-purple-500"
      case "closed":
        return "bg-emerald-500"
      case "lost":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "新客户"
      case "contacted":
        return "已联系"
      case "interested":
        return "有兴趣"
      case "negotiating":
        return "洽谈中"
      case "closed":
        return "已成交"
      case "lost":
        return "已流失"
      default:
        return "未知"
    }
  }

  const getIntentionColor = (intention: string) => {
    switch (intention) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-orange-600 bg-orange-50"
      case "low":
        return "text-blue-600 bg-blue-50"
      case "potential":
        return "text-gray-600 bg-gray-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getIntentionText = (intention: string) => {
    switch (intention) {
      case "high":
        return "高意向"
      case "medium":
        return "中意向"
      case "low":
        return "低意向"
      case "potential":
        return "潜在客户"
      default:
        return "未知"
    }
  }

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
      alert("请填写客户姓名和电话")
      return
    }

    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
      intention: (newCustomer.intention || "potential") as "high" | "medium" | "low" | "potential",
      tags: [],
      status: "new",
      createdAt: new Date().toISOString().split("T")[0],
      lastContact: new Date().toISOString().split("T")[0],
      nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      assignedTo: "系统分配",
      source: "手动添加",
      value: 0,
      notes: [],
    }

    setCustomers([...customers, customer])
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: "",
      projectType: "",
      budget: "",
      intention: "",
      requirements: "",
    })
    setIsAddDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* 客户管理头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            客户管理中心
          </h2>
          <p className="text-gray-600 mt-1">全方位管理和跟进客户信息，提升转化效率</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              新增客户
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                新增客户信息
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-1">客户姓名 *</label>
                <Input
                  placeholder="请输入客户姓名"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">联系电话 *</label>
                <Input
                  placeholder="请输入手机号码"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱地址</label>
                <Input
                  placeholder="请输入邮箱地址"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">项目类型</label>
                <Select
                  value={newCustomer.projectType}
                  onValueChange={(value) => setNewCustomer({ ...newCustomer, projectType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择项目类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="全屋整装">全屋整装</SelectItem>
                    <SelectItem value="局部装修">局部装修</SelectItem>
                    <SelectItem value="家具配置">家具配置</SelectItem>
                    <SelectItem value="办公家具">办公家具</SelectItem>
                    <SelectItem value="设计服务">设计服务</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">项目地址</label>
                <Input
                  placeholder="请输入详细地址"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">预算范围</label>
                <Select
                  value={newCustomer.budget}
                  onValueChange={(value) => setNewCustomer({ ...newCustomer, budget: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择预算范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5-10万">5-10万</SelectItem>
                    <SelectItem value="10-20万">10-20万</SelectItem>
                    <SelectItem value="20-40万">20-40万</SelectItem>
                    <SelectItem value="40-60万">40-60万</SelectItem>
                    <SelectItem value="60万以上">60万以上</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">意向等级</label>
                <Select
                  value={newCustomer.intention}
                  onValueChange={(value) => setNewCustomer({ ...newCustomer, intention: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择意向等级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高意向</SelectItem>
                    <SelectItem value="medium">中意向</SelectItem>
                    <SelectItem value="low">低意向</SelectItem>
                    <SelectItem value="potential">潜在客户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">特殊需求</label>
                <Textarea
                  placeholder="请描述客户的特殊需求..."
                  rows={3}
                  value={newCustomer.requirements}
                  onChange={(e) => setNewCustomer({ ...newCustomer, requirements: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                取消
              </Button>
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={handleAddCustomer}
              >
                保存客户
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索和筛选 */}
      <Card className={`border-l-4 ${colorSystem.blue.primary} shadow-lg hover:shadow-xl transition-all duration-300`}>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索客户姓名、电话、邮箱或地址..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 focus:border-blue-500 transition-colors duration-300"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 border-2 focus:border-blue-500">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="new">新客户</SelectItem>
                <SelectItem value="contacted">已联系</SelectItem>
                <SelectItem value="interested">有兴趣</SelectItem>
                <SelectItem value="negotiating">洽谈中</SelectItem>
                <SelectItem value="closed">已成交</SelectItem>
                <SelectItem value="lost">已流失</SelectItem>
              </SelectContent>
            </Select>
            <Select value={intentionFilter} onValueChange={setIntentionFilter}>
              <SelectTrigger className="w-40 border-2 focus:border-blue-500">
                <SelectValue placeholder="意向筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部意向</SelectItem>
                <SelectItem value="high">高意向</SelectItem>
                <SelectItem value="medium">中意向</SelectItem>
                <SelectItem value="low">低意向</SelectItem>
                <SelectItem value="potential">潜在客户</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 客户统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card
          className={`border-l-4 ${colorSystem.green.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
        >
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              {customers.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">总客户数</div>
            <div className="text-xs text-green-600 mt-1">
              +{customers.filter((c) => c.createdAt === new Date().toISOString().split("T")[0]).length} 今日新增
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-l-4 ${colorSystem.blue.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
        >
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {customers.filter((c) => c.intention === "high").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">高意向客户</div>
            <div className="text-xs text-blue-600 mt-1">
              {((customers.filter((c) => c.intention === "high").length / customers.length) * 100).toFixed(1)}% 占比
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border-l-4 ${colorSystem.orange.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
        >
          <CardContent className="pt-6">
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              {customers.filter((c) => c.status === "negotiating").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">洽谈中</div>
            <div className="text-xs text-orange-600 mt-1">重点跟进</div>
          </CardContent>
        </Card>
        <Card
          className={`border-l-4 ${colorSystem.purple.primary} text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
        >
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              ¥{(customers.reduce((sum, c) => sum + c.value, 0) / 10000).toFixed(0)}万
            </div>
            <div className="text-sm text-gray-600 mt-1">潜在价值</div>
            <div className="text-xs text-purple-600 mt-1">预期收入</div>
          </CardContent>
        </Card>
      </div>

      {/* 客户列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer group`}
            onClick={() => setSelectedCustomer(customer)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg group-hover:text-green-600 transition-colors duration-300">
                  {customer.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={`${getStatusColor(customer.status)} text-white shadow-sm`}>
                    {getStatusText(customer.status)}
                  </Badge>
                  <Badge className={`${getIntentionColor(customer.intention)} border`}>
                    {getIntentionText(customer.intention)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="truncate">{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="truncate">{customer.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-gray-500" />
                <span>
                  {customer.projectType} · {customer.budget}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>
                  下次跟进：<span className="text-orange-600 font-medium">{customer.nextFollowUp}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {customer.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-green-200 text-green-700">
                    {tag}
                  </Badge>
                ))}
                {customer.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs border-gray-200">
                    +{customer.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-sm text-gray-600">
                  负责人：<span className="font-medium">{customer.assignedTo}</span>
                </div>
                <div className="text-sm font-bold text-green-600">¥{(customer.value / 10000).toFixed(0)}万</div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 hover:bg-green-50 hover:border-green-300 bg-transparent"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  拨打
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 hover:bg-blue-50 hover:border-blue-300 bg-transparent"
                >
                  <MessageSquare className="w-3 h-3 mr-1" />
                  沟通
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:bg-purple-50 hover:border-purple-300 bg-transparent"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {filteredCustomers.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无客户数据</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== "all" || intentionFilter !== "all"
                ? "没有找到符合条件的客户，请调整筛选条件"
                : "还没有客户信息，点击上方按钮添加第一个客户"}
            </p>
            {!searchTerm && statusFilter === "all" && intentionFilter === "all" && (
              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                添加客户
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 客户详情弹窗 */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                客户详情 - {selectedCustomer.name}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3 text-blue-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    基本信息
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">姓名：</span>
                      <span className="font-medium">{selectedCustomer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">电话：</span>
                      <span className="font-medium">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">邮箱：</span>
                      <span className="font-medium">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">地址：</span>
                      <span className="text-right font-medium">{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    项目信息
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">项目类型：</span>
                      <span className="font-medium">{selectedCustomer.projectType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">预算范围：</span>
                      <span className="font-medium">{selectedCustomer.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">意向等级：</span>
                      <Badge className={getIntentionColor(selectedCustomer.intention)}>
                        {getIntentionText(selectedCustomer.intention)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">当前状态：</span>
                      <Badge className={`${getStatusColor(selectedCustomer.status)} text-white`}>
                        {getStatusText(selectedCustomer.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">预期价值：</span>
                      <span className="font-bold text-green-600">¥{(selectedCustomer.value / 10000).toFixed(0)}万</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold mb-3 text-orange-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    跟进信息
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">负责人：</span>
                      <span className="font-medium">{selectedCustomer.assignedTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">客户来源：</span>
                      <span className="font-medium">{selectedCustomer.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">创建时间：</span>
                      <span className="font-medium">{selectedCustomer.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">最后联系：</span>
                      <span className="font-medium">{selectedCustomer.lastContact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">下次跟进：</span>
                      <span className="font-medium text-orange-600">{selectedCustomer.nextFollowUp}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold mb-3 text-purple-600 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    客户标签
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedCustomer.notes.length > 0 && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      跟进记录
                    </h4>
                    <div className="space-y-2">
                      {selectedCustomer.notes.map((note, index) => (
                        <div key={index} className="text-sm p-2 bg-white rounded border-l-2 border-indigo-300">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Edit className="w-4 h-4" />
                    需求描述
                  </h4>
                  <div className="text-sm leading-relaxed">{selectedCustomer.requirements}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button variant="outline" className="hover:bg-green-50 hover:border-green-300 bg-transparent">
                <Phone className="w-4 h-4 mr-2" />
                拨打电话
              </Button>
              <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 bg-transparent">
                <Edit className="w-4 h-4 mr-2" />
                编辑信息
              </Button>
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                更新状态
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
