/**
 * @file hooks/useThemeTokens.ts
 * @description 将主题 CSS 变量映射为 Tailwind class tokens，
 *              消除组件中大量 isCyber 三元表达式，分层支持 Modal/Page/Common/Home/IntentToast/ShareDialog tokens
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.5.0
 * @created 2026-03-10
 * @updated 2026-03-15
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags hooks,theme,tokens,tailwind,css-variables
 */

// ================================================================
// useThemeTokens — 将主题 CSS 变量映射为 Tailwind class tokens
// ================================================================
//
// 用途：消除组件中大量 `isCyber ? "..." : "..."` 三元表达式
//
// 分层设计：
//   - Modal tokens  — 弹窗 / overlay 场景 (ModelSettings, ThemeCustomizer)
//   - Page tokens   — 全页面场景 (SettingsPage, HomePage)
//   - Common tokens — 通用文本 / 按钮 / 状态色
//   - Home tokens   — 主页场景 (chat box, quick actions, live intent, buttons)
//   - IntentToast tokens — 意图提示场景 (toast container, icons, text)
//   - ShareDialog tokens — 分享对话框场景 (dialog container, icons, text)
//   - ThemeSwitcher tokens — 主题切换按钮场景 (compact toggle, full-size button, glow dot, icon glow, label font)
//   - Templates tokens — 模板市场页场景 (page background, top bar, back button, divider, title, search box, view mode buttons, filter section, category, template card, list view card, empty state)
//   - Wizard tokens — 项目创建向导场景 (modal bg, header, steps, template card, form input, config panel, confirm panel, footer buttons)
// ================================================================

import { useMemo } from "react";
import { useTheme } from "../ThemeStore";

// ── Modal-level tokens (弹窗组件) ──
export interface ModalTokens {
  overlayBg: string;
  modalBg: string;
  modalBorder: string;
  modalShadow: string;
  surfaceInset: string;
}

// ── Page-level tokens (全页面) ──
export interface PageTokens {
  pageBg: string;
  barBg: string;
  barBorder: string;
  sidebarBg: string;
  sidebarBorder: string;
  cardBg: string;
  cardBorder: string;
  cardBgAlt: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipShadow: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  inputFocus: string;
  selectBg: string;
  navActive: string;
  navInactive: string;
  shortcutRowBg: string;
  kbdStyle: string;
  divider: string;
  avatarGradient: string;
  toggleOn: string;
  toggleOff: string;
  cyberGridClass: string;
}

// ── Gradient tokens ──
export interface GradientTokens {
  title: string;
  button: string;
  buttonHover: string;
  progress: string;
  progressAlt: string;
  avatar: string;
}

// ── Button tokens ──
export interface ButtonTokens {
  accent: string;
  accentHover: string;
  danger: string;
  dangerLight: string;
  saved: string;
  savedActive: string;
  ghost: string;
  ghostHover: string;
}

// ── Status tokens ──
export interface StatusTokens {
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  error: string;
  errorBg: string;
}

// ── Text tokens ──
export interface TextTokens {
  primary: string;
  secondary: string;
  tertiary: string;
  muted: string;
  accent: string;
  heading: string;
  label: string;
  caption: string;
  dim: string; // very dim (timestamps, footer)
  ghost: string; // barely visible (decorative)
}

// ── Chat tokens (AIChatPage, LeftPanel chat bubbles) ──
export interface ChatTokens {
  userBubble: string; // user message bubble (bg + border + text)
  assistantBubble: string; // assistant message bubble (bg + border + text)
  userAvatar: string; // user avatar (bg + border)
  assistantAvatar: string; // assistant avatar (bg + border)
  codeBg: string; // code block background
  codeHeaderBg: string; // code block header
  cursorBg: string; // streaming cursor
  inputWrapperBg: string; // chat input container (bg + border + focus)
  inputText: string; // chat input text + placeholder
  sendBtn: string; // send button
  sendBtnHover: string; // send button hover
  stopBtn: string; // stop streaming button
}

// ── Drawer tokens (NotificationDrawer, sidebars) ──
export interface DrawerTokens {
  bg: string; // drawer background
  border: string; // drawer border (side)
  headerBorder: string; // header bottom border
  itemBorder: string; // item separator border
  itemUnread: string; // unread item background
  itemHover: string; // item hover background
  closeBtn: string; // close button hover
  deleteBtn: string; // delete button hover
  markReadBtn: string; // mark-all-read button
  footerBorder: string; // footer top border
  footerLink: string; // footer link text + hover
  emptyIcon: string; // empty state icon
  emptyText: string; // empty state text
}

// ── Interactive tokens (hover patterns for toolbar buttons) ──
export interface InteractiveTokens {
  ghostBtn: string; // default ghost button text
  ghostBtnHover: string; // ghost button hover (text + bg)
  activeBtn: string; // active/selected state (text + bg)
  hoverBg: string; // generic hover background
  hoverBgStrong: string; // stronger hover background
  activeBg: string; // active background (selected item)
  separator: string; // separator/divider line
  badge: string; // small badge (count)
  sessionItem: string; // session list item (default)
  sessionItemActive: string; // session list item (active)
  sessionItemHover: string; // session list item (hover)
  deleteSessionBtn: string; // session delete button
  importBtn: string; // import button default
  importBtnActive: string; // import button active
  importPanelBg: string; // import panel background
  importPanelBorder: string; // import panel border
  importPanelHeader: string; // import panel header text
  importItemHover: string; // import item hover
}

// ── HomePage tokens (chat box, quick actions, live intent, buttons) ──
export interface HomeTokens {
  chatBoxBg: string; // chat box container bg + border
  actionsBorder: string; // quick actions panel border
  actionBtnHover: string; // quick action button hover + text
  actionIcon: string; // quick action icon color
  actionLabel: string; // quick action label text
  actionShortcut: string; // quick action shortcut text
  plusBtn: string; // plus button border + hover + text
  plusIcon: string; // plus icon color
  textareaText: string; // textarea text + placeholder
  submitBtn: string; // submit button gradient + hover
  liveIntentBorder: string; // live intent section border
  liveIntentIcon: string; // info icon in live intent
  liveIntentText: string; // live intent summary text
  liveIntentConfidence: string; // confidence percentage text
  designerBadge: string; // designer mode badge (bg + text)
  aiBadge: string; // AI mode badge (bg + text)
  featureText: string; // feature highlights text
  newProjectBtn: string; // new project button style
  codingBtn: string; // direct coding button style
  aiChatBtn: string; // AI chat button style
  ctxMenuNormal: string; // context menu normal item
  ctxMenuDanger: string; // context menu danger item
  renameDialogBg: string; // rename dialog bg + border + shadow override
  renameConfirmBtn: string; // rename confirm button style
  navDot: string; // navigation action indicator dot
  cyberGlitchClass: string; // cyber-glitch class for title (empty for navy)
}

// ── IntentToast tokens ──
export interface IntentToastTokens {
  containerBg: string; // toast container bg + border + shadow
  designerIconBg: string; // designer mode icon wrapper bg
  aiIconBg: string; // AI mode icon wrapper bg
  designerIconColor: string; // designer mode icon color
  aiIconColor: string; // AI mode icon color
  summaryText: string; // summary text color
  categoryText: string; // category text color
  closeText: string; // close button text color
  progressBg: string; // progress bar track bg
  designerProgressGradient: string; // designer progress bar fill
  aiProgressGradient: string; // AI progress bar fill
  percentageText: string; // percentage number text
  lightbulbColor: string; // lightbulb icon color
  suggestionText: string; // suggestion text color
  bottomBorder: string; // bottom action bar border
  bottomText: string; // bottom action bar text
  loaderColor: string; // loader spinner color
}

// ── ShareDialog tokens (分享对话框) ──
export interface ShareDialogTokens {
  dialogBg: string; // dialog container bg + border
  headerBorder: string; // header bottom border
  headerIcon: string; // Share2 icon color
  titleText: string; // dialog title text
  subtitleText: string; // project name subtitle text
  closeBtn: string; // close button (text + hover)
  labelText: string; // all section labels
  toggleActive: string; // visibility toggle active state
  toggleInactive: string; // visibility toggle inactive state
  linkAreaBg: string; // share link container bg + border
  linkIcon: string; // Link2 icon color
  linkText: string; // share link text color
  copyBtn: string; // copy button (text + hover)
  inviteInputArea: string; // invite input wrapper (bg + border + focus)
  inviteInputIcon: string; // Mail icon color
  inviteInputText: string; // invite input text + placeholder
  inviteBtn: string; // invite button style
  memberRowBg: string; // member row static bg (owner)
  memberRowHover: string; // member row hover bg (members)
  memberName: string; // member name text
  memberEmail: string; // member email text
  ownerBadge: string; // owner role badge
  roleBadge: string; // member role badge
  footerBorder: string; // footer top border
  qrBtn: string; // QR code button
  doneBtn: string; // done/complete button
}

// ── ThemeSwitcher tokens (主题切换按钮) ──
export interface ThemeSwitcherTokens {
  compactBtnHover: string; // compact toggle button hover bg + text
  compactPaletteBtnHover: string; // compact palette button hover bg + text
  fullBtnStyle: string; // full-size button bg + border + text + hover
  glowDot: string; // cyber glow dot (empty for navy)
  iconGlow: string; // icon drop-shadow filter value (empty for navy)
  labelFont: string; // label font-family override (empty for navy)
}

// ── Templates page tokens (模板市场页) ──
export interface TemplatesTokens {
  pageBg: string; // page background
  topBarBg: string; // top bar bg + border
  backBtn: string; // back button text + hover
  divider: string; // vertical divider
  titleText: string; // page title
  searchBg: string; // search box bg + border
  searchIcon: string; // search icon color
  searchInput: string; // search input text + placeholder
  viewBtnActive: string; // active view mode button
  viewBtnInactive: string; // inactive view mode button
  filterLabel: string; // filter section label
  catActive: string; // active category
  catInactive: string; // inactive category
  catCount: string; // category count number
  countText: string; // total count text
  cardBg: string; // template card bg + border
  cardTitle: string; // card title text
  cardDesc: string; // card description text
  tagBg: string; // tag badge bg + text
  starColor: string; // star rating color
  metaText: string; // download count / panel count text
  listCardBg: string; // list view card bg + border
  emptyIcon: string; // empty state icon color
  emptyText: string; // empty state text color
}

// ── Wizard tokens (项目创建向导) ──
export interface WizardTokens {
  modalBg: string; // modal background
  header: string; // header text color
  headerBorder: string; // header bottom border
  headerIconBg: string; // header sparkle icon container bg
  stepBorder: string; // step indicator section border
  stepDone: string; // completed step circle
  stepCurrent: string; // current step circle
  stepPending: string; // pending step circle
  stepLabelCurrent: string; // current step label text
  stepLabelPending: string; // pending step label text
  stepLineDone: string; // completed connector line
  stepLinePending: string; // pending connector line
  cardSelected: string; // selected template card
  cardDefault: string; // default template card
  checkIconBg: string; // check icon background
  formInputBg: string; // form input background
  formInputBorder: string; // form input border
  formInputText: string; // form input text
  formInputFocus: string; // form input focus border
  infoPanel: string; // info panel bg + border
  configPanel: string; // config panel bg + border
  techTag: string; // tech stack tag
  confirmPanel: string; // confirm panel gradient
  backBtn: string; // back button
  createBtn: string; // create button
  nextBtn: string; // next button
  footerBorder: string; // footer top border
  steps: string; // step indicator color (legacy)
  templateCardBg: string; // template card background (legacy)
  configPanelBg: string; // config panel background (legacy)
  configPanelBorder: string; // config panel border (legacy)
  confirmPanelBg: string; // confirm panel background (legacy)
  confirmPanelBorder: string; // confirm panel border (legacy)
  footerBtns: string; // footer button styles (legacy)
}

// ── Combined tokens interface ──
export interface ThemeTokens {
  // Legacy flat tokens (backward-compatible with existing ModelSettings usage)
  overlayBg: string;
  modalBg: string;
  modalBorder: string;
  modalShadow: string;
  surfaceInset: string;
  activeBg: string;
  hoverBg: string;
  badgeBg: string;
  accentBg: string;
  accentBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  activeTabText: string;
  sectionBorder: string;
  // Accent color class
  accent: string;

  // Structured tokens
  page: PageTokens;
  btn: ButtonTokens;
  status: StatusTokens;
  text: TextTokens;
  gradients: GradientTokens;
  chat: ChatTokens;
  drawer: DrawerTokens;
  interactive: InteractiveTokens;
  home: HomeTokens;
  intentToast: IntentToastTokens;
  shareDialog: ShareDialogTokens;
  themeSwitcher: ThemeSwitcherTokens;
  templates: TemplatesTokens;
  wizard: WizardTokens;
}

export function useThemeTokens(): ThemeTokens {
  const { isCyber } = useTheme();

  return useMemo<ThemeTokens>(() => {
    if (isCyber) {
      return {
        // ── Legacy flat tokens (backward-compatible) ──
        overlayBg: "bg-black/70",
        modalBg: "bg-[#0a0e17]",
        modalBorder: "border-cyan-500/20",
        modalShadow:
          "0 25px 50px -12px rgba(0,255,255,0.15), 0 0 40px rgba(0,255,255,0.05)",
        surfaceInset: "bg-[#060a12]",
        activeBg: "bg-cyan-500/[0.08]",
        hoverBg: "hover:bg-cyan-500/[0.06]",
        badgeBg: "bg-cyan-500/[0.06]",
        accentBg: "bg-cyan-500/10",
        accentBorder: "border-cyan-500/20",
        textPrimary: "text-cyan-100",
        textSecondary: "text-cyan-200/70",
        textTertiary: "text-cyan-300/40",
        textMuted: "text-cyan-400/25",
        accent: "text-cyan-400",
        activeTabText: "text-cyan-400",
        sectionBorder: "border-cyan-500/10",

        // ── Structured tokens ──
        page: {
          pageBg: "bg-[#08081a]",
          barBg: "bg-[#0a0a14]/90",
          barBorder: "border-[rgba(0,240,255,0.12)]",
          sidebarBg: "bg-[#0a0a12]/80",
          sidebarBorder: "border-r border-[rgba(0,240,255,0.12)]",
          cardBg: "bg-[#14142a]/60",
          cardBorder: "border-[rgba(0,240,255,0.15)]",
          cardBgAlt: "bg-[#14142a]/80",
          tooltipBg: "bg-[#14142a]",
          tooltipBorder: "border-[rgba(0,240,255,0.25)]",
          tooltipShadow: "shadow-[0_0_10px_rgba(0,240,255,0.1)]",
          inputBg: "bg-[rgba(0,240,255,0.04)]",
          inputBorder: "border-[rgba(0,240,255,0.15)]",
          inputText: "text-[rgba(0,240,255,0.8)]",
          inputPlaceholder: "placeholder:text-[rgba(0,240,255,0.15)]",
          inputFocus: "focus:border-[rgba(0,240,255,0.3)]",
          selectBg: "bg-[rgba(0,240,255,0.04)]",
          navActive: "bg-[rgba(0,240,255,0.12)] text-[#00f0ff]",
          navInactive:
            "text-[rgba(0,240,255,0.4)] hover:text-[#00f0ff] hover:bg-[rgba(0,240,255,0.08)]",
          shortcutRowBg: "bg-[rgba(0,240,255,0.03)]",
          kbdStyle:
            "bg-[rgba(0,240,255,0.06)] border-[rgba(0,240,255,0.15)] text-[rgba(0,240,255,0.6)]",
          divider: "bg-[rgba(0,240,255,0.12)]",
          avatarGradient: "bg-gradient-to-br from-[#ff00ff] to-[#00f0ff]",
          toggleOn: "bg-[rgba(0,240,255,0.4)]",
          toggleOff: "bg-[rgba(0,240,255,0.1)]",
          cyberGridClass: "bg-[#0a0a14]/90",
        },
        btn: {
          accent:
            "bg-[rgba(0,240,255,0.1)] text-[#00f0ff] border border-[rgba(0,240,255,0.2)]",
          accentHover: "hover:bg-[rgba(0,240,255,0.15)]",
          danger:
            "bg-[rgba(255,0,68,0.1)] text-[#ff4466] border border-[rgba(255,0,68,0.2)] hover:bg-[rgba(255,0,68,0.15)]",
          dangerLight:
            "bg-[rgba(255,0,68,0.05)] text-[rgba(255,68,102,0.6)] border border-[rgba(255,0,68,0.1)] hover:bg-[rgba(255,0,68,0.1)]",
          saved:
            "bg-[rgba(0,240,255,0.1)] text-[#00f0ff] border border-[rgba(0,240,255,0.2)] hover:bg-[rgba(0,240,255,0.15)]",
          savedActive:
            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20",
          ghost:
            "bg-[rgba(0,240,255,0.06)] text-[rgba(0,240,255,0.6)] border border-[rgba(0,240,255,0.1)]",
          ghostHover: "hover:bg-[rgba(0,240,255,0.1)]",
        },
        status: {
          success: "text-emerald-400/60",
          successBg:
            "bg-emerald-500/[0.08] text-emerald-400/60 border-emerald-500/15",
          warning: "text-amber-400/40",
          warningBg:
            "bg-amber-500/10 text-amber-400/50 border border-amber-500/10",
          info: "text-indigo-400/60",
          infoBg:
            "bg-indigo-500/10 text-indigo-400/50 border border-indigo-500/10",
          error: "text-rose-400/60",
          errorBg: "bg-rose-500/10 text-rose-400/50 border border-rose-500/10",
        },
        text: {
          primary: "text-[rgba(0,240,255,0.9)]",
          secondary: "text-[rgba(0,240,255,0.7)]",
          tertiary: "text-[rgba(0,240,255,0.5)]",
          muted: "text-[rgba(0,240,255,0.35)]",
          accent: "text-[#00f0ff]",
          heading: "text-[rgba(0,240,255,0.9)]",
          label: "text-[rgba(0,240,255,0.8)]",
          caption: "text-[rgba(0,240,255,0.3)]",
          dim: "text-[rgba(0,240,255,0.2)]",
          ghost: "text-[rgba(0,240,255,0.15)]",
        },
        gradients: {
          title: "bg-gradient-to-r from-[#ff00ff] via-[#00f0ff] to-[#00ff88]",
          button: "bg-gradient-to-r from-[#ff00ff]/20 to-[#00f0ff]/20",
          buttonHover: "hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]",
          progress: "bg-gradient-to-r from-[#ff00ff] to-[#00f0ff]",
          progressAlt: "bg-gradient-to-r from-[#ffff00] to-[#00ff88]",
          avatar: "bg-gradient-to-br from-[#ff00ff] to-[#00f0ff]",
        },
        chat: {
          userBubble:
            "bg-gradient-to-br from-[rgba(0,240,255,0.15)] to-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)] text-[rgba(0,240,255,0.9)]",
          assistantBubble:
            "bg-[rgba(0,240,255,0.03)] border border-[rgba(0,240,255,0.08)] text-[rgba(0,240,255,0.75)]",
          userAvatar:
            "bg-gradient-to-br from-[#ff00ff]/20 to-[#00f0ff]/20 border border-[rgba(0,240,255,0.2)]",
          assistantAvatar:
            "bg-[rgba(0,240,255,0.1)] border border-[rgba(0,240,255,0.15)]",
          codeBg: "bg-[#0a0a18] text-[rgba(0,240,255,0.7)]",
          codeHeaderBg: "bg-[rgba(0,240,255,0.05)]",
          cursorBg: "bg-[#00f0ff]",
          inputWrapperBg:
            "border-[rgba(0,240,255,0.15)] bg-[rgba(0,240,255,0.03)] focus-within:border-[rgba(0,240,255,0.35)] focus-within:shadow-[0_0_20px_rgba(0,240,255,0.08)]",
          inputText:
            "text-[rgba(0,240,255,0.85)] placeholder:text-[rgba(0,240,255,0.2)]",
          sendBtn:
            "bg-gradient-to-br from-[#ff00ff]/30 to-[#00f0ff]/30 text-[#00f0ff]",
          sendBtnHover: "hover:from-[#ff00ff]/40 hover:to-[#00f0ff]/40",
          stopBtn: "bg-red-500/20 text-red-400 hover:bg-red-500/30",
        },
        drawer: {
          bg: "bg-[#0a0a12]",
          border: "border-l border-[rgba(0,240,255,0.2)]",
          headerBorder: "border-[rgba(0,240,255,0.15)]",
          itemBorder: "border-[rgba(0,240,255,0.06)]",
          itemUnread: "bg-[rgba(0,240,255,0.03)]",
          itemHover: "hover:bg-[rgba(0,240,255,0.06)]",
          closeBtn:
            "hover:bg-[rgba(0,240,255,0.08)] text-[rgba(0,240,255,0.5)]",
          deleteBtn: "hover:bg-[rgba(255,0,68,0.15)] text-[rgba(255,0,68,0.5)]",
          markReadBtn:
            "text-[rgba(0,240,255,0.6)] hover:bg-[rgba(0,240,255,0.08)]",
          footerBorder: "border-[rgba(0,240,255,0.1)]",
          footerLink: "text-[rgba(0,240,255,0.5)] hover:text-[#00f0ff]",
          emptyIcon: "text-[rgba(0,240,255,0.15)]",
          emptyText: "text-[rgba(0,240,255,0.3)]",
        },
        interactive: {
          ghostBtn: "text-[rgba(0,240,255,0.4)]",
          ghostBtnHover: "hover:text-[#00f0ff] hover:bg-[rgba(0,240,255,0.08)]",
          activeBtn: "text-[#00f0ff] bg-[rgba(0,240,255,0.1)]",
          hoverBg: "hover:bg-[rgba(0,240,255,0.06)]",
          hoverBgStrong: "hover:bg-[rgba(0,240,255,0.08)]",
          activeBg: "bg-[rgba(0,240,255,0.08)]",
          separator: "bg-[rgba(0,240,255,0.1)]",
          badge: "bg-[rgba(0,240,255,0.15)] text-[rgba(0,240,255,0.6)]",
          sessionItem:
            "hover:bg-[rgba(0,240,255,0.04)] border border-transparent",
          sessionItemActive:
            "bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)]",
          sessionItemHover: "hover:bg-[rgba(0,240,255,0.04)]",
          deleteSessionBtn:
            "hover:bg-red-500/20 text-red-400/50 hover:text-red-400",
          importBtn:
            "text-[rgba(0,240,255,0.35)] hover:text-[rgba(0,240,255,0.6)] border-transparent hover:border-[rgba(0,240,255,0.1)] hover:bg-[rgba(0,240,255,0.04)]",
          importBtnActive:
            "text-[#00f0ff] bg-[rgba(0,240,255,0.08)] border-[rgba(0,240,255,0.15)]",
          importPanelBg: "bg-[rgba(0,240,255,0.02)]",
          importPanelBorder: "border-[rgba(0,240,255,0.12)]",
          importPanelHeader: "text-[rgba(0,240,255,0.4)]",
          importItemHover:
            "text-[rgba(0,240,255,0.5)] hover:text-[#00f0ff] hover:bg-[rgba(0,240,255,0.06)]",
        },
        home: {
          chatBoxBg: "bg-[#0a0a12]/90 border border-[rgba(0,240,255,0.25)]",
          actionsBorder: "border-[rgba(0,240,255,0.15)]",
          actionBtnHover:
            "hover:bg-[rgba(0,240,255,0.06)] text-[rgba(0,240,255,0.7)]",
          actionIcon: "text-[rgba(0,240,255,0.5)]",
          actionLabel: "text-[rgba(0,240,255,0.85)]",
          actionShortcut: "text-[rgba(0,240,255,0.35)]",
          plusBtn:
            "border-[rgba(0,240,255,0.2)] hover:bg-[rgba(0,240,255,0.08)] text-[rgba(0,240,255,0.5)]",
          plusIcon: "text-[rgba(0,240,255,0.5)]",
          textareaText:
            "text-[rgba(0,240,255,0.9)] placeholder:text-[rgba(0,240,255,0.25)]",
          submitBtn:
            "bg-gradient-to-r from-[#ff00ff] to-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.3)]",
          liveIntentBorder: "border-[rgba(0,240,255,0.1)]",
          liveIntentIcon: "text-[rgba(0,240,255,0.35)]",
          liveIntentText: "text-[rgba(0,240,255,0.4)]",
          liveIntentConfidence: "text-[rgba(0,240,255,0.3)]",
          designerBadge: "bg-[rgba(0,240,255,0.1)] text-[#00f0ff]",
          aiBadge: "bg-[rgba(255,255,0,0.1)] text-[#ffff00]",
          featureText: "text-[rgba(0,240,255,0.4)]",
          newProjectBtn:
            "bg-gradient-to-r from-[#ff00ff]/20 to-[#00f0ff]/20 border border-[rgba(0,240,255,0.3)] text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]",
          codingBtn:
            "bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.2)] text-[#00f0ff] hover:bg-[rgba(0,240,255,0.15)] hover:shadow-[0_0_10px_rgba(0,240,255,0.1)]",
          aiChatBtn:
            "bg-[rgba(255,255,0,0.06)] border border-[rgba(255,255,0,0.15)] text-[#ffff00] hover:bg-[rgba(255,255,0,0.12)]",
          ctxMenuNormal:
            "text-[rgba(0,240,255,0.8)] hover:bg-[rgba(0,240,255,0.08)]",
          ctxMenuDanger: "text-[#ff0044] hover:bg-[rgba(255,0,68,0.1)]",
          renameDialogBg:
            "bg-[#14142a] border-[rgba(0,240,255,0.25)] shadow-[0_0_30px_rgba(0,240,255,0.1)]",
          renameConfirmBtn:
            "bg-gradient-to-r from-[#ff00ff]/20 to-[#00f0ff]/20 border border-[rgba(0,240,255,0.3)] text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]",
          navDot: "bg-[rgba(0,240,255,0.3)]",
          cyberGlitchClass: "cyber-glitch",
        },
        intentToast: {
          containerBg:
            "bg-[#14142a]/95 border border-[rgba(0,240,255,0.3)] shadow-[0_0_30px_rgba(0,240,255,0.1)]",
          designerIconBg: "bg-[rgba(0,240,255,0.15)]",
          aiIconBg: "bg-[rgba(251,191,36,0.15)]",
          designerIconColor: "text-[#00f0ff]",
          aiIconColor: "text-[#ffff00]",
          summaryText: "text-[rgba(0,240,255,0.9)]",
          categoryText: "text-[rgba(0,240,255,0.4)]",
          closeText: "text-[rgba(0,240,255,0.4)]",
          progressBg: "bg-[rgba(0,240,255,0.08)]",
          designerProgressGradient:
            "bg-gradient-to-r from-[#ff00ff] to-[#00f0ff]",
          aiProgressGradient: "bg-gradient-to-r from-[#ffff00] to-[#00ff88]",
          percentageText: "text-[rgba(0,240,255,0.6)]",
          lightbulbColor: "text-[rgba(0,240,255,0.4)]",
          suggestionText: "text-[rgba(0,240,255,0.55)]",
          bottomBorder: "border-[rgba(0,240,255,0.12)]",
          bottomText: "text-[rgba(0,240,255,0.35)]",
          loaderColor: "text-[#00f0ff]",
        },
        shareDialog: {
          dialogBg: "bg-[#0a0a12] border border-[rgba(0,240,255,0.25)]",
          headerBorder: "border-[rgba(0,240,255,0.15)]",
          headerIcon: "text-[#00f0ff]",
          titleText: "text-[rgba(0,240,255,0.9)]",
          subtitleText: "text-[rgba(0,240,255,0.35)]",
          closeBtn:
            "hover:bg-[rgba(0,240,255,0.08)] text-[rgba(0,240,255,0.5)]",
          labelText: "text-[rgba(0,240,255,0.5)]",
          toggleActive:
            "bg-[rgba(0,240,255,0.08)] border-[rgba(0,240,255,0.3)] text-[#00f0ff]",
          toggleInactive:
            "border-[rgba(0,240,255,0.1)] text-[rgba(0,240,255,0.4)] hover:border-[rgba(0,240,255,0.2)]",
          linkAreaBg: "bg-[rgba(0,240,255,0.03)] border-[rgba(0,240,255,0.15)]",
          linkIcon: "text-[rgba(0,240,255,0.4)]",
          linkText: "text-[rgba(0,240,255,0.6)]",
          copyBtn: "text-[#00f0ff] hover:bg-[rgba(0,240,255,0.1)]",
          inviteInputArea:
            "bg-[rgba(0,240,255,0.03)] border-[rgba(0,240,255,0.15)] focus-within:border-[rgba(0,240,255,0.4)]",
          inviteInputIcon: "text-[rgba(0,240,255,0.3)]",
          inviteInputText:
            "text-[rgba(0,240,255,0.8)] placeholder:text-[rgba(0,240,255,0.2)]",
          inviteBtn:
            "bg-[rgba(0,240,255,0.12)] border border-[rgba(0,240,255,0.25)] text-[#00f0ff] hover:bg-[rgba(0,240,255,0.2)]",
          memberRowBg: "bg-[rgba(0,240,255,0.03)]",
          memberRowHover: "hover:bg-[rgba(0,240,255,0.03)]",
          memberName: "text-[rgba(0,240,255,0.8)]",
          memberEmail: "text-[rgba(0,240,255,0.3)]",
          ownerBadge: "bg-[rgba(0,240,255,0.08)] text-[rgba(0,240,255,0.5)]",
          roleBadge: "bg-[rgba(0,240,255,0.05)] text-[rgba(0,240,255,0.4)]",
          footerBorder: "border-[rgba(0,240,255,0.1)]",
          qrBtn: "text-[rgba(0,240,255,0.5)] hover:bg-[rgba(0,240,255,0.06)]",
          doneBtn:
            "bg-[rgba(0,240,255,0.1)] text-[#00f0ff] hover:bg-[rgba(0,240,255,0.18)]",
        },
        themeSwitcher: {
          compactBtnHover:
            "hover:bg-[rgba(0,240,255,0.08)] hover:text-[#00f0ff]",
          compactPaletteBtnHover:
            "hover:bg-[rgba(0,240,255,0.1)] text-[rgba(0,240,255,0.4)]",
          fullBtnStyle:
            "bg-[rgba(0,240,255,0.08)] border border-[rgba(0,240,255,0.15)] text-[#00f0ff] hover:bg-[rgba(0,240,255,0.1)]",
          glowDot: "bg-[#00f0ff]",
          iconGlow: "drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]",
          labelFont: "font-mono",
        },
        templates: {
          pageBg: "bg-[#0a0a12]",
          topBarBg: "bg-[#0a0a14]/90 border-[rgba(0,240,255,0.12)]",
          backBtn: "text-[rgba(0,240,255,0.5)] hover:text-[#00f0ff]",
          divider: "bg-[rgba(0,240,255,0.12)]",
          titleText: "text-[rgba(0,240,255,0.9)]",
          searchBg: "bg-[rgba(0,240,255,0.04)] border-[rgba(0,240,255,0.15)]",
          searchIcon: "text-[rgba(0,240,255,0.6)]",
          searchInput:
            "text-[rgba(0,240,255,0.85)] placeholder:text-[rgba(0,240,255,0.2)]",
          viewBtnActive: "bg-[rgba(0,240,255,0.08)] text-[#00f0ff]",
          viewBtnInactive: "text-[rgba(0,240,255,0.5)] hover:text-[#00f0ff]",
          filterLabel: "text-[rgba(0,240,255,0.5)]",
          catActive: "bg-[rgba(0,240,255,0.08)] text-[#00f0ff]",
          catInactive: "text-[rgba(0,240,255,0.5)] hover:text-[#00f0ff]",
          catCount: "text-[rgba(0,240,255,0.5)]",
          countText: "text-[rgba(0,240,255,0.5)]",
          cardBg: "bg-[#14142a]/60 border-[rgba(0,240,255,0.15)]",
          cardTitle: "text-[rgba(0,240,255,0.9)]",
          cardDesc: "text-[rgba(0,240,255,0.5)]",
          tagBg: "bg-[rgba(0,240,255,0.06)] text-[rgba(0,240,255,0.6)]",
          starColor: "text-[#ffcc00]",
          metaText: "text-[rgba(0,240,255,0.5)]",
          listCardBg: "bg-[#14142a]/60 border-[rgba(0,240,255,0.15)]",
          emptyIcon: "text-[rgba(0,240,255,0.15)]",
          emptyText: "text-[rgba(0,240,255,0.3)]",
        },
        wizard: {
          modalBg: "bg-[#0a0a12] border border-[rgba(0,240,255,0.25)]",
          header: "text-[rgba(0,240,255,0.9)]",
          headerBorder: "border-[rgba(0,240,255,0.1)]",
          headerIconBg:
            "bg-gradient-to-br from-[#ff00ff]/20 to-[#00f0ff]/20 border border-[rgba(0,240,255,0.2)]",
          stepBorder: "border-[rgba(0,240,255,0.06)]",
          stepDone: "bg-[#00f0ff] text-black",
          stepCurrent:
            "bg-[rgba(0,240,255,0.2)] text-[#00f0ff] border border-[#00f0ff]",
          stepPending: "bg-[rgba(0,240,255,0.05)] text-[rgba(0,240,255,0.3)]",
          stepLabelCurrent: "text-[#00f0ff]",
          stepLabelPending: "text-[rgba(0,240,255,0.25)]",
          stepLineDone: "bg-[#00f0ff]",
          stepLinePending: "bg-[rgba(0,240,255,0.1)]",
          cardSelected:
            "border-[#00f0ff] bg-[rgba(0,240,255,0.06)] shadow-[0_0_15px_rgba(0,240,255,0.1)]",
          cardDefault:
            "border-[rgba(0,240,255,0.1)] hover:border-[rgba(0,240,255,0.25)] bg-[rgba(0,240,255,0.02)]",
          checkIconBg: "bg-[#00f0ff]",
          formInputBg: "bg-[rgba(0,240,255,0.04)]",
          formInputBorder: "border-[rgba(0,240,255,0.15)]",
          formInputText:
            "text-[rgba(0,240,255,0.85)] placeholder:text-[rgba(0,240,255,0.2)]",
          formInputFocus: "focus:border-[#00f0ff]",
          infoPanel:
            "bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.1)]",
          configPanel:
            "bg-[rgba(0,240,255,0.04)] border border-[rgba(0,240,255,0.1)]",
          techTag:
            "bg-[rgba(0,240,255,0.08)] text-[#00f0ff] border border-[rgba(0,240,255,0.15)]",
          confirmPanel:
            "bg-gradient-to-br from-[rgba(255,0,255,0.06)] to-[rgba(0,240,255,0.06)] border border-[rgba(0,240,255,0.15)]",
          backBtn:
            "text-[rgba(0,240,255,0.5)] hover:text-[rgba(0,240,255,0.8)]",
          createBtn:
            "bg-gradient-to-r from-[#ff00ff] to-[#00f0ff] text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]",
          nextBtn:
            "bg-[rgba(0,240,255,0.15)] text-[#00f0ff] hover:bg-[rgba(0,240,255,0.25)] border border-[rgba(0,240,255,0.2)]",
          footerBorder: "border-[rgba(0,240,255,0.08)]",
          steps: "text-[rgba(0,240,255,0.5)]",
          templateCardBg: "bg-[#14142a]/60 border-[rgba(0,240,255,0.15)]",
          configPanelBg:
            "bg-[#14142a] border-[rgba(0,240,255,0.25)] shadow-[0_0_30px_rgba(0,240,255,0.1)]",
          configPanelBorder: "border-[rgba(0,240,255,0.25)]",
          confirmPanelBg:
            "bg-[#14142a] border-[rgba(0,240,255,0.25)] shadow-[0_0_30px_rgba(0,240,255,0.1)]",
          confirmPanelBorder: "border-[rgba(0,240,255,0.25)]",
          footerBtns:
            "bg-gradient-to-r from-[#ff00ff]/20 to-[#00f0ff]/20 border border-[rgba(0,240,255,0.3)] text-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]",
        },
      };
    }

    // ── Navy theme (default) ──
    return {
      // ── Legacy flat tokens (backward-compatible) ──
      overlayBg: "bg-black/60",
      modalBg: "bg-[#0d1117]",
      modalBorder: "border-white/[0.08]",
      modalShadow:
        "0 25px 50px -12px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.08)",
      surfaceInset: "bg-white/[0.01]",
      activeBg: "bg-indigo-500/[0.06]",
      hoverBg: "hover:bg-white/[0.04]",
      badgeBg: "bg-white/[0.04]",
      accentBg: "bg-indigo-500/10",
      accentBorder: "border-indigo-500/20",
      textPrimary: "text-white/90",
      textSecondary: "text-white/65",
      textTertiary: "text-white/35",
      textMuted: "text-white/20",
      accent: "text-indigo-400",
      activeTabText: "text-indigo-400",
      sectionBorder: "border-white/[0.06]",

      // ── Structured tokens ──
      page: {
        pageBg: "bg-[var(--background)]",
        barBg: "bg-[var(--background)]/90",
        barBorder: "border-[var(--border)]",
        sidebarBg: "bg-[var(--background)]/90",
        sidebarBorder: "border-r border-[var(--border)]/40",
        cardBg: "bg-[var(--card)]",
        cardBorder: "border-[var(--border)]",
        cardBgAlt: "bg-[var(--card)]/80",
        tooltipBg: "bg-[var(--card)]",
        tooltipBorder: "border-[var(--border)]",
        tooltipShadow: "shadow-lg",
        inputBg: "bg-[var(--card)]",
        inputBorder: "border-[var(--border)]",
        inputText: "text-[var(--foreground)]",
        inputPlaceholder: "placeholder:text-[var(--muted-foreground)]/40",
        inputFocus: "focus:border-indigo-400",
        selectBg: "bg-[var(--card)]",
        navActive: "bg-violet-50 text-violet-600",
        navInactive:
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]",
        shortcutRowBg: "bg-[var(--accent)]/50",
        kbdStyle:
          "bg-[var(--card)] border-[var(--border)] text-[var(--muted-foreground)]",
        divider: "bg-[var(--border)]",
        avatarGradient: "bg-gradient-to-br from-violet-500 to-indigo-500",
        toggleOn: "bg-violet-500",
        toggleOff: "bg-gray-300",
        cyberGridClass: "bg-[var(--background)]/90",
      },
      btn: {
        accent: "bg-violet-50 text-violet-600 border border-violet-200",
        accentHover: "hover:bg-violet-100",
        danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
        dangerLight:
          "bg-red-50/50 text-red-400 border border-red-100 hover:bg-red-50",
        saved:
          "bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100",
        savedActive: "bg-emerald-50 text-emerald-600 border border-emerald-200",
        ghost:
          "bg-[var(--accent)] text-[var(--muted-foreground)] border border-[var(--border)]",
        ghostHover: "hover:bg-[var(--accent)]/80",
      },
      status: {
        success: "text-emerald-600",
        successBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        warning: "text-amber-500/60",
        warningBg: "bg-amber-50 text-amber-500 border border-amber-100",
        info: "text-indigo-500",
        infoBg: "bg-indigo-50 text-indigo-400 border border-indigo-100",
        error: "text-rose-500",
        errorBg: "bg-rose-50 text-rose-500 border border-rose-100",
      },
      text: {
        primary: "text-[var(--foreground)]",
        secondary: "text-[var(--muted-foreground)]",
        tertiary: "text-[var(--muted-foreground)]",
        muted: "text-[var(--muted-foreground)]",
        accent: "text-violet-600",
        heading: "text-[var(--foreground)]",
        label: "text-[var(--foreground)]",
        caption: "text-[var(--muted-foreground)]",
        dim: "text-[var(--muted-foreground)]/50",
        ghost: "text-[var(--muted-foreground)]/20",
      },
      gradients: {
        title: "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600",
        button: "bg-gradient-to-r from-violet-600 to-indigo-600",
        buttonHover: "hover:opacity-90",
        progress: "bg-gradient-to-r from-violet-500 to-indigo-500",
        progressAlt: "bg-gradient-to-r from-amber-500 to-orange-500",
        avatar: "bg-gradient-to-br from-violet-500 to-indigo-500",
      },
      chat: {
        userBubble:
          "bg-gradient-to-br from-indigo-500/20 to-violet-500/15 border border-indigo-500/20 text-white/85",
        assistantBubble:
          "bg-white/[0.02] border border-white/[0.05] text-white/70",
        userAvatar:
          "bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/15",
        assistantAvatar: "bg-indigo-500/10 border border-indigo-500/15",
        codeBg: "bg-[#0c0d14] text-white/60",
        codeHeaderBg: "bg-white/[0.03]",
        cursorBg: "bg-indigo-400",
        inputWrapperBg:
          "border-white/[0.08] bg-white/[0.02] focus-within:border-indigo-500/30 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.08)]",
        inputText: "text-white/80 placeholder:text-white/20",
        sendBtn:
          "bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-300",
        sendBtnHover: "hover:from-indigo-500/40 hover:to-violet-500/40",
        stopBtn: "bg-red-500/15 text-red-400 hover:bg-red-500/25",
      },
      drawer: {
        bg: "bg-[var(--card)]",
        border: "border-l border-[var(--border)]",
        headerBorder: "border-[var(--border)]",
        itemBorder: "border-[var(--border)]/30",
        itemUnread: "bg-violet-50/30",
        itemHover: "hover:bg-[var(--accent)]/50",
        closeBtn: "hover:bg-[var(--accent)] text-[var(--muted-foreground)]",
        deleteBtn: "hover:bg-red-50 text-red-400",
        markReadBtn: "text-[var(--muted-foreground)] hover:bg-[var(--accent)]",
        footerBorder: "border-[var(--border)]",
        footerLink: "text-violet-600 hover:text-violet-700",
        emptyIcon: "text-[var(--muted-foreground)] opacity-30",
        emptyText: "text-[var(--muted-foreground)]",
      },
      interactive: {
        ghostBtn: "text-white/40",
        ghostBtnHover: "hover:text-white/80 hover:bg-white/[0.06]",
        activeBtn: "text-indigo-400 bg-indigo-500/10",
        hoverBg: "hover:bg-white/[0.04]",
        hoverBgStrong: "hover:bg-white/[0.06]",
        activeBg: "bg-indigo-500/10",
        separator: "bg-white/[0.06]",
        badge: "bg-white/[0.06] text-white/30",
        sessionItem: "hover:bg-white/[0.03] border border-transparent",
        sessionItemActive: "bg-indigo-500/10 border border-indigo-500/15",
        sessionItemHover: "hover:bg-white/[0.03]",
        deleteSessionBtn:
          "hover:bg-red-500/15 text-white/10 hover:text-red-400",
        importBtn:
          "text-white/20 hover:text-amber-400/60 border-transparent hover:border-amber-500/10 hover:bg-amber-500/[0.04]",
        importBtnActive: "text-amber-400 bg-amber-500/10 border-amber-500/15",
        importPanelBg: "bg-amber-500/[0.02]",
        importPanelBorder: "border-amber-500/10",
        importPanelHeader: "text-amber-400/50",
        importItemHover:
          "text-white/30 hover:text-amber-400 hover:bg-amber-500/[0.06]",
      },
      home: {
        chatBoxBg: "bg-[var(--card)] border border-[var(--border)] shadow-lg",
        actionsBorder: "border-[var(--border)]",
        actionBtnHover: "hover:bg-[var(--accent)]",
        actionIcon: "text-[var(--muted-foreground)]",
        actionLabel: "text-[var(--foreground)]",
        actionShortcut: "text-[var(--muted-foreground)]",
        plusBtn: "border-[var(--border)] hover:bg-[var(--accent)]",
        plusIcon: "text-[var(--muted-foreground)]",
        textareaText:
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
        submitBtn:
          "bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90",
        liveIntentBorder: "border-[var(--border)]/50",
        liveIntentIcon: "text-[var(--muted-foreground)]",
        liveIntentText: "text-[var(--muted-foreground)]",
        liveIntentConfidence: "text-[var(--muted-foreground)]",
        designerBadge: "bg-violet-100 text-violet-600",
        aiBadge: "bg-amber-100 text-amber-600",
        featureText: "text-[var(--muted-foreground)]",
        newProjectBtn:
          "bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-300 text-violet-700 hover:from-violet-200 hover:to-indigo-200",
        codingBtn:
          "bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100",
        aiChatBtn:
          "bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100",
        ctxMenuNormal: "text-[var(--foreground)] hover:bg-[var(--accent)]",
        ctxMenuDanger: "text-[var(--destructive)] hover:bg-[var(--accent)]",
        renameDialogBg: "",
        renameConfirmBtn:
          "bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-300 text-violet-700 hover:from-violet-200 hover:to-indigo-200",
        navDot: "bg-violet-400/40",
        cyberGlitchClass: "",
      },
      intentToast: {
        containerBg: "bg-[var(--card)] border border-[var(--border)]",
        designerIconBg: "bg-violet-100",
        aiIconBg: "bg-amber-100",
        designerIconColor: "text-violet-600",
        aiIconColor: "text-amber-600",
        summaryText: "text-[var(--foreground)]",
        categoryText: "text-[var(--muted-foreground)]",
        closeText: "text-[var(--muted-foreground)]",
        progressBg: "bg-[var(--accent)]",
        designerProgressGradient:
          "bg-gradient-to-r from-violet-500 to-indigo-500",
        aiProgressGradient: "bg-gradient-to-r from-amber-500 to-orange-500",
        percentageText: "text-[var(--muted-foreground)]",
        lightbulbColor: "text-amber-500",
        suggestionText: "text-[var(--muted-foreground)]",
        bottomBorder: "border-[var(--border)]",
        bottomText: "text-[var(--muted-foreground)]",
        loaderColor: "text-violet-500",
      },
      shareDialog: {
        dialogBg: "bg-[var(--card)] border border-[var(--border)]",
        headerBorder: "border-[var(--border)]",
        headerIcon: "text-violet-600",
        titleText: "text-[var(--foreground)]",
        subtitleText: "text-[var(--muted-foreground)]",
        closeBtn: "hover:bg-[var(--accent)] text-[var(--muted-foreground)]",
        labelText: "text-[var(--muted-foreground)]",
        toggleActive: "bg-violet-50 border-violet-300 text-violet-700",
        toggleInactive:
          "border-[var(--border)] text-[var(--muted-foreground)] hover:border-violet-200",
        linkAreaBg: "bg-[var(--accent)]/30 border-[var(--border)]",
        linkIcon: "text-[var(--muted-foreground)]",
        linkText: "text-[var(--foreground)]",
        copyBtn: "text-violet-600 hover:bg-violet-50",
        inviteInputArea:
          "border-[var(--border)] focus-within:border-violet-400",
        inviteInputIcon: "text-[var(--muted-foreground)]",
        inviteInputText:
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
        inviteBtn: "bg-violet-600 text-white hover:bg-violet-700",
        memberRowBg: "bg-[var(--accent)]/30",
        memberRowHover: "hover:bg-[var(--accent)]/30",
        memberName: "text-[var(--foreground)]",
        memberEmail: "text-[var(--muted-foreground)]",
        ownerBadge: "bg-violet-100 text-violet-600",
        roleBadge: "bg-gray-100 text-gray-600",
        footerBorder: "border-[var(--border)]",
        qrBtn: "text-[var(--muted-foreground)] hover:bg-[var(--accent)]",
        doneBtn: "bg-violet-600 text-white hover:bg-violet-700",
      },
      themeSwitcher: {
        compactBtnHover: "hover:bg-white/[0.08] text-slate-400",
        compactPaletteBtnHover: "hover:bg-white/[0.08] text-slate-500",
        fullBtnStyle:
          "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80",
        glowDot: "",
        iconGlow: "",
        labelFont: "",
      },
      templates: {
        pageBg: "bg-[var(--background)]",
        topBarBg: "bg-[var(--background)]/90 border-[var(--border)]",
        backBtn: "text-[var(--foreground)] hover:text-[var(--accent)]",
        divider: "bg-[var(--border)]",
        titleText: "text-[var(--foreground)]",
        searchBg: "bg-[var(--card)] border-[var(--border)]",
        searchIcon: "text-[var(--muted-foreground)]",
        searchInput:
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
        viewBtnActive: "bg-[var(--accent)] text-[var(--foreground)]",
        viewBtnInactive:
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        filterLabel: "text-[var(--muted-foreground)]",
        catActive: "bg-[var(--accent)] text-[var(--foreground)]",
        catInactive:
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        catCount: "text-[var(--muted-foreground)]",
        countText: "text-[var(--muted-foreground)]",
        cardBg: "bg-[var(--card)] border-[var(--border)]",
        cardTitle: "text-[var(--foreground)]",
        cardDesc: "text-[var(--muted-foreground)]",
        tagBg: "bg-[var(--accent)] text-[var(--foreground)]",
        starColor: "text-[#ffcc00]",
        metaText: "text-[var(--muted-foreground)]",
        listCardBg: "bg-[var(--card)] border-[var(--border)]",
        emptyIcon: "text-[var(--muted-foreground)] opacity-30",
        emptyText: "text-[var(--muted-foreground)]",
      },
      wizard: {
        modalBg: "bg-[var(--card)] border border-[var(--border)]",
        header: "text-[var(--foreground)]",
        headerBorder: "border-[var(--border)]",
        headerIconBg: "bg-gradient-to-br from-violet-100 to-indigo-100",
        stepBorder: "border-[var(--border)]/50",
        stepDone: "bg-violet-600 text-white",
        stepCurrent: "bg-violet-100 text-violet-600 border border-violet-300",
        stepPending: "bg-[var(--accent)] text-[var(--muted-foreground)]",
        stepLabelCurrent: "text-violet-600",
        stepLabelPending: "text-[var(--muted-foreground)]",
        stepLineDone: "bg-violet-400",
        stepLinePending: "bg-[var(--border)]",
        cardSelected: "border-violet-400 bg-violet-50 shadow-md",
        cardDefault:
          "border-[var(--border)] hover:border-[var(--border)]/80 bg-[var(--card)]",
        checkIconBg: "bg-violet-600",
        formInputBg: "bg-[var(--card)]",
        formInputBorder: "border-[var(--border)]",
        formInputText:
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]",
        formInputFocus: "focus:border-violet-400",
        infoPanel: "bg-[var(--accent)] border border-[var(--border)]",
        configPanel: "bg-[var(--accent)] border border-[var(--border)]",
        techTag: "bg-violet-100 text-violet-600",
        confirmPanel:
          "bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200",
        backBtn:
          "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
        createBtn:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90",
        nextBtn: "bg-violet-600 text-white hover:bg-violet-700",
        footerBorder: "border-[var(--border)]",
        steps: "text-[var(--muted-foreground)]",
        templateCardBg: "bg-[var(--card)] border-[var(--border)]",
        configPanelBg: "bg-[var(--card)] border-[var(--border)]",
        configPanelBorder: "border-[var(--border)]",
        confirmPanelBg: "bg-[var(--card)] border-[var(--border)]",
        confirmPanelBorder: "border-[var(--border)]",
        footerBtns:
          "bg-[var(--accent)] text-[var(--foreground)] hover:bg-[var(--accent)]/80",
      },
    };
  }, [isCyber]);
}
