import { detect } from "@antfu/ni"

export async function getPackageManager(
  targetDir: string,
  { withFallback }: { withFallback?: boolean } = {
    withFallback: false,
  }
): Promise<"yarn" | "pnpm" | "bun" | "npm" | "deno"> {
  const packageManager = await detect({ programmatic: true, cwd: targetDir })

  if (packageManager === "yarn@berry") return "yarn"
  if (packageManager === "pnpm@6") return "pnpm"
  if (packageManager === "bun") return "bun"
  if (packageManager === "deno") return "deno"
  if (!withFallback) {
    // @antfu/ni 可能返回扩展的包管理器标识（pnpm-rush 等），
    // 统一收敛到本工具支持的五种之一
    switch (packageManager?.split("@")[0]) {
      case "yarn":
        return "yarn"
      case "pnpm":
        return "pnpm"
      case "bun":
        return "bun"
      case "deno":
        return "deno"
      case "npm":
        return "npm"
      default:
        return "npm"
    }
  }

  // Fallback to user agent if not detected.
  const userAgent = process.env.npm_config_user_agent || ""

  if (userAgent.startsWith("yarn")) {
    return "yarn"
  }

  if (userAgent.startsWith("pnpm")) {
    return "pnpm"
  }

  if (userAgent.startsWith("bun")) {
    return "bun"
  }

  return "npm"
}

export async function getPackageRunner(cwd: string) {
  const packageManager = await getPackageManager(cwd)

  if (packageManager === "pnpm") return "pnpm dlx"

  if (packageManager === "bun") return "bunx"

  return "npx"
}
