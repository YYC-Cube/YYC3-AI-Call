export const YYC3_FILE_HEADER = "// ⟨YYC³⟩ — YYC³ UI 智能编程库 | 言启象限 · 语枢未来\n"

export function withYyc3Header(content: string, filePath: string): string {
  const ext = filePath.replace(/^.*\./, ".")
  if (![".tsx", ".ts", ".jsx", ".js"].includes(ext)) return content
  if (content.startsWith("// ⟨YYC³⟩")) return content
  return YYC3_FILE_HEADER + content
}
