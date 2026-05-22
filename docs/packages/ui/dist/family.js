import { useState } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';
import { MetaOracleDefinition, SentinelDefinition, MasterDefinition, CreativeDefinition, NavigatorDefinition, ThinkerDefinition, ProphetDefinition, BoleroDefinition } from '@yyc3/core/ai-family';

// src/family/FamilyLayout.tsx
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

export { AIFamilyPanel, AgentCard, AgentStatus, FamilyHome, FamilyLayout, FamilyMembers };
//# sourceMappingURL=family.js.map
//# sourceMappingURL=family.js.map