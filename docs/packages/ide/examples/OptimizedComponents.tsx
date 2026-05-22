/**
 * @file examples/OptimizedComponents.tsx
 * @description Zustand Store 优化使用示例，展示细粒度订阅的最佳实践
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @updated 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags examples,zustand,optimization,best-practices
 */

import React from "react";
import {
  useFileContent,
  useActiveFilePath,
  useFileActions,
  useGeneralSettings,
  useThemeSettings,
  useAgents,
  useModelConnectivity,
  useActiveModelId,
  useTasks,
  useTaskActions,
} from "../stores/optimizedHooks";

// ===== 文件编辑器示例 =====

/**
 * ❌ 错误示例：订阅整个 fileContents
 */
function BadFileEditor() {
  // 订阅整个 store，任何文件变化都会重渲染
  const { fileContents, activeFile } = useFileStoreZustand();
  const content = fileContents[activeFile];
  
  return <div>{content}</div>;
}

/**
 * ✅ 正确示例：仅订阅需要的文件内容
 */
function OptimizedFileEditor() {
  // 仅订阅当前文件内容
  const activeFile = useActiveFilePath();
  const fileContent = useFileContent(activeFile);
  const { updateFile } = useFileActions();

  const handleChange = React.useCallback(
    (newContent: string) => {
      updateFile(activeFile, newContent);
    },
    [activeFile, updateFile],
  );

  return (
    <div className="editor">
      <div className="editor-header">{activeFile}</div>
      <textarea
        value={fileContent}
        onChange={(e) => handleChange(e.target.value)}
        className="editor-content"
      />
    </div>
  );
}

// ===== 主题设置面板示例 =====

/**
 * ❌ 错误示例：订阅整个 settings 对象
 */
function BadThemePanel() {
  const { settings } = useSettingsStore();
  const theme = settings.general.theme;
  const fontSize = settings.general.editorFontSize;
  
  return <div>Theme: {theme}, Size: {fontSize}</div>;
}

/**
 * ✅ 正确示例：仅订阅主题相关设置
 */
function OptimizedThemePanel() {
  const { theme, editorFont, editorFontSize } = useThemeSettings();
  const { updateGeneralSettings } = useSettingsStore();

  return (
    <div className="theme-panel">
      <div className="setting-item">
        <label>主题</label>
        <select
          value={theme}
          onChange={(e) => updateGeneralSettings({ theme: e.target.value as any })}
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
          <option value="auto">自动</option>
        </select>
      </div>
      
      <div className="setting-item">
        <label>字体</label>
        <span>{editorFont}</span>
      </div>
      
      <div className="setting-item">
        <label>字号</label>
        <input
          type="number"
          value={editorFontSize}
          onChange={(e) =>
            updateGeneralSettings({ editorFontSize: parseInt(e.target.value) })
          }
        />
      </div>
    </div>
  );
}

// ===== 代理列表示例 =====

/**
 * ❌ 错误示例：订阅整个 settings 对象来获取代理列表
 */
function BadAgentList() {
  const { settings } = useSettingsStore();
  const agents = settings.agents;
  
  return (
    <ul>
      {agents.map((agent) => (
        <li key={agent.id}>{agent.name}</li>
      ))}
    </ul>
  );
}

/**
 * ✅ 正确示例：仅订阅代理列表
 */
function OptimizedAgentList() {
  const agents = useAgents();
  const { updateAgent, removeAgent } = useSettingsStore();

  return (
    <ul className="agent-list">
      {agents.map((agent) => (
        <li key={agent.id} className="agent-item">
          <span>{agent.name}</span>
          <span>{agent.model}</span>
          <button onClick={() => removeAgent(agent.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}

// ===== 模型连接状态示例 =====

/**
 * ✅ 正确示例：仅订阅特定模型的连接状态
 */
function ModelStatusIndicator({ modelId }: { modelId: string }) {
  const connectivity = useModelConnectivity(modelId);

  const getStatusColor = () => {
    switch (connectivity?.status) {
      case "success":
        return "green";
      case "fail":
        return "red";
      case "testing":
        return "yellow";
      default:
        return "gray";
    }
  };

  return (
    <div className="model-status">
      <div
        className="status-indicator"
        style={{ backgroundColor: getStatusColor() }}
      />
      {connectivity?.latencyMs && (
        <span className="latency">{connectivity.latencyMs}ms</span>
      )}
    </div>
  );
}

/**
 * ✅ 正确示例：模型选择器
 */
function ModelSelector() {
  const activeModelId = useActiveModelId();
  const { setActiveModelId } = useModelStoreZustand();

  return (
    <select
      value={activeModelId}
      onChange={(e) => setActiveModelId(e.target.value)}
      className="model-selector"
    >
      <option value="gpt-4">GPT-4</option>
      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
      <option value="claude-3">Claude 3</option>
    </select>
  );
}

// ===== 任务看板示例 =====

/**
 * ✅ 正确示例：仅订阅特定状态的任务
 */
function TodoTaskList() {
  // 仅订阅待办任务
  const todoTasks = useTasks(
    React.useCallback((task) => task.status === "todo", []),
  );
  const { moveTask } = useTaskActions();

  return (
    <div className="task-list">
      <h3>待办任务 ({todoTasks.length})</h3>
      {todoTasks.map((task) => (
        <div key={task.id} className="task-item">
          <span>{task.title}</span>
          <button onClick={() => moveTask(task.id, "in-progress")}>
            开始
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * ✅ 正确示例：单个任务组件
 */
function TaskItem({ taskId }: { taskId: string }) {
  const task = useTask(taskId);
  const { updateTask } = useTaskActions();

  if (!task) return null;

  return (
    <div className={`task-item priority-${task.priority}`}>
      <h4>{task.title}</h4>
      <p>{task.description}</p>
      <select
        value={task.status}
        onChange={(e) => updateTask(taskId, { status: e.target.value as any })}
      >
        <option value="todo">待办</option>
        <option value="in-progress">进行中</option>
        <option value="review">审核中</option>
        <option value="done">已完成</option>
      </select>
    </div>
  );
}

// ===== 性能监控组件 =====

/**
 * 性能监控组件（开发环境）
 */
function PerformanceMonitor() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="performance-monitor">
      <div>渲染计数器: <RenderCounter /></div>
      <div>Store 状态大小: <StoreSizeIndicator /></div>
    </div>
  );
}

function RenderCounter() {
  const countRef = React.useRef(0);
  React.useEffect(() => {
    countRef.current += 1;
  });
  return <span>{countRef.current}</span>;
}

function StoreSizeIndicator() {
  const fileStoreSize = React.useMemo(() => {
    const state = useFileStoreZustand.getState();
    return Object.keys(state.fileContents).length;
  }, []);

  return <span>{fileStoreSize} 文件</span>;
}

// ===== 导出 =====

export {
  OptimizedFileEditor,
  OptimizedThemePanel,
  OptimizedAgentList,
  ModelStatusIndicator,
  ModelSelector,
  TodoTaskList,
  TaskItem,
  PerformanceMonitor,
};

/**
 * 使用指南：
 * 
 * 1. ✅ DO: 使用细粒度 selector hooks
 *    - useFileContent(path) 而不是 useFileStore().fileContents
 *    - useThemeSettings() 而不是 useSettingsStore().settings.general
 * 
 * 2. ✅ DO: 使用 actions hooks 避免不必要的订阅
 *    - const { updateFile } = useFileActions()
 * 
 * 3. ❌ DON'T: 订阅整个 store 或大对象
 *    - 避免 useFileStoreZustand() (订阅所有状态)
 *    - 避免 useSettingsStore().settings (订阅所有设置)
 * 
 * 4. ✅ DO: 使用 useMemo/useCallback 缓存计算结果
 *    - 特别是过滤、排序等操作
 * 
 * 5. ✅ DO: 对于列表，使用带过滤器的 selector
 *    - useTasks(filterFn) 而不是 useTasks().filter()
 */
