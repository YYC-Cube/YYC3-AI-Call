"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search, Filter, Download, Upload } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  priority: "low" | "medium" | "high" | "urgent";
  lastContact: string;
  nextFollowUp: string;
  tags: string[];
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "张三",
    phone: "13800138001",
    email: "zhangsan@example.com",
    company: "ABC科技有限公司",
    status: "new",
    priority: "high",
    lastContact: "2024-01-20",
    nextFollowUp: "2024-01-22",
    tags: ["教育", "企业培训"],
  },
  {
    id: "2",
    name: "李四",
    phone: "13800138002",
    email: "lisi@example.com",
    company: "XYZ集团",
    status: "contacted",
    priority: "medium",
    lastContact: "2024-01-19",
    nextFollowUp: "2024-01-23",
    tags: ["金融", "投资"],
  },
  {
    id: "3",
    name: "王五",
    phone: "13800138003",
    email: "wangwu@example.com",
    company: "DEF有限公司",
    status: "qualified",
    priority: "urgent",
    lastContact: "2024-01-18",
    nextFollowUp: "2024-01-21",
    tags: ["医疗", "健康"],
  },
];

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  proposal: "bg-purple-100 text-purple-800",
  negotiation: "bg-orange-100 text-orange-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-green-100 text-green-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

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
};

const statusLabels: Record<string, string> = {
  new: "新客户",
  contacted: "已联系",
  qualified: "合格线索",
  proposal: "方案阶段",
  negotiation: "谈判中",
  won: "成交",
  lost: "流失",
};

const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
};

export default function CustomerManagement() {
  const [customers] = useState<Customer[]>(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">客户管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的客户信息、跟进记录和转化状态
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加客户
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>添加新客户</DialogTitle>
                <DialogDescription>
                  填写客户基本信息以创建新的客户档案
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">姓名</label>
                  <Input placeholder="请输入客户姓名" />
                </div>
                <div>
                  <label className="text-sm font-medium">手机号</label>
                  <Input placeholder="请输入手机号" />
                </div>
                <div>
                  <label className="text-sm font-medium">邮箱</label>
                  <Input type="email" placeholder="请输入邮箱地址" />
                </div>
                <div>
                  <label className="text-sm font-medium">公司名称</label>
                  <Input placeholder="请输入公司名称" />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                    创建
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总客户数</CardTitle>
            <Users className={`h-4 w-4 ${colorSystem.blue.icon}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">+12% 较上月</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月新增</CardTitle>
            <Plus className={`h-4 w-4 ${colorSystem.green.icon}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+5 较昨日</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待跟进</CardTitle>
            <Search className={`h-4 w-4 ${colorSystem.orange.icon}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">3 个紧急</p>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <Filter className={`h-4 w-4 ${colorSystem.purple.icon}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68.5%</div>
            <p className="text-xs text-muted-foreground">+2.3% 较上月</p>
          </CardContent>
        </Card>
      </div>

      <Card className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>客户列表</CardTitle>
              <CardDescription>查看和管理所有客户信息</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索客户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="new">新客户</SelectItem>
                  <SelectItem value="contacted">已联系</SelectItem>
                  <SelectItem value="qualified">合格线索</SelectItem>
                  <SelectItem value="proposal">方案阶段</SelectItem>
                  <SelectItem value="negotiation">谈判中</SelectItem>
                  <SelectItem value="won">成交</SelectItem>
                  <SelectItem value="lost">流失</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>公司</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>最后联系</TableHead>
                <TableHead>下次跟进</TableHead>
                <TableHead>标签</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{customer.phone}</span>
                      <span className="text-xs text-muted-foreground">{customer.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{customer.company}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[customer.status]}>
                      {statusLabels[customer.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[customer.priority]} variant="outline">
                      {priorityLabels[customer.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.lastContact}</TableCell>
                  <TableCell>{customer.nextFollowUp}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {customer.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
