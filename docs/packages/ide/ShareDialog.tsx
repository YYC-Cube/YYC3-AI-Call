/**
 * @file ShareDialog.tsx
 * @description 项目分享对话框组件，支持链接分享、邮件邀请、权限设置、
 *              协作邀请等功能。已完成 isCyber → useThemeTokens 迁移
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-06
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags share,dialog,collaboration,permissions
 */

import { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Link2,
  Mail,
  Users,
  Globe,
  Lock,
  QrCode,
} from "lucide-react";
import { useThemeTokens } from "./hooks/useThemeTokens";
import { copyToClipboard } from "./utils/clipboard";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  projectName?: string;
}

const SHARE_MEMBERS = [
  {
    name: "张三",
    email: "zhangsan@example.com",
    role: "编辑者",
    avatar: "bg-violet-500",
  },
  {
    name: "李四",
    email: "lisi@example.com",
    role: "查看者",
    avatar: "bg-sky-500",
  },
];

export default function ShareDialog({
  open,
  onClose,
  projectName = "我的项目",
}: ShareDialogProps) {
  const t = useThemeTokens();
  const sd = t.shareDialog;
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  const shareLink = `https://yyc3.dev/share/proj_${Date.now().toString(36)}`;

  const handleCopy = () => {
    copyToClipboard(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      // Mock invite
      setInviteEmail("");
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Dialog */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-[480px] max-w-[90vw] rounded-2xl shadow-2xl overflow-hidden ${sd.dialogBg}`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b ${sd.headerBorder}`}
          >
            <div className="flex items-center gap-2.5">
              <Share2 className={`w-5 h-5 ${sd.headerIcon}`} />
              <div>
                <span className={`text-[0.92rem] ${sd.titleText}`}>
                  分享项目
                </span>
                <span className={`text-[0.7rem] ml-2 ${sd.subtitleText}`}>
                  {projectName}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${sd.closeBtn}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Visibility Toggle */}
            <div>
              <label className={`text-[0.75rem] mb-2 block ${sd.labelText}`}>
                访问权限
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisibility("private")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[0.78rem] border transition-all flex-1 ${
                    visibility === "private"
                      ? sd.toggleActive
                      : sd.toggleInactive
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  仅邀请成员
                </button>
                <button
                  onClick={() => setVisibility("public")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[0.78rem] border transition-all flex-1 ${
                    visibility === "public"
                      ? sd.toggleActive
                      : sd.toggleInactive
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  公开链接
                </button>
              </div>
            </div>

            {/* Share Link */}
            <div>
              <label className={`text-[0.75rem] mb-2 block ${sd.labelText}`}>
                分享链接
              </label>
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${sd.linkAreaBg}`}
              >
                <Link2 className={`w-4 h-4 flex-shrink-0 ${sd.linkIcon}`} />
                <span
                  className={`text-[0.75rem] flex-1 truncate ${sd.linkText}`}
                >
                  {shareLink}
                </span>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[0.7rem] transition-all ${
                    copied ? "text-emerald-500" : sd.copyBtn
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invite by Email */}
            <div>
              <label className={`text-[0.75rem] mb-2 block ${sd.labelText}`}>
                邀请协作者
              </label>
              <div className="flex gap-2">
                <div
                  className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 ${sd.inviteInputArea} transition-colors`}
                >
                  <Mail
                    className={`w-3.5 h-3.5 flex-shrink-0 ${sd.inviteInputIcon}`}
                  />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="输入邮箱地址..."
                    className={`flex-1 bg-transparent border-0 outline-none text-[0.78rem] ${sd.inviteInputText}`}
                  />
                </div>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                  className={`px-4 py-2 rounded-lg text-[0.78rem] transition-all disabled:opacity-40 ${sd.inviteBtn}`}
                >
                  邀请
                </button>
              </div>
            </div>

            {/* Members */}
            <div>
              <label
                className={`text-[0.75rem] mb-2 flex items-center gap-1.5 ${sd.labelText}`}
              >
                <Users className="w-3.5 h-3.5" />
                当前成员 ({SHARE_MEMBERS.length + 1})
              </label>
              <div className="space-y-1.5">
                {/* Owner */}
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${sd.memberRowBg}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[0.6rem]">我</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[0.78rem] ${sd.memberName}`}>
                      你（所有者）
                    </span>
                  </div>
                  <span
                    className={`text-[0.65rem] px-2 py-0.5 rounded-full ${sd.ownerBadge}`}
                  >
                    所有者
                  </span>
                </div>

                {SHARE_MEMBERS.map((m) => (
                  <div
                    key={m.email}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${sd.memberRowHover} transition-colors`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full ${m.avatar} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white text-[0.6rem]">
                        {m.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[0.78rem] ${sd.memberName}`}>
                        {m.name}
                      </span>
                      <span className={`text-[0.65rem] ml-2 ${sd.memberEmail}`}>
                        {m.email}
                      </span>
                    </div>
                    <span
                      className={`text-[0.65rem] px-2 py-0.5 rounded-full ${sd.roleBadge}`}
                    >
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex items-center justify-between px-6 py-3 border-t ${sd.footerBorder}`}
          >
            <button
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors ${sd.qrBtn}`}
            >
              <QrCode className="w-3.5 h-3.5" />
              二维码分享
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-lg text-[0.78rem] transition-all ${sd.doneBtn}`}
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
