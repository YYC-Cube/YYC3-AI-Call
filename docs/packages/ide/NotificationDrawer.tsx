/**
 * @file NotificationDrawer.tsx
 * @description 通知中心抽屉组件，展示系统通知、更新提醒、协作消息，
 *              支持分类过滤、已读标记、一键清除
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags notifications,drawer,ui,messages
 */

import { useState } from "react";
import {
  X,
  Bell,
  Check,
  CheckCheck,
  GitPullRequest,
  AlertTriangle,
  Info,
  Users,
  Rocket,
  Trash2,
} from "lucide-react";
import { useThemeTokens } from "./hooks/useThemeTokens";

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "collab" | "deploy";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "collab",
    title: "协作邀请",
    message: "张三邀请你加入「电商仪表板」项目的实时协作",
    time: "5 分钟前",
    read: false,
  },
  {
    id: "n2",
    type: "deploy",
    title: "部署成功",
    message: "CRM 管理系统 v2.1.0 已成功部署到生产环境",
    time: "1 小时前",
    read: false,
  },
  {
    id: "n3",
    type: "warning",
    title: "构建警告",
    message: "数据可视化平台存在 3 个 TypeScript 类型警告",
    time: "3 小时前",
    read: false,
  },
  {
    id: "n4",
    type: "info",
    title: "系统更新",
    message: "YYC³ AI 引擎已更新至 v3.2，支持更多代码生成模板",
    time: "昨天",
    read: true,
  },
  {
    id: "n5",
    type: "success",
    title: "Git 合并完成",
    message: "feature/dashboard 分支已成功合并到 main",
    time: "2 天前",
    read: true,
  },
];

const TYPE_CONFIG = {
  info: { icon: Info, color: "text-sky-400", bg: "bg-sky-500/10" },
  success: { icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  collab: { icon: Users, color: "text-violet-400", bg: "bg-violet-500/10" },
  deploy: { icon: Rocket, color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({
  open,
  onClose,
}: NotificationDrawerProps) {
  const t = useThemeTokens();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-[380px] max-w-[90vw] flex flex-col shadow-2xl ${t.drawer.bg} ${t.drawer.border}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b flex-shrink-0 ${t.drawer.headerBorder}`}
        >
          <div className="flex items-center gap-2.5">
            <Bell className={`w-5 h-5 ${t.text.accent}`} />
            <span className={`text-[0.95rem] ${t.text.primary}`}>通知中心</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[0.6rem] rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.72rem] transition-colors ${t.drawer.markReadBtn}`}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                全部已读
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${t.drawer.closeBtn}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Bell className={`w-10 h-10 mb-3 ${t.drawer.emptyIcon}`} />
              <span className={`text-[0.82rem] ${t.drawer.emptyText}`}>
                暂无通知
              </span>
            </div>
          ) : (
            notifications.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-5 py-3.5 border-b cursor-pointer group transition-colors ${t.drawer.itemBorder} ${
                    n.read ? "opacity-60" : t.drawer.itemUnread
                  } ${t.drawer.itemHover}`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[0.8rem] truncate ${t.text.primary}`}
                        >
                          {n.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(n.id);
                            }}
                            className={`w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${t.drawer.deleteBtn}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-[0.72rem] mt-0.5 ${t.text.muted}`}>
                        {n.message}
                      </p>
                      <span
                        className={`text-[0.62rem] mt-1 block ${t.text.dim}`}
                      >
                        {n.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex-shrink-0 px-5 py-3 border-t text-center ${t.drawer.footerBorder}`}
        >
          <button
            className={`text-[0.75rem] transition-colors ${t.drawer.footerLink}`}
          >
            查看所有通知
          </button>
        </div>
      </div>
    </>
  );
}
