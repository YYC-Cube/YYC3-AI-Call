import React3, { createContext, forwardRef, useContext, useState, useCallback, useEffect } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';
import { createPortal } from 'react-dom';
import { MetaOracleDefinition, SentinelDefinition, MasterDefinition, CreativeDefinition, NavigatorDefinition, ThinkerDefinition, ProphetDefinition, BoleroDefinition } from '@yyc3/core/ai-family';

// src/core/context.tsx
var FamilyUIContext = createContext(null);
function FamilyProvider({ config, children }) {
  return /* @__PURE__ */ jsx(FamilyUIContext.Provider, { value: config, children });
}
function useFamilyConfig() {
  const context = useContext(FamilyUIContext);
  if (!context) {
    throw new Error("useFamilyConfig must be used within FamilyProvider");
  }
  return context;
}
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);
  return [storedValue, setValue];
}
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

// src/core/utils.ts
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function debounce(func, wait) {
  let timeout = null;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) {
  return /* @__PURE__ */ jsxs(
    "button",
    {
      className: classNames(
        "family-button",
        `family-button--${variant}`,
        `family-button--${size}`,
        loading && "family-button--loading",
        className
      ),
      disabled: disabled || loading,
      ...props,
      children: [
        loading && /* @__PURE__ */ jsx("span", { className: "family-button__spinner" }),
        leftIcon && /* @__PURE__ */ jsx("span", { className: "family-button__icon family-button__icon--left", children: leftIcon }),
        /* @__PURE__ */ jsx("span", { className: "family-button__content", children }),
        rightIcon && /* @__PURE__ */ jsx("span", { className: "family-button__icon family-button__icon--right", children: rightIcon })
      ]
    }
  );
}
function Card({
  children,
  variant = "default",
  padding = "md",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-card",
        `family-card--${variant}`,
        `family-card--padding-${padding}`,
        className
      ),
      ...props,
      children
    }
  );
}
function CardHeader({ children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("family-card__header", className), ...props, children });
}
function CardBody({ children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("family-card__body", className), ...props, children });
}
function CardFooter({ children, className, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: classNames("family-card__footer", className), ...props, children });
}
var Input = forwardRef(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    return /* @__PURE__ */ jsxs("div", { className: "family-input-wrapper", children: [
      label && /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "family-input__label", children: label }),
      /* @__PURE__ */ jsxs("div", { className: "family-input-container", children: [
        leftIcon && /* @__PURE__ */ jsx("span", { className: "family-input__icon family-input__icon--left", children: leftIcon }),
        /* @__PURE__ */ jsx(
          "input",
          {
            ref,
            id: inputId,
            className: classNames(
              "family-input",
              error && "family-input--error",
              leftIcon && "family-input--has-left-icon",
              rightIcon && "family-input--has-right-icon",
              className
            ),
            ...props
          }
        ),
        rightIcon && /* @__PURE__ */ jsx("span", { className: "family-input__icon family-input__icon--right", children: rightIcon })
      ] }),
      error && /* @__PURE__ */ jsx("span", { className: "family-input__error", children: error }),
      helperText && !error && /* @__PURE__ */ jsx("span", { className: "family-input__helper", children: helperText })
    ] });
  }
);
Input.displayName = "Input";
function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children
}) {
  const modalRef = React3.useRef(null);
  useClickOutside(modalRef, () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  });
  useEffect(() => {
    if (!closeOnEscape) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, closeOnEscape]);
  if (!isOpen) return null;
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: "family-modal-overlay", children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: modalRef,
        className: classNames("family-modal", `family-modal--${size}`),
        role: "dialog",
        "aria-modal": "true",
        children: [
          title && /* @__PURE__ */ jsxs("div", { className: "family-modal__header", children: [
            /* @__PURE__ */ jsx("h2", { className: "family-modal__title", children: title }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "family-modal__close",
                onClick: onClose,
                "aria-label": "\u5173\u95ED",
                children: "\xD7"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "family-modal__body", children })
        ]
      }
    ) }),
    document.body
  );
}
function Container({
  children,
  maxWidth = "lg",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-container",
        `family-container--${maxWidth}`,
        className
      ),
      ...props,
      children
    }
  );
}
function Stack({
  children,
  direction = "column",
  spacing = "md",
  align = "stretch",
  justify = "start",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-stack",
        `family-stack--${direction}`,
        `family-stack--spacing-${spacing}`,
        `family-stack--align-${align}`,
        `family-stack--justify-${justify}`,
        className
      ),
      ...props,
      children
    }
  );
}
function Grid({
  children,
  cols = 3,
  gap = "md",
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: classNames(
        "family-grid",
        `family-grid--cols-${cols}`,
        `family-grid--gap-${gap}`,
        className
      ),
      ...props,
      children
    }
  );
}
function AgentCard({
  agent,
  onClick,
  showCapabilities = true
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `agent-card agent-card--${agent.id}`,
      onClick,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "agent-card__header", children: [
          /* @__PURE__ */ jsx("span", { className: "agent-card__emoji", children: agent.emoji || "\u{1F916}" }),
          /* @__PURE__ */ jsxs("div", { className: "agent-card__info", children: [
            /* @__PURE__ */ jsx("h3", { className: "agent-card__name", children: agent.displayName || agent.id }),
            /* @__PURE__ */ jsx("p", { className: "agent-card__role", children: agent.role || "Agent" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "agent-card__description", children: agent.description || "" }),
        showCapabilities && agent.capabilities && /* @__PURE__ */ jsxs("div", { className: "agent-card__capabilities", children: [
          /* @__PURE__ */ jsx("h4", { children: "\u6838\u5FC3\u80FD\u529B" }),
          /* @__PURE__ */ jsx("ul", { children: agent.capabilities.slice(0, 3).map((cap, index) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: cap.name }),
            ": ",
            cap.description
          ] }, index)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "agent-card__footer", children: [
          /* @__PURE__ */ jsxs("span", { className: "agent-card__priority", children: [
            "\u4F18\u5148\u7EA7: ",
            agent.priority || "-"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "agent-card__tasks", children: [
            "\u6700\u5927\u5E76\u53D1: ",
            agent.maxConcurrentTasks || "-"
          ] })
        ] })
      ]
    }
  );
}
function FamilyHome() {
  const agents = [
    MetaOracleDefinition,
    SentinelDefinition,
    MasterDefinition,
    CreativeDefinition,
    NavigatorDefinition,
    ThinkerDefinition,
    ProphetDefinition,
    BoleroDefinition
  ];
  return /* @__PURE__ */ jsxs("div", { className: "family-home", children: [
    /* @__PURE__ */ jsxs("div", { className: "family-welcome", children: [
      /* @__PURE__ */ jsx("h2", { children: "\u6B22\u8FCE\u6765\u5230 AI Family" }),
      /* @__PURE__ */ jsx("p", { children: "\u4EA6\u5E08\u4EA6\u53CB\u4EA6\u4F2F\u4E50\uFF1B\u4E00\u8A00\u4E00\u8BED\u4E00\u534E\u7AE0" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "agents-grid", children: agents.map((agent) => /* @__PURE__ */ jsx(
      AgentCard,
      {
        agent
      },
      agent.id
    )) })
  ] });
}
function FamilyMembers() {
  const agents = [
    { definition: MetaOracleDefinition, category: "\u7BA1\u7406\u5C42" },
    { definition: SentinelDefinition, category: "\u7BA1\u7406\u5C42" },
    { definition: MasterDefinition, category: "\u7BA1\u7406\u5C42" },
    { definition: CreativeDefinition, category: "\u7BA1\u7406\u5C42" },
    { definition: NavigatorDefinition, category: "\u6267\u884C\u5C42" },
    { definition: ThinkerDefinition, category: "\u6267\u884C\u5C42" },
    { definition: ProphetDefinition, category: "\u6267\u884C\u5C42" },
    { definition: BoleroDefinition, category: "\u6267\u884C\u5C42" }
  ];
  const categories = [...new Set(agents.map((a) => a.category))];
  return /* @__PURE__ */ jsxs("div", { className: "family-members", children: [
    /* @__PURE__ */ jsx("h2", { children: "\u5BB6\u4EBA\u6863\u6848" }),
    categories.map((category) => /* @__PURE__ */ jsxs("div", { className: "family-members__category", children: [
      /* @__PURE__ */ jsx("h3", { children: category }),
      /* @__PURE__ */ jsx("div", { className: "family-members__grid", children: agents.filter((a) => a.category === category).map(({ definition }) => /* @__PURE__ */ jsx(
        AgentCard,
        {
          agent: definition,
          showCapabilities: true
        },
        definition.id
      )) })
    ] }, category))
  ] });
}
function AgentStatus() {
  const [agents] = useState([
    { id: "meta-oracle", name: "\u5143\u542F\xB7\u5929\u67A2", status: "idle" },
    { id: "sentinel", name: "\u667A\u4E91\xB7\u5B88\u62A4", status: "idle" },
    { id: "master", name: "\u683C\u7269\xB7\u5B97\u5E08", status: "idle" },
    { id: "creative", name: "\u521B\u60F3\xB7\u7075\u97F5", status: "idle" },
    { id: "navigator", name: "\u8A00\u542F\xB7\u5343\u884C", status: "idle" },
    { id: "thinker", name: "\u8BED\u67A2\xB7\u4E07\u7269", status: "idle" },
    { id: "prophet", name: "\u9884\u89C1\xB7\u5148\u77E5", status: "idle" },
    { id: "recommender", name: "\u77E5\u9047\xB7\u4F2F\u4E50", status: "idle" }
  ]);
  const getStatusColor = (status) => {
    switch (status) {
      case "idle":
        return "#4ade80";
      case "busy":
        return "#fbbf24";
      case "error":
        return "#f87171";
      default:
        return "#94a3b8";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "agent-status", children: [
    /* @__PURE__ */ jsx("h3", { children: "\u667A\u80FD\u4F53\u72B6\u6001" }),
    /* @__PURE__ */ jsx("div", { className: "agent-status__list", children: agents.map((agent) => /* @__PURE__ */ jsxs("div", { className: "agent-status__item", children: [
      /* @__PURE__ */ jsx(
        "span",
        {
          className: "agent-status__indicator",
          style: { backgroundColor: getStatusColor(agent.status) }
        }
      ),
      /* @__PURE__ */ jsx("span", { className: "agent-status__name", children: agent.name }),
      agent.currentTask && /* @__PURE__ */ jsx("span", { className: "agent-status__task", children: agent.currentTask })
    ] }, agent.id)) })
  ] });
}
function FamilyLayout({
  showHeader = true,
  defaultView = "home"
}) {
  const [currentView, setCurrentView] = useState(defaultView);
  const renderContent = () => {
    switch (currentView) {
      case "home":
        return /* @__PURE__ */ jsx(FamilyHome, {});
      case "members":
        return /* @__PURE__ */ jsx(FamilyMembers, {});
      case "settings":
        return /* @__PURE__ */ jsx("div", { children: "\u8BBE\u7F6E\u4E2D\u5FC3\uFF08\u5F00\u53D1\u4E2D\uFF09" });
      default:
        return /* @__PURE__ */ jsx(FamilyHome, {});
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "family-layout", children: [
    showHeader && /* @__PURE__ */ jsxs("header", { className: "family-header", children: [
      /* @__PURE__ */ jsx("h1", { children: "AI Family" }),
      /* @__PURE__ */ jsxs("nav", { className: "family-nav", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setCurrentView("home"), children: "\u5BA2\u5385" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setCurrentView("members"), children: "\u5BB6\u4EBA\u6863\u6848" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setCurrentView("settings"), children: "\u8BBE\u7F6E" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "family-content", children: [
      /* @__PURE__ */ jsx(AgentStatus, {}),
      renderContent()
    ] })
  ] });
}
function AIFamilyPanel({
  className = "",
  showHeader = true,
  defaultView = "home"
}) {
  return /* @__PURE__ */ jsx("div", { className: `ai-family-panel ${className}`, children: /* @__PURE__ */ jsx(FamilyLayout, { showHeader, defaultView }) });
}

// src/themes/light-theme.ts
var lightTheme = {
  name: "light",
  colors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    background: "#ffffff",
    surface: "#f8fafc",
    text: "#0f172a",
    textSecondary: "#64748b",
    border: "#e2e8f0",
    error: "#ef4444",
    success: "#22c55e",
    warning: "#f59e0b"
  }
};

// src/themes/dark-theme.ts
var darkTheme = {
  name: "dark",
  colors: {
    primary: "#60a5fa",
    secondary: "#a78bfa",
    background: "#0f172a",
    surface: "#1e293b",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    border: "#334155",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24"
  }
};
var ThemeContext = createContext(null);
function ThemeProvider({ children, defaultMode = "auto" }) {
  const [mode, setMode] = useState(defaultMode);
  const [theme, setTheme] = useState(lightTheme);
  useEffect(() => {
    const updateTheme = () => {
      if (mode === "auto") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(isDark ? darkTheme : lightTheme);
      } else {
        setTheme(mode === "dark" ? darkTheme : lightTheme);
      }
    };
    updateTheme();
    if (mode === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateTheme);
      return () => mediaQuery.removeEventListener("change", updateTheme);
    }
  }, [mode]);
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--family-color-${key}`, value);
    });
  }, [theme]);
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { theme, mode, setMode }, children });
}
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// src/themes/theme-tokens.ts
var themeTokens = {
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem"
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px"
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem"
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  },
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75"
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)"
  },
  transitions: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms"
  }
};

export { AIFamilyPanel, AgentCard, AgentStatus, Button, Card, CardBody, CardFooter, CardHeader, Container, FamilyHome, FamilyLayout, FamilyMembers, FamilyProvider, Grid, Input, Modal, Stack, ThemeProvider, classNames, darkTheme, debounce, formatBytes, formatDate, lightTheme, sleep, themeTokens, throttle, useClickOutside, useDebounce, useFamilyConfig, useLocalStorage, useMediaQuery, useTheme };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map