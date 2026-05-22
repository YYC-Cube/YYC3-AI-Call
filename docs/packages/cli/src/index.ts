#!/usr/bin/env node
import { Command } from "commander"
import { add } from "./commands/add"
import { apply } from "./commands/apply"
import { build } from "./commands/build"
import { diff } from "./commands/diff"
import { docs } from "./commands/docs"
import { info } from "./commands/info"
import { init } from "./commands/init"
import { mcp } from "./commands/mcp"
import { migrate } from "./commands/migrate"
import { registry } from "./commands/registry"
import { search } from "./commands/search"
import { view } from "./commands/view"

import packageJson from "../package.json"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

async function main() {
  const program = new Command()
    .name("yyc3")
    .description("YYC³ UI 智能编程库 — 言启象限 | 语枢未来")
    .version(
      packageJson.version || "1.0.0",
      "-v, --version",
      "display the version number"
    )

  program
    .addCommand(init)
    .addCommand(apply)
    .addCommand(add)
    .addCommand(diff)
    .addCommand(docs)
    .addCommand(view)
    .addCommand(search)
    .addCommand(migrate)
    .addCommand(info)
    .addCommand(build)
    .addCommand(mcp)
    .addCommand(registry)

  return program
}

export const program = await main()

export * from "./registry/api"
