"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Upload, Download, Filter, Phone, MapPin, Calendar, Tag } from "lucide-react"

export default function IntelligentPhoneDatabase() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // 颜色系统 - 与其他页面保持一致
  const colorSystem = {
    blue: {
      primary: "border-l-blue-500",
      bg: "bg-blue-50",
      hover: "hover:bg-blue-50",
      icon: "text-blue-500",
    },
    green: {
      primary: "border-l-green-500",
      bg: "bg-green-50",
      hover: "hover:bg-green-50",
      icon: "text-green-500",
    },
    purple: {
      primary: "border-l-purple-500",
      bg: "bg-purple-50",
      hover: "hover:bg-purple-50",
      icon: "text-purple-500",
    },
    orange: {
      primary: "border-l-orange-500",
      bg: "bg-orange-50",
      hover: "hover:bg-orange-50",
      icon: "text-orange-500",
    },
  }

  // 模拟电话号码数据
  const phoneData = [
    {
      id: 1,
      phone: "138****1234",
      name: "张先生",
      region: "北京市朝阳区",
      category: "潜在客户",
      lastContact: "2024-01-15",
      status: "有效",
      tags: ["高意向", "家具需求"],
      notes: "对现代简约风格家具感兴趣",
    },
    {
      id: 2,
      phone: "139****5678",
      name: "李女士",
      region: "上海市浦东新区",
      category: "老客户",
      lastContact: "2024-01-10",
      status: "有效",
      tags: ["VIP客户", "复购"],
      notes: "已购买沙发，询问配套茶几",
    },
    {
      id: 3,
      phone: "186****9012",
      name: "王总",
      region: "广州市天河区",
      category: "企业客户",
      lastContact: "2024-01-08",
      status: "有效",
      tags: ["办公家具", "大客户"],
      notes: "办公室装修，需要整套办公家具",
    },
    {
      id: 4,
      phone: "177****3456",
      name: "陈女士",
      region: "深圳市南山区",
      category: "潜在客户",
      lastContact: "2024-01-05",
      status: "无效",
      tags: ["低意向"],
      notes: "暂时没有购买计划",
    },
  ]

  const filteredData = phoneData.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.phone.includes(searchTerm)
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: phoneData.length,
    valid: phoneData.filter((item) => item.status === "有效").length,
    potential: phoneData.filter((item) => item.category === "潜在客户").length,
    existing: phoneData.filter((item) => item.category === "老客户").length,
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总号码数</CardTitle>
            <Phone className={`h-4 w-4 ${colorSystem.blue.icon}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">电话号码总数</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有效号码</CardTitle>
            <Badge className="bg-green-100 text-green-800">{stats.valid}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
            <p className="text-xs text-muted-foreground">可联系的有效号码</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">潜在客户</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">{stats.potential}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.potential}</div>
            <p className="text-xs text-muted-foreground">待开发的潜在客户</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">老客户</CardTitle>
            <Badge className="bg-purple-100 text-purple-800">{stats.existing}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.existing}</div>
            <p className="text-xs text-muted-foreground">已成交的老客户</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Card className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}>
        <CardHeader>
          <CardTitle>智能电话号码库</CardTitle>
          <CardDescription>管理和维护客户电话号码数据库，支持智能分类和标签管理</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="database" className="space-y-4">
            <TabsList>
              <TabsTrigger value="database">号码库管理</TabsTrigger>
              <TabsTrigger value="import">批量导入</TabsTrigger>
              <TabsTrigger value="analysis">数据分析</TabsTrigger>
            </TabsList>

            <TabsContent value="database" className="space-y-4">
              {/* 搜索和筛选 */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索姓名或电话号码..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="选择客户类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="潜在客户">潜在客户</SelectItem>
                    <SelectItem value="老客户">老客户</SelectItem>
                    <SelectItem value="企业客户">企业客户</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      添加号码
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加新号码</DialogTitle>
                      <DialogDescription>添加新的客户电话号码到数据库</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          电话号码
                        </Label>
                        <Input id="phone" placeholder="请输入电话号码" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          客户姓名
                        </Label>
                        <Input id="name" placeholder="请输入客户姓名" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="region" className="text-right">
                          所在地区
                        </Label>
                        <Input id="region" placeholder="请输入所在地区" className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          客户类型
                        </Label>
                        <Select>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="选择客户类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="潜在客户">潜在客户</SelectItem>
                            <SelectItem value="老客户">老客户</SelectItem>
                            <SelectItem value="企业客户">企业客户</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                          备注信息
                        </Label>
                        <Textarea id="notes" placeholder="请输入备注信息" className="col-span-3" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">取消</Button>
                      <Button>保存</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 数据表格 */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>客户信息</TableHead>
                      <TableHead>电话号码</TableHead>
                      <TableHead>所在地区</TableHead>
                      <TableHead>客户类型</TableHead>
                      <TableHead>最后联系</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>标签</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.notes}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{item.phone}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            {item.region}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            {item.lastContact}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={item.status === "有效" ? "default" : "secondary"}
                            className={
                              item.status === "有效" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              编辑
                            </Button>
                            <Button size="sm" variant="outline">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>批量导入号码</CardTitle>
                  <CardDescription>支持Excel、CSV格式文件批量导入电话号码</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Button variant="outline">选择文件上传</Button>
                      <p className="mt-2 text-sm text-gray-500">支持 .xlsx, .csv 格式，最大10MB</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      下载导入模板
                    </Button>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      数据清洗规则
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>地区分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>北京市</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                      <div className="flex justify-between">
                        <span>上海市</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                      <div className="flex justify-between">
                        <span>广州市</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                      <div className="flex justify-between">
                        <span>深圳市</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>客户类型分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>潜在客户</span>
                        <span className="font-medium">50%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "50%" }}></div>
                      </div>
                      <div className="flex justify-between">
                        <span>老客户</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                      <div className="flex justify-between">
                        <span>企业客户</span>
                        <span className="font-medium">25%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
