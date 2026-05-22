"use client";

import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SmartCallSystem from "@/components/smart-call-system";
import CustomerProfile360 from "@/components/customer-profile-360";
import MarketingAutomation from "@/components/marketing-automation";
import CustomerManagement from "@/components/customer-management";
import IntelligentPhoneDatabase from "@/components/intelligent-phone-database";
import IntelligentForms from "@/components/intelligent-forms";
import MobileApplication from "@/components/mobile-application";
import DataAnalytics from "@/components/data-analytics";
import {
  Settings,
  Phone,
  Users,
  BarChart3,
  Smartphone,
  FileText,
  Database,
  Target,
  Bell,
  Menu,
  X,
} from "lucide-react";

export default function CustomerServicePlatform() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 模拟实时数据
  const realTimeStats = {
    totalCalls: 1247,
    activeCalls: 23,
    successRate: 68.5,
    avgCallDuration: "4:32",
    todayCustomers: 156,
    newCustomers: 34,
    followUps: 89,
    conversions: 12,
    onlineAgents: 18,
    totalAgents: 25,
    systemHealth: 98.7,
    responseTime: "1.2s",
  };

  const notifications = [
    {
      id: 1,
      title: "新客户分配",
      message: "您有3个新客户待跟进",
      time: "5分钟前",
      type: "info",
      unread: true,
    },
    {
      id: 2,
      title: "系统更新",
      message: "系统将在今晚进行维护升级",
      time: "1小时前",
      type: "warning",
      unread: true,
    },
    {
      id: 3,
      title: "业绩达成",
      message: "恭喜！本月业绩已达成120%",
      time: "2小时前",
      type: "success",
      unread: false,
    },
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setIsMobileMenuOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExport = () => {
    const data = {
      stats: realTimeStats,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "dark bg-gray-900" : "bg-gradient-to-br from-blue-50 to-indigo-100"}`}
    >
      {/* 顶部导航栏 */}
      <header
        className={`sticky top-0 z-50 shadow-sm transition-colors duration-300 safe-top ${isDarkMode ? "bg-gray-800/90" : "bg-white/90"} backdrop-blur-sm border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 左侧 Logo 和标题 */}
            <div className="flex items-center gap-4">
              <Image
                src="/yyc3-pwa-icon.png"
                alt="YYC³ AI"
                width={120}
                height={40}
                priority
                className="h-8 w-auto sm:h-10"
              />
              <div className="hidden sm:block">
                <h1
                  className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}
                >
                  YYC³ AI Intelligent Calling
                </h1>
                <p
                  className={`text-xs sm:text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                >
                  AI 驱动的智能外呼系统
                </p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  YYC³ AI
                </h1>
              </div>
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* 系统状态 */}
              <Badge
                variant="secondary"
                className="hidden sm:flex bg-green-100 text-green-800"
              >
                系统运行正常
              </Badge>

              {/* 通知按钮 */}
              <Dialog
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`relative ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "hover:bg-gray-50"}`}
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.filter((n) => n.unread).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                        {notifications.filter((n) => n.unread).length}
                      </span>
                    )}
                    <span className="hidden sm:inline ml-2">通知</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={`max-w-md ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}
                >
                  <DialogHeader>
                    <DialogTitle
                      className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}
                    >
                      <Bell className="w-5 h-5 text-blue-600" />
                      系统通知
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border transition-colors duration-200 ${
                          notification.unread
                            ? isDarkMode
                              ? "bg-blue-900/20 border-blue-700"
                              : "bg-blue-50 border-blue-200"
                            : isDarkMode
                              ? "bg-gray-700 border-gray-600"
                              : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div
                              className={`font-medium text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {notification.title}
                            </div>
                            <div
                              className={`text-sm mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                            >
                              {notification.message}
                            </div>
                            <div
                              className={`text-xs mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              {notification.time}
                            </div>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        notifications.forEach((n) => (n.unread = false));
                      }}
                    >
                      全部已读
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setIsNotificationOpen(false)}
                    >
                      关闭
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 设置按钮 */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "hover:bg-gray-50"}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">设置</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={`max-w-2xl ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}
                >
                  <DialogHeader>
                    <DialogTitle
                      className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}
                    >
                      <Settings className="w-5 h-5 text-purple-600" />
                      系统设置
                    </DialogTitle>
                    <DialogDescription>
                      配置您的智能外呼系统参数和偏好设置
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div>
                      <h3
                        className={`font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        外观设置
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              深色模式
                            </div>
                            <div
                              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              切换到深色主题
                            </div>
                          </div>
                          <Switch
                            checked={isDarkMode}
                            onCheckedChange={setIsDarkMode}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              自动刷新
                            </div>
                            <div
                              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              每30秒自动刷新数据
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              声音提醒
                            </div>
                            <div
                              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              新消息声音提醒
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        数据设置
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              数据缓存
                            </div>
                            <div
                              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              本地缓存数据以提升性能
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              数据同步
                            </div>
                            <div
                              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              自动同步到云端
                            </div>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={handleExport}
                        className="flex-1 bg-transparent"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        导出数据
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        className="flex-1 bg-transparent"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        刷新数据
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 用户菜单 */}
              <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "hover:bg-gray-50"}`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">账户</span>
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={`max-w-md ${isDarkMode ? "bg-gray-800 border-gray-700" : ""}`}
                >
                  <DialogHeader>
                    <DialogTitle
                      className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}
                    >
                      <Users className="w-5 h-5 text-green-600" />
                      用户信息
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        管
                      </div>
                      <div>
                        <div
                          className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          系统管理员
                        </div>
                        <div
                          className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                        >
                          admin@yyc-ai.com
                        </div>
                        <div
                          className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                        >
                          最后登录：今天 09:30
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        个人资料
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsSettingsOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        系统设置
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => window.open("/help", "_blank")}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        帮助中心
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                        onClick={() => {
                          if (confirm("确定要退出登录吗？")) {
                            window.location.href = "/login";
                          }
                        }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        退出登录
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* 移动端菜单按钮 */}
              <Button
                variant="outline"
                size="sm"
                className={`lg:hidden touch-target ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "hover:bg-gray-50"}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 lg:pb-8">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-6"
        >
          {/* 桌面端标签导航 */}
          <TabsList
            className={`hidden lg:grid w-full grid-cols-8 mb-8 shadow-lg rounded-xl ${isDarkMode ? "bg-gray-800/80" : "bg-white/80"} backdrop-blur-sm`}
          >
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <BarChart3 className="w-4 h-4" />
              概览
            </TabsTrigger>
            <TabsTrigger
              value="smart-call"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Phone className="w-4 h-4" />
              智能外呼
            </TabsTrigger>
            <TabsTrigger
              value="customer-360"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Users className="w-4 h-4" />
              客户360
            </TabsTrigger>
            <TabsTrigger
              value="marketing"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Target className="w-4 h-4" />
              营销自动化
            </TabsTrigger>
            <TabsTrigger
              value="customer-mgmt"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Users className="w-4 h-4" />
              客户管理
            </TabsTrigger>
            <TabsTrigger
              value="phone-db"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Database className="w-4 h-4" />
              号码库
            </TabsTrigger>
            <TabsTrigger
              value="forms"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <FileText className="w-4 h-4" />
              智能表单
            </TabsTrigger>
            <TabsTrigger
              value="mobile"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
            >
              <Smartphone className="w-4 h-4" />
              移动应用
            </TabsTrigger>
          </TabsList>

          {/* 移动端导航菜单 */}
          {isMobileMenuOpen && (
            <div
              className={`lg:hidden fixed inset-0 z-50 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}
            >
              <div className="flex flex-col h-full">
                <div
                  className={`flex items-center justify-between p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
                >
                  <h2
                    className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                  >
                    功能菜单
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        name: "系统总览",
                        icon: BarChart3,
                        tab: "overview",
                        color: "text-blue-600 bg-blue-50",
                      },
                      {
                        name: "智能外呼",
                        icon: Phone,
                        tab: "smart-call",
                        color: "text-green-600 bg-green-50",
                      },
                      {
                        name: "客户360",
                        icon: Users,
                        tab: "customer-360",
                        color: "text-purple-600 bg-purple-50",
                      },
                      {
                        name: "营销自动化",
                        icon: Target,
                        tab: "marketing",
                        color: "text-pink-600 bg-pink-50",
                      },
                      {
                        name: "客户管理",
                        icon: Users,
                        tab: "customer-mgmt",
                        color: "text-orange-600 bg-orange-50",
                      },
                      {
                        name: "号码库",
                        icon: Database,
                        tab: "phone-db",
                        color: "text-teal-600 bg-teal-50",
                      },
                      {
                        name: "智能表单",
                        icon: FileText,
                        tab: "forms",
                        color: "text-indigo-600 bg-indigo-50",
                      },
                      {
                        name: "移动应用",
                        icon: Smartphone,
                        tab: "mobile",
                        color: "text-rose-600 bg-rose-50",
                      },
                    ].map((module, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={`h-20 flex flex-col gap-2 ${module.color} hover:scale-105 transition-all duration-300 border-2 ${
                          activeTab === module.tab ? "border-current" : ""
                        }`}
                        onClick={() => handleTabChange(module.tab)}
                      >
                        <module.icon className="w-6 h-6" />
                        <span className="text-xs font-medium">
                          {module.name}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 系统总览 */}
          <TabsContent value="overview" className="mt-6">
            <DataAnalytics />
          </TabsContent>

          {/* 各功能模块内容 */}
          <TabsContent value="smart-call">
            <SmartCallSystem />
          </TabsContent>

          <TabsContent value="customer-360">
            <CustomerProfile360 />
          </TabsContent>

          <TabsContent value="marketing">
            <MarketingAutomation />
          </TabsContent>

          <TabsContent value="customer-mgmt">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="phone-db">
            <IntelligentPhoneDatabase />
          </TabsContent>

          <TabsContent value="forms">
            <IntelligentForms />
          </TabsContent>

          <TabsContent value="mobile">
            <MobileApplication />
          </TabsContent>
        </Tabs>
      </div>

      {/* 移动端底部导航栏 */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom border-t backdrop-blur-md transition-colors duration-300 ${
          isDarkMode
            ? "bg-gray-900/95 border-gray-700"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="grid grid-cols-5 h-14">
          {[
            { icon: BarChart3, label: "概览", tab: "overview" },
            { icon: Phone, label: "外呼", tab: "smart-call" },
            { icon: Users, label: "客户", tab: "customer-360" },
            { icon: Target, label: "营销", tab: "marketing" },
            { icon: Database, label: "更多", tab: "" },
          ].map((item) => (
            <button
              key={item.tab}
              onClick={() => {
                if (item.tab === "") {
                  setIsMobileMenuOpen(true);
                } else {
                  handleTabChange(item.tab);
                }
              }}
              className={`touch-target flex flex-col items-center justify-center gap-0.5 transition-colors ${
                activeTab === item.tab && item.tab !== ""
                  ? "text-blue-600"
                  : isDarkMode
                    ? "text-gray-400"
                    : "text-gray-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
