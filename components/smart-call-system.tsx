"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Phone,
  PhoneCall,
  Mic,
  MicOff,
  Square,
  Brain,
  TrendingUp,
  User,
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Headphones,
  FileText,
  RefreshCw,
} from "lucide-react"

// 智能外呼系统数据类型
interface CallRecord {
  id: string
  customerName: string
  phoneNumber: string
  callTime: string
  duration: number
  status: "completed" | "missed" | "busy" | "ongoing"
  sentiment: "positive" | "neutral" | "negative"
  qualityScore: number
  transcript: string
  nextAction: string
  tags: string[]
}

interface VoiceAnalysis {
  emotion: string
  confidence: number
  keywords: string[]
  sentiment: "positive" | "neutral" | "negative"
  urgency: "low" | "medium" | "high"
}

interface ScriptRecommendation {
  scenario: string
  script: string
  successRate: number
  tips: string[]
}

// 模拟数据
const mockCallRecords: CallRecord[] = [
  {
    id: "1",
    customerName: "张先生",
    phoneNumber: "138****8888",
    callTime: "2024-01-22 14:30",
    duration: 480,
    status: "completed",
    sentiment: "positive",
    qualityScore: 92,
    transcript: "客户对新款沙发很感兴趣，询问了价格和材质，表示下周会到店看样...",
    nextAction: "安排下周三下午到店参观",
    tags: ["高意向", "价格敏感", "材质关注"],
  },
  {
    id: "2",
    customerName: "李女士",
    phoneNumber: "139****6666",
    callTime: "2024-01-22 15:15",
    duration: 320,
    status: "completed",
    sentiment: "neutral",
    qualityScore: 78,
    transcript: "客户正在装修，时间还早，希望3个月后再联系...",
    nextAction: "3个月后跟进联系",
    tags: ["装修中", "时间待定", "潜在客户"],
  },
  {
    id: "3",
    customerName: "王总",
    phoneNumber: "136****9999",
    callTime: "2024-01-22 16:00",
    duration: 600,
    status: "ongoing",
    sentiment: "positive",
    qualityScore: 88,
    transcript: "正在通话中...",
    nextAction: "继续沟通",
    tags: ["办公家具", "批量采购", "决策者"],
  },
]

const mockScriptRecommendations: ScriptRecommendation[] = [
  {
    scenario: "首次接触",
    script: "您好，我是左右沙发的客户顾问小王。看到您最近关注了我们的产品，想了解一下您的家装需求...",
    successRate: 85,
    tips: ["语气要亲切自然", "先了解需求再介绍产品", "避免过度推销"],
  },
  {
    scenario: "价格异议",
    script: "我理解您对价格的考虑。我们的产品虽然价格稍高，但在材质和工艺上都有很大优势...",
    successRate: 72,
    tips: ["强调产品价值", "提供性价比分析", "可适当给予优惠"],
  },
  {
    scenario: "竞品对比",
    script: "您提到的那个品牌确实也不错。不过我们在环保材质和售后服务方面有独特优势...",
    successRate: 68,
    tips: ["客观承认竞品优点", "突出自身差异化优势", "避免贬低竞品"],
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
}

export default function SmartCallSystem() {
  const [isRecording, setIsRecording] = useState(false)
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null)
  const [voiceAnalysis, setVoiceAnalysis] = useState<VoiceAnalysis | null>(null)
  const [selectedScript, setSelectedScript] = useState<ScriptRecommendation | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 模拟通话计时
  useEffect(() => {
    if (currentCall?.status === "ongoing") {
      intervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentCall?.status])

  // 模拟语音分析
  useEffect(() => {
    if (isRecording) {
      const timer = setTimeout(() => {
        setVoiceAnalysis({
          emotion: "友好",
          confidence: 0.85,
          keywords: ["价格", "质量", "售后"],
          sentiment: "positive",
          urgency: "medium",
        })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isRecording])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-green-50"
      case "negative":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "ongoing":
        return "bg-blue-500"
      case "missed":
        return "bg-red-500"
      case "busy":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* 智能外呼控制台 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 通话控制面板 */}
        <Card
          className={`border-l-4 ${colorSystem.blue.primary} ${colorSystem.blue.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className={`w-5 h-5 ${colorSystem.blue.icon}`} />
              智能外呼控制台
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">客户电话</label>
              <Input placeholder="请输入客户电话号码" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">外呼类型</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="选择外呼类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">新客户开发</SelectItem>
                  <SelectItem value="followup">客户跟进</SelectItem>
                  <SelectItem value="service">售后服务</SelectItem>
                  <SelectItem value="survey">满意度调查</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                className={`flex-1 ${colorSystem.green.badge} hover:opacity-90 transition-all duration-300`}
                onClick={() => {
                  setCurrentCall(mockCallRecords[2])
                  setCallDuration(0)
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                开始外呼
              </Button>
              <Button variant="outline" className={`${colorSystem.blue.text} ${colorSystem.blue.hover}`}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {/* 通话状态 */}
            {currentCall && (
              <div className={`p-4 ${colorSystem.blue.bg} rounded-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">正在通话</span>
                  <Badge className={getStatusColor(currentCall.status)}>
                    {currentCall.status === "ongoing" ? "进行中" : "已完成"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  客户：{currentCall.customerName} ({currentCall.phoneNumber})
                </div>
                <div className="text-lg font-mono text-center py-2">{formatDuration(callDuration)}</div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={() => setIsRecording(!isRecording)}
                    className="flex-1"
                  >
                    {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                    {isRecording ? "停止录音" : "开始录音"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentCall(null)
                      setCallDuration(0)
                      setIsRecording(false)
                    }}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 实时语音分析 */}
        <Card
          className={`border-l-4 ${colorSystem.purple.primary} ${colorSystem.purple.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className={`w-5 h-5 ${colorSystem.purple.icon}`} />
              AI语音分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            {voiceAnalysis ? (
              <div className="space-y-4">
                <div className={`p-3 ${colorSystem.purple.bg} rounded-lg`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">情感分析</span>
                    <Badge className={getSentimentColor(voiceAnalysis.sentiment)}>{voiceAnalysis.emotion}</Badge>
                  </div>
                  <Progress value={voiceAnalysis.confidence * 100} className="h-2" colorScheme="purple" />
                  <div className="text-xs text-gray-600 mt-1">
                    置信度: {(voiceAnalysis.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-2">关键词识别</div>
                  <div className="flex flex-wrap gap-1">
                    {voiceAnalysis.keywords.map((keyword, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-medium text-blue-600">情绪状态</div>
                    <div className="text-xs text-gray-600">{voiceAnalysis.sentiment}</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="font-medium text-orange-600">紧急程度</div>
                    <div className="text-xs text-gray-600">{voiceAnalysis.urgency}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Headphones className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <div className="text-sm">开始录音后显示语音分析</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 智能话术推荐 */}
        <Card
          className={`border-l-4 ${colorSystem.green.primary} ${colorSystem.green.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className={`w-5 h-5 ${colorSystem.green.icon}`} />
              智能话术推荐
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockScriptRecommendations.map((script, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md ${
                    selectedScript?.scenario === script.scenario ? colorSystem.green.bg : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedScript(script)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{script.scenario}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">{script.successRate}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 line-clamp-2">{script.script}</div>
                </div>
              ))}
            </div>

            {selectedScript && (
              <div className={`mt-4 p-3 ${colorSystem.green.bg} rounded-lg`}>
                <div className="font-medium text-sm mb-2">推荐话术</div>
                <div className="text-sm text-gray-700 mb-3">{selectedScript.script}</div>
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">使用技巧：</div>
                  <ul className="space-y-1">
                    {selectedScript.tips.map((tip, index) => (
                      <li key={index}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 通话记录与质量分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 通话记录列表 */}
        <Card
          className={`border-l-4 ${colorSystem.orange.primary} ${colorSystem.orange.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className={`w-5 h-5 ${colorSystem.orange.icon}`} />
              今日通话记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockCallRecords.map((record) => (
                <div
                  key={record.id}
                  className={`p-4 border rounded-lg transition-all duration-300 hover:shadow-md ${colorSystem.orange.hover}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{record.customerName}</span>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status === "completed"
                        ? "已完成"
                        : record.status === "ongoing"
                          ? "进行中"
                          : record.status === "missed"
                            ? "未接通"
                            : "忙线"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                    <div>电话：{record.phoneNumber}</div>
                    <div>时长：{formatDuration(record.duration)}</div>
                    <div>时间：{record.callTime}</div>
                    <div className="flex items-center gap-1">
                      质量评分：
                      <span
                        className={`font-medium ${
                          record.qualityScore >= 90
                            ? "text-green-600"
                            : record.qualityScore >= 80
                              ? "text-blue-600"
                              : record.qualityScore >= 70
                                ? "text-orange-600"
                                : "text-red-600"
                        }`}
                      >
                        {record.qualityScore}分
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 mb-2 line-clamp-2">{record.transcript}</div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {record.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Badge className={getSentimentColor(record.sentiment)}>
                      {record.sentiment === "positive" ? "积极" : record.sentiment === "negative" ? "消极" : "中性"}
                    </Badge>
                  </div>

                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">下一步行动：</span>
                    <span className="font-medium text-blue-600">{record.nextAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 通话质量统计 */}
        <Card
          className={`border-l-4 ${colorSystem.rose.primary} ${colorSystem.rose.hover} transition-all duration-300 hover:shadow-xl`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className={`w-5 h-5 ${colorSystem.rose.icon}`} />
              通话质量分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 今日统计 */}
              <div>
                <h4 className="font-semibold mb-3 text-rose-600">今日通话统计</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-rose-50 rounded-lg">
                    <div className="text-2xl font-bold text-rose-600">24</div>
                    <div className="text-sm text-gray-600">总通话数</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">18</div>
                    <div className="text-sm text-gray-600">成功接通</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">75%</div>
                    <div className="text-sm text-gray-600">接通率</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">86</div>
                    <div className="text-sm text-gray-600">平均质量分</div>
                  </div>
                </div>
              </div>

              {/* 情感分析统计 */}
              <div>
                <h4 className="font-semibold mb-3 text-rose-600">客户情感分布</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">积极情感</span>
                    <div className="flex items-center gap-2">
                      <Progress value={65} className="w-20 h-2" colorScheme="purple" />
                      <span className="text-sm font-medium text-green-600">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">中性情感</span>
                    <div className="flex items-center gap-2">
                      <Progress value={25} className="w-20 h-2" colorScheme="purple" />
                      <span className="text-sm font-medium text-gray-600">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">消极情感</span>
                    <div className="flex items-center gap-2">
                      <Progress value={10} className="w-20 h-2" colorScheme="purple" />
                      <span className="text-sm font-medium text-red-600">10%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 改进建议 */}
              <div>
                <h4 className="font-semibold mb-3 text-rose-600">AI改进建议</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>话术使用效果良好，建议继续保持</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>建议在价格异议处理上加强培训</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>客户满意度较高，可增加转介绍话术</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
