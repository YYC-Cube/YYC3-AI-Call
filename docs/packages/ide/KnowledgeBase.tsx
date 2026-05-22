/**
 * @file KnowledgeBase.tsx
 * @description 知识库管理面板，支持文档上传、分片索引、搜索过滤、
 *              文档预览、嵌入状态管理
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-08
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags knowledge-base,documents,embeddings,search
 */

import { useState } from "react";
import {
  BookOpen,
  Search,
  Upload,
  FileText,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";
import { PanelHeader } from "./PanelManager";

interface KBDocument {
  id: string;
  name: string;
  type: "pdf" | "md" | "txt" | "docx" | "url";
  size: string;
  chunks: number;
  vectors: number;
  status: "indexed" | "processing" | "error";
  updatedAt: string;
}

interface KBCollection {
  id: string;
  name: string;
  description: string;
  documents: KBDocument[];
  totalVectors: number;
  embeddingModel: string;
}

const COLLECTIONS: KBCollection[] = [
  {
    id: "kb1",
    name: "项目文档库",
    description: "项目相关技术文档、API 文档和设计规范",
    embeddingModel: "自定义 Embedding 模型",
    totalVectors: 24560,
    documents: [
      {
        id: "d1",
        name: "API 接口文档.md",
        type: "md",
        size: "45 KB",
        chunks: 128,
        vectors: 128,
        status: "indexed",
        updatedAt: "2 小时前",
      },
      {
        id: "d2",
        name: "架构设计方案.pdf",
        type: "pdf",
        size: "2.3 MB",
        chunks: 456,
        vectors: 456,
        status: "indexed",
        updatedAt: "昨天",
      },
      {
        id: "d3",
        name: "数据库设计.docx",
        type: "docx",
        size: "890 KB",
        chunks: 234,
        vectors: 234,
        status: "indexed",
        updatedAt: "3 天前",
      },
      {
        id: "d4",
        name: "部署手册.md",
        type: "md",
        size: "67 KB",
        chunks: 189,
        vectors: 189,
        status: "processing",
        updatedAt: "刚刚",
      },
    ],
  },
  {
    id: "kb2",
    name: "代码规范库",
    description: "编码规范、最佳实践和代码审查标准",
    embeddingModel: "自定义 Embedding 模型",
    totalVectors: 8920,
    documents: [
      {
        id: "d5",
        name: "TypeScript 编码规范.md",
        type: "md",
        size: "32 KB",
        chunks: 96,
        vectors: 96,
        status: "indexed",
        updatedAt: "1 周前",
      },
      {
        id: "d6",
        name: "React 最佳实践.md",
        type: "md",
        size: "28 KB",
        chunks: 84,
        vectors: 84,
        status: "indexed",
        updatedAt: "1 周前",
      },
      {
        id: "d7",
        name: "Git 工作流规范.txt",
        type: "txt",
        size: "12 KB",
        chunks: 36,
        vectors: 36,
        status: "indexed",
        updatedAt: "2 周前",
      },
    ],
  },
];

export default function KnowledgeBase({ nodeId }: { nodeId: string }) {
  const [collections, setCollections] = useState(COLLECTIONS);
  const [expandedKB, setExpandedKB] = useState<Set<string>>(new Set(["kb1"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { doc: string; chunk: string; score: number }[]
  >([]);
  const [showSearch, setShowSearch] = useState(false);

  const toggleKB = (id: string) => {
    setExpandedKB((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setSearchResults([
      {
        doc: "API 接口文档.md",
        chunk: `...用户认证接口使用 JWT 令牌，所有 API 请求需要在 Header 中携带 Authorization: Bearer <token>...`,
        score: 0.94,
      },
      {
        doc: "架构设计方案.pdf",
        chunk: `...微服务架构采用分层设计，包含网关层、服务层、数据层，各层通过 gRPC 进行通信...`,
        score: 0.87,
      },
      {
        doc: "TypeScript 编码规范.md",
        chunk: `...接口定义使用 PascalCase，函数参数使用 camelCase，常量使用 UPPER_SNAKE_CASE...`,
        score: 0.82,
      },
    ]);
    setShowSearch(true);
  };

  const totalDocs = collections.reduce((sum, c) => sum + c.documents.length, 0);
  const totalVectors = collections.reduce((sum, c) => sum + c.totalVectors, 0);

  return (
    <div className="size-full flex flex-col bg-[var(--ide-bg)]">
      <PanelHeader
        nodeId={nodeId}
        panelId="knowledge"
        title="知识库"
        icon={<BookOpen className="w-3 h-3 text-purple-400/70" />}
      >
        <div className="flex items-center gap-0.5 ml-2">
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="上传文档"
          >
            <Upload className="w-3 h-3 text-slate-600" />
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/5"
            title="刷新索引"
          >
            <RefreshCw className="w-3 h-3 text-slate-600" />
          </button>
        </div>
      </PanelHeader>

      {/* Stats */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-dim)] grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-[0.82rem] text-slate-300">
            {collections.length}
          </div>
          <div className="text-[0.52rem] text-slate-600">知识库</div>
        </div>
        <div className="text-center">
          <div className="text-[0.82rem] text-slate-300">{totalDocs}</div>
          <div className="text-[0.52rem] text-slate-600">文档</div>
        </div>
        <div className="text-center">
          <div className="text-[0.82rem] text-sky-400">
            {totalVectors.toLocaleString()}
          </div>
          <div className="text-[0.52rem] text-slate-600">向量</div>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--ide-border-faint)]">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1.5 bg-[var(--ide-bg-elevated)] border border-[var(--ide-border-mid)] rounded px-2 py-1">
            <Search className="w-3 h-3 text-slate-600" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="语义搜索知识库..."
              className="flex-1 bg-transparent border-0 outline-none text-[0.72rem] text-slate-300 placeholder:text-slate-700"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-[0.62rem] hover:bg-purple-600/50 transition-colors"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Search Results */}
      {showSearch && searchResults.length > 0 && (
        <div className="flex-shrink-0 max-h-[30%] overflow-y-auto border-b border-[var(--ide-border-faint)]">
          <div className="px-3 py-1 flex items-center justify-between">
            <span className="text-[0.62rem] text-purple-400">
              搜索结果 ({searchResults.length})
            </span>
            <button
              onClick={() => setShowSearch(false)}
              className="text-[0.55rem] text-slate-600 hover:text-slate-400"
            >
              关闭
            </button>
          </div>
          {searchResults.map((r, i) => (
            <div
              key={i}
              className="px-3 py-1.5 border-t border-[var(--ide-border-subtle)] hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <FileText className="w-2.5 h-2.5 text-purple-400" />
                <span className="text-[0.62rem] text-slate-400">{r.doc}</span>
                <span className="text-[0.52rem] text-emerald-400 ml-auto">
                  {(r.score * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[0.6rem] text-slate-500 line-clamp-2">
                {r.chunk}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Collections */}
      <div className="flex-1 overflow-y-auto">
        {collections.map((kb) => (
          <div
            key={kb.id}
            className="border-b border-[var(--ide-border-subtle)]"
          >
            <button
              onClick={() => toggleKB(kb.id)}
              className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-white/3 transition-colors"
            >
              {expandedKB.has(kb.id) ? (
                <ChevronDown className="w-3 h-3 text-slate-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
              <Database className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[0.72rem] text-slate-300 flex-1 text-left">
                {kb.name}
              </span>
              <span className="text-[0.52rem] text-slate-600">
                {kb.documents.length} 文档
              </span>
            </button>
            {expandedKB.has(kb.id) && (
              <div className="pl-3">
                <div className="px-3 py-1 text-[0.55rem] text-slate-600 border-b border-dashed border-[var(--ide-border-subtle)]">
                  {kb.description} | 模型: {kb.embeddingModel}
                </div>
                {kb.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 pl-6 hover:bg-white/3 transition-colors"
                  >
                    <FileText
                      className={`w-3 h-3 flex-shrink-0 ${doc.type === "pdf" ? "text-red-400" : doc.type === "md" ? "text-blue-400" : "text-slate-500"}`}
                    />
                    <span className="text-[0.65rem] text-slate-400 flex-1 truncate">
                      {doc.name}
                    </span>
                    <span className="text-[0.5rem] text-slate-700">
                      {doc.size}
                    </span>
                    {doc.status === "indexed" && (
                      <Check className="w-2.5 h-2.5 text-emerald-500" />
                    )}
                    {doc.status === "processing" && (
                      <div className="w-2.5 h-2.5 border border-sky-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    <span className="text-[0.5rem] text-slate-700">
                      {doc.vectors} 向量
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
