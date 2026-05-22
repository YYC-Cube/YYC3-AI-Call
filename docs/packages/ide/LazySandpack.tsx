/**
 * @file LazySandpack.tsx
 * @description Sandpack 预览懒加载包装器，减少首屏 bundle 大小
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-30
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags lazy-loading,sandpack,performance,code-split
 */

import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// 懒加载 SandpackPreview 组件
const SandpackPreviewLazy = lazy(() => import("./SandpackPreview"));

// Loading 组件
function SandpackLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-[#0a1929]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm text-gray-400">加载预览环境...</p>
      </div>
    </div>
  );
}

/**
 * 懒加载的 Sandpack 预览包装器
 * 使用 Suspense 在加载时显示 loading 状态
 */
export function LazySandpackPreview(props: React.ComponentProps<typeof SandpackPreviewLazy>) {
  return (
    <Suspense fallback={<SandpackLoading />}>
      <SandpackPreviewLazy {...props} />
    </Suspense>
  );
}

export default LazySandpackPreview;
