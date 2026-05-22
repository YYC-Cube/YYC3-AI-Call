/**
 * @file ThemeCustomizer.tsx
 * @description YYC3 自定义主题编辑器，支持颜色编辑、预设选择、品牌定制、
 *              导入/导出、WCAG 检测、实时预览
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags theme,customizer,colors,wcag,brands,presets
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  X,
  Check,
  Download,
  Upload,
  RotateCcw,
  Copy,
  Palette,
  Type,
  Layout,
  Image,
  Sparkles,
  Eye,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Save,
  Trash2,
  Plus,
  History,
  Contrast,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  PRESET_THEMES,
  applyThemeToDOM,
  clearThemeFromDOM,
  calculateContrast,
  getContrastLevel,
  suggestHarmony,
  exportTheme,
  importTheme,
  createCustomTheme,
  saveThemes,
  loadCustomThemes,
  saveActiveThemeId,
  loadActiveThemeId,
  saveVersions,
  loadVersions,
  type ThemeConfig,
  type ThemeColors,
  type ThemeVersion,
  type HarmonyType,
  type WCAGLevel,
} from "./CustomThemeStore";

// ===== Props =====
interface ThemeCustomizerProps {
  open: boolean;
  onClose: () => void;
}

// ===== Tabs =====
type EditorTab =
  | "presets"
  | "colors"
  | "fonts"
  | "layout"
  | "brand"
  | "access"
  | "manage";

const TABS: {
  id: EditorTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "presets", label: "预设主题", icon: Palette },
  { id: "colors", label: "颜色系统", icon: Contrast },
  { id: "fonts", label: "字体排版", icon: Type },
  { id: "layout", label: "布局参数", icon: Layout },
  { id: "brand", label: "品牌元素", icon: Image },
  { id: "access", label: "无障碍", icon: Eye },
  { id: "manage", label: "主题管理", icon: History },
];

// ===== Color Key Labels =====
const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: "主色",
  primaryForeground: "主色前景",
  secondary: "次色",
  secondaryForeground: "次色前景",
  accent: "强调色",
  accentForeground: "强调前景",
  background: "背景色",
  foreground: "前景色",
  card: "卡片色",
  cardForeground: "卡片前景",
  popover: "弹窗色",
  popoverForeground: "弹窗前景",
  muted: "柔和色",
  mutedForeground: "柔和前景",
  destructive: "破坏性",
  destructiveForeground: "破坏前景",
  border: "边框色",
  input: "输入色",
  ring: "焦点环",
};

// Contrast pairs to check
const CONTRAST_PAIRS: [keyof ThemeColors, keyof ThemeColors, string][] = [
  ["foreground", "background", "正文 / 背景"],
  ["primaryForeground", "primary", "主色按钮文字"],
  ["cardForeground", "card", "卡片文字"],
  ["mutedForeground", "muted", "柔和文字"],
  ["destructiveForeground", "destructive", "危险按钮文字"],
  ["accentForeground", "accent", "强调文字"],
];

// ===== Component =====
export function ThemeCustomizer({ open, onClose }: ThemeCustomizerProps) {
  const [tab, setTab] = useState<EditorTab>("presets");
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>(() =>
    loadCustomThemes(),
  );
  const [activeThemeId, setActiveThemeId] = useState<string | null>(() =>
    loadActiveThemeId(),
  );
  const [editingTheme, setEditingTheme] = useState<ThemeConfig | null>(null);
  const [versions, setVersions] = useState<ThemeVersion[]>(() =>
    loadVersions(),
  );
  const [harmonyType, setHarmonyType] = useState<HarmonyType>("complementary");
  const [expandedSection, setExpandedSection] = useState<string | null>("base");
  const importRef = useRef<HTMLInputElement>(null);

  // All themes = presets + custom
  const allThemes = useMemo(
    () => [...PRESET_THEMES, ...customThemes],
    [customThemes],
  );

  const activeTheme = useMemo(
    () => allThemes.find((t) => t.id === activeThemeId) || null,
    [allThemes, activeThemeId],
  );

  // Apply active theme on mount / change
  useEffect(() => {
    if (activeTheme) {
      applyThemeToDOM(activeTheme);
    }
  }, [activeTheme]);

  // Apply editing theme in real-time for preview
  useEffect(() => {
    if (editingTheme) applyThemeToDOM(editingTheme);
  }, [editingTheme]);

  // Persist
  useEffect(() => {
    saveThemes(customThemes);
  }, [customThemes]);
  useEffect(() => {
    saveActiveThemeId(activeThemeId);
  }, [activeThemeId]);
  useEffect(() => {
    saveVersions(versions);
  }, [versions]);

  // ── Actions ──

  const selectPreset = useCallback((theme: ThemeConfig) => {
    setActiveThemeId(theme.id);
    setEditingTheme(null);
    applyThemeToDOM(theme);
  }, []);

  const startEditing = useCallback((theme: ThemeConfig) => {
    const clone = createCustomTheme(theme);
    setEditingTheme(clone);
    setTab("colors");
  }, []);

  const updateEditingColor = useCallback(
    (key: keyof ThemeColors, value: string) => {
      setEditingTheme((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          colors: { ...prev.colors, [key]: value },
          modified: new Date().toISOString(),
        };
      });
    },
    [],
  );

  const saveEditing = useCallback(() => {
    if (!editingTheme) return;
    // Save version snapshot
    const ver: ThemeVersion = {
      id: `ver_${Date.now()}`,
      themeId: editingTheme.id,
      config: structuredClone(editingTheme),
      timestamp: Date.now(),
      label: `v${versions.filter((v) => v.themeId === editingTheme.id).length + 1}`,
    };
    setVersions((prev) => [...prev.slice(-49), ver]);
    // Add or update custom theme
    setCustomThemes((prev) => {
      const idx = prev.findIndex((t) => t.id === editingTheme.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = editingTheme;
        return updated;
      }
      return [...prev, editingTheme];
    });
    setActiveThemeId(editingTheme.id);
    setEditingTheme(null);
  }, [editingTheme, versions]);

  const cancelEditing = useCallback(() => {
    setEditingTheme(null);
    if (activeTheme) applyThemeToDOM(activeTheme);
    else clearThemeFromDOM();
  }, [activeTheme]);

  const deleteCustomTheme = useCallback(
    (id: string) => {
      setCustomThemes((prev) => prev.filter((t) => t.id !== id));
      if (activeThemeId === id) {
        setActiveThemeId(null);
        clearThemeFromDOM();
      }
    },
    [activeThemeId],
  );

  const resetToDefault = useCallback(() => {
    setActiveThemeId(null);
    setEditingTheme(null);
    clearThemeFromDOM();
  }, []);

  const handleExport = useCallback(() => {
    const theme = editingTheme || activeTheme;
    if (!theme) return;
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.name.replace(/\s+/g, "-")}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editingTheme, activeTheme]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = ev.target?.result as string;
      const imported = importTheme(json);
      if (imported) {
        setCustomThemes((prev) => [...prev, imported]);
        setActiveThemeId(imported.id);
        applyThemeToDOM(imported);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

  const rollbackVersion = useCallback((ver: ThemeVersion) => {
    const config = structuredClone(ver.config);
    config.modified = new Date().toISOString();
    setEditingTheme(config);
    applyThemeToDOM(config);
    setTab("colors");
  }, []);

  // Current theme for display
  const currentTheme = editingTheme || activeTheme;

  // Contrast results
  const contrastResults = useMemo(() => {
    if (!currentTheme) return [];
    return CONTRAST_PAIRS.map(([fg, bg, label]) => {
      const ratio = calculateContrast(
        currentTheme.colors[fg],
        currentTheme.colors[bg],
      );
      const level = getContrastLevel(ratio);
      return { fg, bg, label, ratio, level };
    });
  }, [currentTheme]);

  // Harmony suggestions
  const harmonySuggestions = useMemo(() => {
    if (!currentTheme) return [];
    return suggestHarmony(currentTheme.colors.primary, harmonyType);
  }, [currentTheme, harmonyType]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="theme-customizer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          key="theme-customizer-modal"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="w-[960px] max-w-[95vw] h-[680px] max-h-[90vh] bg-[#0d1117] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col"
          style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-[0.88rem] text-white/90">自定义主题系统</h2>
                <p className="text-[0.62rem] text-white/35">
                  {editingTheme
                    ? `编辑: ${editingTheme.name}`
                    : activeTheme
                      ? `当前: ${activeTheme.name}`
                      : "使用默认主题"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editingTheme && (
                <>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 rounded-lg text-[0.72rem] text-white/50 hover:bg-white/5 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveEditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.72rem] bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    保存主题
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Tabs */}
            <div className="w-[180px] border-r border-white/[0.06] py-2 flex-shrink-0 overflow-y-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-[0.72rem] transition-colors ${
                    tab === t.id
                      ? "bg-indigo-500/[0.08] text-indigo-400 border-r-2 border-indigo-400"
                      : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "presets" && (
                <PresetsTab
                  themes={allThemes}
                  activeThemeId={activeThemeId}
                  onSelect={selectPreset}
                  onEdit={startEditing}
                  onReset={resetToDefault}
                />
              )}
              {tab === "colors" && currentTheme && (
                <ColorsTab
                  theme={currentTheme}
                  isEditing={!!editingTheme}
                  onColorChange={updateEditingColor}
                  onStartEdit={() => {
                    if (!editingTheme && activeTheme) startEditing(activeTheme);
                  }}
                  expandedSection={expandedSection}
                  setExpandedSection={setExpandedSection}
                  harmonyType={harmonyType}
                  setHarmonyType={setHarmonyType}
                  harmonySuggestions={harmonySuggestions}
                />
              )}
              {tab === "colors" && !currentTheme && (
                <EmptyState message="请先选择一个预设主题或创建自定义主题" />
              )}
              {tab === "fonts" && currentTheme && (
                <FontsTab
                  theme={currentTheme}
                  isEditing={!!editingTheme}
                  onFontChange={(category, level, value) => {
                    if (!editingTheme) return;
                    const updated = { ...editingTheme };
                    updated.fonts[category] = { ...updated.fonts[category], [level]: value };
                    setEditingTheme(updated);
                  }}
                  onStartEdit={() => {
                    if (!editingTheme && currentTheme) startEditing(currentTheme);
                  }}
                />
              )}
              {tab === "layout" && currentTheme && (
                <LayoutTab
                  theme={currentTheme}
                  isEditing={!!editingTheme}
                  onLayoutChange={(section, key, value) => {
                    if (!editingTheme) return;
                    const updated = { ...editingTheme };
                    updated.layout[section] = { ...updated.layout[section], [key]: value };
                    setEditingTheme(updated);
                  }}
                  onStartEdit={() => {
                    if (!editingTheme && currentTheme) startEditing(currentTheme);
                  }}
                />
              )}
              {tab === "brand" && currentTheme && (
                <BrandTab
                  theme={currentTheme}
                  isEditing={!!editingTheme}
                  onBrandChange={(section, key, value) => {
                    if (!editingTheme) return;
                    const updated = { ...editingTheme };
                    if (section === 'footer') {
                      updated.branding.footer = value;
                    } else {
                      updated.branding[section] = { ...updated.branding[section], [key]: value };
                    }
                    setEditingTheme(updated);
                  }}
                  onStartEdit={() => {
                    if (!editingTheme && currentTheme) startEditing(currentTheme);
                  }}
                />
              )}
              {tab === "access" && currentTheme && (
                <AccessibilityTab results={contrastResults} />
              )}
              {tab === "manage" && (
                <ManageTab
                  customThemes={customThemes}
                  versions={versions}
                  onDelete={deleteCustomTheme}
                  onImport={(theme) => {
                    setCustomThemes((prev) => [...prev, theme]);
                    setActiveThemeId(theme.id);
                    applyThemeToDOM(theme);
                  }}
                  onExport={handleExport}
                  onImportClick={() => importRef.current?.click()}
                  onRollback={rollbackVersion}
                />
              )}
              {(tab === "fonts" || tab === "layout" || tab === "brand") &&
                !currentTheme && <EmptyState message="请先选择一个主题" />}
            </div>
          </div>

          {/* Hidden import input */}
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ===== Sub-Components =====

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-white/30">
      <Info className="w-8 h-8 mb-3 opacity-40" />
      <p className="text-[0.78rem]">{message}</p>
    </div>
  );
}

// ── Presets Tab ──
function PresetsTab({
  themes,
  activeThemeId,
  onSelect,
  onEdit,
  onReset,
}: {
  themes: ThemeConfig[];
  activeThemeId: string | null;
  onSelect: (t: ThemeConfig) => void;
  onEdit: (t: ThemeConfig) => void;
  onReset: () => void;
}) {
  const presets = themes.filter((t) => t.isPreset);
  const customs = themes.filter((t) => t.isCustom);

  return (
    <div className="space-y-6">
      {/* Reset */}
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] text-white/80">预设主题</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.65rem] text-white/40 hover:bg-white/5 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          恢复默认
        </button>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-3 gap-3">
        {presets.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={activeThemeId === theme.id}
            onSelect={() => onSelect(theme)}
            onEdit={() => onEdit(theme)}
          />
        ))}
      </div>

      {/* Custom themes */}
      {customs.length > 0 && (
        <>
          <h3 className="text-[0.82rem] text-white/80 mt-6">自定义主题</h3>
          <div className="grid grid-cols-3 gap-3">
            {customs.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={activeThemeId === theme.id}
                onSelect={() => onSelect(theme)}
                onEdit={() => onEdit(theme)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
  onEdit,
}: {
  theme: ThemeConfig;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className={`relative rounded-xl border overflow-hidden cursor-pointer group transition-all ${
        isActive
          ? "border-indigo-500/50 ring-1 ring-indigo-500/30"
          : "border-white/[0.08] hover:border-white/[0.15]"
      }`}
      onClick={onSelect}
    >
      {/* Color swatch preview */}
      <div
        className="h-20 p-2 grid grid-cols-5 gap-1"
        style={{ background: theme.colors.background }}
      >
        {[
          theme.colors.primary,
          theme.colors.secondary,
          theme.colors.accent,
          theme.colors.muted,
          theme.colors.destructive,
        ].map((color, i) => (
          <div key={i} className="rounded-md" style={{ background: color }} />
        ))}
      </div>

      {/* Info */}
      <div className="p-2.5 bg-[#0d1117]">
        <div className="flex items-center gap-1.5">
          {theme.type === "dark" ? (
            <Moon className="w-3 h-3 text-indigo-400/60" />
          ) : (
            <Sun className="w-3 h-3 text-amber-400/60" />
          )}
          <span className="text-[0.72rem] text-white/70 truncate">
            {theme.name}
          </span>
          {isActive && <Check className="w-3 h-3 text-indigo-400 ml-auto" />}
        </div>
        <p className="text-[0.58rem] text-white/30 mt-0.5">
          {theme.type === "dark" ? "深色" : "浅色"}{" "}
          {theme.isCustom ? "· 自定义" : "· 预设"}
        </p>
      </div>

      {/* Edit overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        title="基于此创建自定义主题"
      >
        <Copy className="w-3 h-3 text-white/70" />
      </button>
    </div>
  );
}

// ── Colors Tab ──
function ColorsTab({
  theme,
  isEditing,
  onColorChange,
  onStartEdit,
  expandedSection,
  setExpandedSection,
  harmonyType,
  setHarmonyType,
  harmonySuggestions,
}: {
  theme: ThemeConfig;
  isEditing: boolean;
  onColorChange: (key: keyof ThemeColors, value: string) => void;
  onStartEdit: () => void;
  expandedSection: string | null;
  setExpandedSection: (s: string | null) => void;
  harmonyType: HarmonyType;
  setHarmonyType: (t: HarmonyType) => void;
  harmonySuggestions: string[];
}) {
  // Group colors
  const baseKeys: (keyof ThemeColors)[] = [
    "primary",
    "primaryForeground",
    "secondary",
    "secondaryForeground",
    "accent",
    "accentForeground",
  ];
  const surfaceKeys: (keyof ThemeColors)[] = [
    "background",
    "foreground",
    "card",
    "cardForeground",
    "popover",
    "popoverForeground",
  ];
  const utilKeys: (keyof ThemeColors)[] = [
    "muted",
    "mutedForeground",
    "destructive",
    "destructiveForeground",
    "border",
    "input",
    "ring",
  ];

  const sections = [
    { id: "base", label: "基础颜色", keys: baseKeys },
    { id: "surface", label: "表面颜色", keys: surfaceKeys },
    { id: "util", label: "功能颜色", keys: utilKeys },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] text-white/80">颜色系统 — OKLch</h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            开始编辑
          </button>
        )}
      </div>

      {sections.map((section) => (
        <div
          key={section.id}
          className="border border-white/[0.06] rounded-xl overflow-hidden"
        >
          <button
            onClick={() =>
              setExpandedSection(
                expandedSection === section.id ? null : section.id,
              )
            }
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-[0.72rem] text-white/60">
              {section.label}
            </span>
            {expandedSection === section.id ? (
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            )}
          </button>
          {expandedSection === section.id && (
            <div className="px-4 pb-3 space-y-2">
              {section.keys.map((key) => (
                <ColorRow
                  key={key}
                  label={COLOR_LABELS[key]}
                  value={theme.colors[key]}
                  onChange={
                    isEditing ? (v) => onColorChange(key, v) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Harmony suggestions */}
      {isEditing && (
        <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.72rem] text-white/60">配色建议</span>
            <div className="flex items-center gap-1">
              {(
                [
                  "complementary",
                  "analogous",
                  "triadic",
                  "tetradic",
                ] as HarmonyType[]
              ).map((ht) => (
                <button
                  key={ht}
                  onClick={() => setHarmonyType(ht)}
                  className={`px-2 py-0.5 rounded text-[0.6rem] transition-colors ${
                    harmonyType === ht
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-white/30 hover:text-white/50"
                  }`}
                >
                  {ht === "complementary"
                    ? "互补"
                    : ht === "analogous"
                      ? "类比"
                      : ht === "triadic"
                        ? "三角"
                        : "四角"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg border border-white/10"
              style={{ background: theme.colors.primary }}
              title="主色"
            />
            <ChevronRight className="w-3 h-3 text-white/20" />
            {harmonySuggestions.map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                style={{ background: color }}
                title={`点击应用为次色`}
                onClick={() => onColorChange("secondary", color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (onChange && localVal !== value) onChange(localVal);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-7 h-7 rounded-md border border-white/10 flex-shrink-0"
        style={{ background: value }}
      />
      <span className="text-[0.68rem] text-white/50 w-20 flex-shrink-0">
        {label}
      </span>
      {editing && onChange ? (
        <input
          autoFocus
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setLocalVal(value);
              setEditing(false);
            }
          }}
          className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[0.65rem] text-white/70 font-mono outline-none focus:border-indigo-500/40"
        />
      ) : (
        <span
          className={`flex-1 text-[0.65rem] font-mono text-white/35 truncate ${onChange ? "cursor-pointer hover:text-white/55" : ""}`}
          onClick={() => onChange && setEditing(true)}
        >
          {value}
        </span>
      )}
    </div>
  );
}

function EditableTextRow({
  label,
  value,
  onChange,
  isEditing,
  previewStyle,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  isEditing?: boolean;
  previewStyle?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (onChange && localVal !== value) onChange(localVal);
  };

  if (isEditing === false) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[0.62rem] text-white/30 w-16 flex-shrink-0 capitalize">
          {label}
        </span>
        <span
          className="flex-1 text-[0.65rem] text-white/35 font-mono truncate"
          style={previewStyle}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[0.62rem] text-white/30 w-16 flex-shrink-0 capitalize">
        {label}
      </span>
      {editing && onChange ? (
        <input
          autoFocus
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setLocalVal(value);
              setEditing(false);
            }
          }}
          className="flex-1 bg-white/[0.04] border border-white/10 rounded px-2 py-1 text-[0.65rem] text-white/70 font-mono outline-none focus:border-indigo-500/40"
        />
      ) : (
        <span
          className={`flex-1 text-[0.65rem] text-white/35 font-mono truncate ${onChange ? "cursor-pointer hover:text-white/55" : ""}`}
          onClick={() => onChange && setEditing(true)}
          style={previewStyle}
        >
          {value}
        </span>
      )}
    </div>
  );
}

// ── Fonts Tab ──
function FontsTab({ theme, isEditing, onFontChange, onStartEdit }: { theme: ThemeConfig; isEditing: boolean; onFontChange: (category: 'sans' | 'serif' | 'mono', level: string, value: string) => void; onStartEdit: () => void }) {
  const fontGroups = [
    {
      label: "无衬线字体 (Sans-serif)",
      desc: "正文、标题、按钮",
      fonts: theme.fonts.sans,
      category: 'sans' as const,
    },
    {
      label: "衬线字体 (Serif)",
      desc: "引用、特殊文本",
      fonts: theme.fonts.serif,
      category: 'serif' as const,
    },
    {
      label: "等宽字体 (Monospace)",
      desc: "代码、终端",
      fonts: theme.fonts.mono,
      category: 'mono' as const,
    },
  ];

  const sizeScale = [
    { label: "xs", size: "12px", desc: "辅助文字" },
    { label: "sm", size: "14px", desc: "次要文字" },
    { label: "base", size: "16px", desc: "正文" },
    { label: "lg", size: "18px", desc: "小标题" },
    { label: "xl", size: "20px", desc: "中标题" },
    { label: "2xl", size: "24px", desc: "大标题" },
    { label: "3xl", size: "30px", desc: "页面标题" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] text-white/80">字体排版系统</h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            开始编辑
          </button>
        )}
      </div>

      {fontGroups.map((g, gi) => (
        <div
          key={gi}
          className="border border-white/[0.06] rounded-xl p-4 space-y-3"
        >
          <div>
            <p className="text-[0.72rem] text-white/60">{g.label}</p>
            <p className="text-[0.58rem] text-white/25">{g.desc}</p>
          </div>
          {Object.entries(g.fonts).map(([level, fontStr]) => (
            <EditableTextRow
              key={level}
              label={level}
              value={fontStr.split(",")[0].trim().replace(/'/g, "")}
              onChange={(v) => onFontChange(g.category, level, v)}
              isEditing={isEditing}
              previewStyle={{ fontFamily: fontStr }}
            />
          ))}
        </div>
      ))}

      {/* Size scale */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-2">
        <p className="text-[0.72rem] text-white/60 mb-3">字号规范</p>
        {sizeScale.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-[0.62rem] text-white/30 w-10 flex-shrink-0">
              {s.label}
            </span>
            <span className="text-[0.62rem] text-white/25 w-10 flex-shrink-0">
              {s.size}
            </span>
            <span
              className="text-white/50"
              style={{ fontSize: s.size, lineHeight: 1.4 }}
            >
              {s.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layout Tab ──
function LayoutTab({ theme, isEditing, onLayoutChange, onStartEdit }: { theme: ThemeConfig; isEditing: boolean; onLayoutChange: (section: 'radius' | 'shadow' | 'spacing', key: string, value: string) => void; onStartEdit: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] text-white/80">布局参数</h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            开始编辑
          </button>
        )}
      </div>

      {/* Radius */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">圆角 (Radius)</p>
        <div className="flex items-end gap-3 flex-wrap">
          {Object.entries(theme.layout.radius).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <div
                className="w-12 h-12 border border-white/15 bg-white/[0.03]"
                style={{ borderRadius: val }}
              />
              <span className="text-[0.58rem] text-white/30">{key}</span>
              {isEditing ? (
                <input
                  value={val}
                  onChange={(e) => onLayoutChange('radius', key, e.target.value)}
                  className="w-16 text-[0.55rem] text-white/50 bg-white/[0.04] border border-white/10 rounded px-1 py-0.5 text-center outline-none focus:border-indigo-500/40"
                />
              ) : (
                <span className="text-[0.55rem] text-white/20">{val}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Shadow */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">阴影 (Shadow)</p>
        <div className="flex items-end gap-3 flex-wrap">
          {Object.entries(theme.layout.shadow).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <div
                className="w-14 h-14 rounded-lg bg-white/[0.04]"
                style={{ boxShadow: val }}
              />
              <span className="text-[0.58rem] text-white/30">{key}</span>
              {isEditing ? (
                <input
                  value={val}
                  onChange={(e) => onLayoutChange('shadow', key, e.target.value)}
                  className="w-20 text-[0.55rem] text-white/50 bg-white/[0.04] border border-white/10 rounded px-1 py-0.5 text-center outline-none focus:border-indigo-500/40"
                />
              ) : (
                <span className="text-[0.55rem] text-white/20">{val}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Spacing */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">间距 (Spacing)</p>
        <div className="space-y-1.5">
          {Object.entries(theme.layout.spacing).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-[0.58rem] text-white/30 w-8 flex-shrink-0">
                sp-{key}
              </span>
              <div className="flex-1 h-3 bg-white/[0.02] rounded overflow-hidden">
                <div
                  className="h-full bg-indigo-500/20 rounded"
                  style={{ width: val }}
                />
              </div>
              {isEditing ? (
                <input
                  value={val}
                  onChange={(e) => onLayoutChange('spacing', key, e.target.value)}
                  className="w-10 text-[0.55rem] text-white/50 bg-white/[0.04] border border-white/10 rounded px-1 py-0.5 text-right outline-none focus:border-indigo-500/40"
                />
              ) : (
                <span className="text-[0.55rem] text-white/20 w-10 text-right flex-shrink-0">
                  {val}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Brand Tab ──
function BrandTab({ theme, isEditing, onBrandChange, onStartEdit }: { theme: ThemeConfig; isEditing: boolean; onBrandChange: (section: string, key: string, value: string) => void; onStartEdit: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      onBrandChange('logo', 'dataUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  }, [onBrandChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] text-white/80">品牌元素定制</h3>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            开始编辑
          </button>
        )}
      </div>

      {/* Logo */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">Logo 配置</p>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center relative overflow-hidden"
            style={{ borderRadius: theme.branding.logo.radius }}
          >
            {theme.branding.logo.dataUrl ? (
              <img
                src={theme.branding.logo.dataUrl}
                alt="Logo"
                className="w-12 h-12 object-contain"
              />
            ) : (
              <Image className="w-6 h-6 text-white/15" />
            )}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 hover:bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            <EditableTextRow
              label="尺寸"
              value={theme.branding.logo.size}
              onChange={(v) => onBrandChange('logo', 'size', v)}
              isEditing={isEditing}
            />
            <EditableTextRow
              label="圆角"
              value={theme.branding.logo.radius}
              onChange={(v) => onBrandChange('logo', 'radius', v)}
              isEditing={isEditing}
            />
            <EditableTextRow
              label="透明度"
              value={theme.branding.logo.opacity}
              onChange={(v) => onBrandChange('logo', 'opacity', v)}
              isEditing={isEditing}
            />
            <p className="text-[0.55rem] text-white/20">
              支持 PNG, SVG, JPG (最大 2MB)
            </p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/svg+xml,image/jpeg"
          className="hidden"
          onChange={handleLogoUpload}
        />
      </div>

      {/* Slogan */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">标语配置</p>
        <div className="space-y-2">
          <EditableTextRow
            label="主标语"
            value={theme.branding.slogan.primary}
            onChange={(v) => onBrandChange('slogan', 'primary', v)}
            isEditing={isEditing}
          />
          <EditableTextRow
            label="副标语"
            value={theme.branding.slogan.secondary}
            onChange={(v) => onBrandChange('slogan', 'secondary', v)}
            isEditing={isEditing}
          />
        </div>
      </div>

      {/* Title */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">页面标题</p>
        <div className="space-y-2">
          <EditableTextRow
            label="应用名称"
            value={theme.branding.title.appName}
            onChange={(v) => onBrandChange('title', 'appName', v)}
            isEditing={isEditing}
          />
          <EditableTextRow
            label="标题模板"
            value={theme.branding.title.template}
            onChange={(v) => onBrandChange('title', 'template', v)}
            isEditing={isEditing}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">页脚文本</p>
        <EditableTextRow
          label="页脚内容"
          value={theme.branding.footer}
          onChange={(v) => onBrandChange('footer', '', v)}
          isEditing={isEditing}
        />
      </div>

      {/* Background */}
      <div className="border border-white/[0.06] rounded-xl p-4 space-y-3">
        <p className="text-[0.72rem] text-white/60">背景设置</p>
        <div className="space-y-2">
          <EditableTextRow
            label="类型"
            value={theme.branding.background.type}
            onChange={(v) => onBrandChange('background', 'type', v)}
            isEditing={isEditing}
          />
          <EditableTextRow
            label="值"
            value={theme.branding.background.value}
            onChange={(v) => onBrandChange('background', 'value', v)}
            isEditing={isEditing}
            previewStyle={{ background: theme.branding.background.value }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Accessibility Tab ──
function AccessibilityTab({
  results,
}: {
  results: {
    fg: string;
    bg: string;
    label: string;
    ratio: number;
    level: WCAGLevel;
  }[];
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-[0.82rem] text-white/80">无障碍检查 — WCAG 对比度</h3>

      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 px-4 py-2 bg-white/[0.02] text-[0.62rem] text-white/30">
          <span>配色对</span>
          <span>对比度</span>
          <span>等级</span>
          <span>状态</span>
        </div>

        {results.map((r, i) => (
          <div
            key={i}
            className={`grid grid-cols-4 items-center px-4 py-2.5 border-t border-white/[0.04] ${
              r.level === "fail" ? "bg-red-500/[0.03]" : ""
            }`}
          >
            <span className="text-[0.68rem] text-white/50">{r.label}</span>
            <span className="text-[0.68rem] text-white/40 font-mono tabular-nums">
              {r.ratio.toFixed(2)}:1
            </span>
            <span
              className={`text-[0.65rem] px-1.5 py-0.5 rounded w-fit ${
                r.level === "AAA"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : r.level === "AA"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
              }`}
            >
              {r.level === "fail" ? "不通过" : r.level}
            </span>
            <span>
              {r.level !== "fail" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-500/60" />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
          <div className="text-[0.65rem] text-white/35 space-y-1">
            <p>
              <strong className="text-white/50">AA 标准</strong>: 普通文本对比度
              ≥ 4.5:1
            </p>
            <p>
              <strong className="text-white/50">AAA 标准</strong>:
              普通文本对比度 ≥ 7:1
            </p>
            <p>
              <strong className="text-white/50">大文本 AA</strong>: 对比度 ≥ 3:1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Manage Tab ──
function ManageTab({
  customThemes,
  versions,
  onDelete,
  onImport,
  onExport,
  onImportClick,
  onRollback,
}: {
  customThemes: ThemeConfig[];
  versions: ThemeVersion[];
  onDelete: (id: string) => void;
  onImport: (theme: ThemeConfig) => void;
  onExport: () => void;
  onImportClick: () => void;
  onRollback: (ver: ThemeVersion) => void;
}) {
  const [showExample, setShowExample] = useState(false);
  const [exampleJson, setExampleJson] = useState(() => {
    const exampleTheme: ThemeConfig = {
      version: "2.0.0",
      id: "example_theme",
      name: "示例主题 - 深蓝紫",
      type: "dark",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      colors: {
        primary: "oklch(0.65 0.25 264)",
        primaryForeground: "oklch(0.98 0.01 264)",
        secondary: "oklch(0.55 0.20 200)",
        secondaryForeground: "oklch(0.98 0.01 200)",
        accent: "oklch(0.70 0.22 300)",
        accentForeground: "oklch(0.98 0.01 300)",
        background: "oklch(0.13 0.02 264)",
        foreground: "oklch(0.95 0.01 264)",
        card: "oklch(0.16 0.02 264)",
        cardForeground: "oklch(0.95 0.01 264)",
        popover: "oklch(0.18 0.02 264)",
        popoverForeground: "oklch(0.95 0.01 264)",
        muted: "oklch(0.25 0.02 264)",
        mutedForeground: "oklch(0.60 0.01 264)",
        destructive: "oklch(0.60 0.22 25)",
        destructiveForeground: "oklch(0.98 0.01 25)",
        border: "oklch(0.25 0.02 264)",
        input: "oklch(0.18 0.02 264)",
        ring: "oklch(0.65 0.25 264)",
      },
      chartColors: {
        primary: "oklch(0.65 0.25 264)",
        secondary: "oklch(0.55 0.20 200)",
        accent: "oklch(0.70 0.22 300)",
        muted: "oklch(0.25 0.02 264)",
        grid: "oklch(0.25 0.02 264)",
      },
      sidebarColors: {
        bg: "oklch(0.13 0.02 264)",
        border: "oklch(0.25 0.02 264)",
        active: "oklch(0.65 0.25 264)",
        text: "oklch(0.95 0.01 264)",
        muted: "oklch(0.60 0.01 264)",
      },
      fonts: {
        sans: { primary: "Inter, system-ui, sans-serif" },
        serif: { primary: "Georgia, serif" },
        mono: { primary: "JetBrains Mono, monospace" },
      },
      layout: {
        radius: "0.5rem",
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      },
      branding: {
        logo: "YYC³",
        slogan: "AI 编程助手",
        primaryColor: "oklch(0.65 0.25 264)",
      },
      isPreset: false,
      isCustom: true,
    };
    return JSON.stringify(exampleTheme, null, 2);
  });

  const handleImportFromEditor = useCallback(() => {
    try {
      const imported = importTheme(exampleJson);
      if (imported) {
        onImport(imported);
        alert(`成功导入主题：${imported.name}`);
        setExampleJson(JSON.stringify(imported, null, 2));
      } else {
        alert("导入失败：JSON 格式不正确或缺少必要字段");
      }
    } catch (error) {
      alert("导入失败：JSON 格式错误");
    }
  }, [exampleJson, onImport]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] text-white/80">主题管理</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExample(!showExample)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] border transition-colors ${
              showExample
                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                : "border-white/10 text-white/50 hover:bg-white/5"
            }`}
          >
            <Copy className="w-3 h-3" />
            示例主题
          </button>
          <button
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] border border-white/10 text-white/50 hover:bg-white/5 transition-colors"
          >
            <Upload className="w-3 h-3" />
            导入
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Download className="w-3 h-3" />
            导出
          </button>
        </div>
      </div>

      {/* Example theme editor */}
      {showExample && (
        <div className="border border-indigo-500/30 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-indigo-500/10 text-[0.65rem] text-indigo-400">
            示例主题（可直接编辑后导入）
          </div>
          <div className="p-4">
            <textarea
              value={exampleJson}
              onChange={(e) => setExampleJson(e.target.value)}
              className="w-full h-[300px] bg-[#0d1117] border border-white/[0.08] rounded-lg p-3 text-[0.65rem] text-white/70 font-mono resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
              placeholder="在此编辑主题 JSON..."
            />
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={() => setExampleJson(JSON.stringify(JSON.parse(exampleJson), null, 2))}
                className="px-3 py-1.5 rounded-lg text-[0.65rem] border border-white/10 text-white/50 hover:bg-white/5 transition-colors"
              >
                格式化
              </button>
              <button
                onClick={handleImportFromEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.65rem] bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors"
              >
                <Upload className="w-3 h-3" />
                从编辑框导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom themes list */}
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-white/[0.02] text-[0.65rem] text-white/30">
          自定义主题 ({customThemes.length})
        </div>
        {customThemes.length === 0 ? (
          <div className="px-4 py-6 text-center text-[0.68rem] text-white/25">
            暂无自定义主题
          </div>
        ) : (
          customThemes.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-2.5 border-t border-white/[0.04] hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div
                  className="w-4 h-4 rounded"
                  style={{ background: t.colors.primary }}
                />
                <span className="text-[0.72rem] text-white/60 truncate">
                  {t.name}
                </span>
                <span className="text-[0.58rem] text-white/20 flex-shrink-0">
                  {t.type === "dark" ? "深色" : "浅色"}
                </span>
              </div>
              <span className="text-[0.55rem] text-white/15 flex-shrink-0">
                {new Date(t.modified).toLocaleDateString("zh-CN")}
              </span>
              <button
                onClick={() => onDelete(t.id)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-400/40" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Version history */}
      <div className="border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-white/[0.02] text-[0.65rem] text-white/30">
          版本历史 (最近 {Math.min(versions.length, 10)} / {versions.length})
        </div>
        {versions.length === 0 ? (
          <div className="px-4 py-6 text-center text-[0.68rem] text-white/25">
            暂无版本记录
          </div>
        ) : (
          versions
            .slice(-10)
            .reverse()
            .map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.04] hover:bg-white/[0.02]"
              >
                <History className="w-3 h-3 text-white/20 flex-shrink-0" />
                <span className="text-[0.68rem] text-white/50 flex-1 truncate">
                  {v.config.name} — {v.label}
                </span>
                <span className="text-[0.55rem] text-white/15 flex-shrink-0">
                  {new Date(v.timestamp).toLocaleString("zh-CN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  onClick={() => onRollback(v)}
                  className="text-[0.6rem] text-indigo-400/50 hover:text-indigo-400 transition-colors"
                >
                  回滚
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

export default ThemeCustomizer;

// Default export alias for consistency with other IDE components
// Primary import: `import { ThemeCustomizer } from './ThemeCustomizer'`
