/**
 * @file BottomNav.tsx
 * @description 移动端底部导航栏 - 支持 5 个主要导航项、触摸反馈、角标提示
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags mobile,bottom-nav,navigation,responsive
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Home,
  MessageSquare,
  FolderOpen,
  Settings,
  User,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    label: "首页",
    icon: Home,
    path: "/",
  },
  {
    id: "ai-chat",
    label: "AI 对话",
    icon: MessageSquare,
    path: "/ai-chat",
    badge: 3,
  },
  {
    id: "ide",
    label: "IDE",
    icon: FolderOpen,
    path: "/ide",
  },
  {
    id: "settings",
    label: "设置",
    icon: Settings,
    path: "/settings",
  },
  {
    id: "profile",
    label: "我的",
    icon: User,
    path: "/profile",
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(location.pathname);

  const handleNavClick = (item: NavItem) => {
    setActiveItem(item.path);
    navigate(item.path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--ide-bg-surface)] border-t border-[var(--ide-border)] safe-bottom"
      role="navigation"
      aria-label="底部导航"
    >
      <div className="flex items-center justify-around h-14 md:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="relative flex flex-col items-center justify-center w-full h-full touch-feedback"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-[var(--ide-accent)]"
                      : "text-[var(--ide-text-muted)]"
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[0.6rem] rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[0.6rem] mt-0.5 transition-colors ${
                  isActive
                    ? "text-[var(--ide-accent)]"
                    : "text-[var(--ide-text-muted)]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
