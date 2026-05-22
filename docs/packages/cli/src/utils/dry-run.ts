import { existsSync, promises as fs } from "fs"
import path from "path"
import { getRegistryBaseColor } from "../registry/api"
import { configWithDefaults } from "../registry/config"
import { resolveRegistryTree } from "../registry/resolver"
import { registryResolvedItemsTreeSchema } from "../schema"
import { isContentSame } from "../utils/compare"
import { isEnvFile } from "../utils/env-helpers"
import { getSupportedFontMarkers } from "../utils/font-markers"
import type { Config } from "../utils/get-config"
import { getProjectInfo } from "../utils/get-project-info"
import { transform } from "../utils/transformers"
import { transformAsChild } from "../utils/transformers/transform-aschild"
import { transformCleanup } from "../utils/transformers/transform-cleanup"
import { transformCssVars as transformCssVarsTransformer } from "../utils/transformers/transform-css-vars"
import { transformFont } from "../utils/transformers/transform-font"
import { transformIcons } from "../utils/transformers/transform-icons"
import { transformImport } from "../utils/transformers/transform-import"
import { transformMenu } from "../utils/transformers/transform-menu"
import { transformRsc } from "../utils/transformers/transform-rsc"
import { transformRtl } from "../utils/transformers/transform-rtl"
import { transformTwPrefixes } from "../utils/transformers/transform-tw-prefix"
import { transformCss } from "../utils/updaters/update-css"
import { transformCssVars } from "../utils/updaters/update-css-vars"
import {
  findCommonRoot,
  resolveFilePath,
} from "../utils/updaters/update-files"
import { massageTreeForFonts } from "../utils/updaters/update-fonts"
import type { z } from "zod"

export type DryRunFile = {
  path: string
  action: "create" | "overwrite" | "skip"
  content: string
  existingContent?: string
  type: string
}

export type DryRunCss = {
  path: string
  content: string
  existingContent?: string
  action: "create" | "update"
  cssVarsCount: number
}

export type DryRunEnvVars = {
  path: string
  variables: Record<string, string>
  action: "create" | "update"
}

export type DryRunFont = {
  name: string
  provider: string
}

export type DryRunResult = {
  files: DryRunFile[]
  dependencies: string[]
  devDependencies: string[]
  css: DryRunCss | null
  envVars: DryRunEnvVars | null
  fonts: DryRunFont[]
  docs: string | null
}

export async function dryRunComponents(
  components: string[],
  config: Config,
  options: {
    overwrite?: boolean
    overwriteCssVars?: boolean
    skipFonts?: boolean
  } = {}
) {
  const result: DryRunResult = {
    files: [],
    dependencies: [],
    devDependencies: [],
    css: null,
    envVars: null,
    fonts: [],
    docs: null,
  }

  if (!components.length) {
    return result
  }

  // Resolve the registry tree (read-only).
  let tree = await resolveRegistryTree(components, configWithDefaults(config))

  if (!tree) {
    throw new Error("Failed to fetch components from registry.")
  }

  // Massage tree for fonts (read-only).
  if (!options.skipFonts) {
    tree = await massageTreeForFonts(tree, config)
  }
  const supportedFontMarkers = getSupportedFontMarkers([tree])

  // Dependencies pass through deduplicated.
  result.dependencies = Array.from(new Set(tree.dependencies ?? []))
  result.devDependencies = Array.from(new Set(tree.devDependencies ?? []))

  // Docs pass through directly.
  result.docs = tree.docs ?? null

  // Process files.
  await processFiles(tree, config, result, options, supportedFontMarkers)

  // Process CSS.
  await processCss(tree, config, result, options)

  // Process env vars.
  processEnvVars(tree, config, result)

  // Process fonts.
  if (!options.skipFonts) {
    processFonts(tree, result)
  }

  return result
}

async function processFiles(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config,
  result: DryRunResult,
  options: { overwrite?: boolean },
  supportedFontMarkers: string[]
) {
  const files = tree.files
  if (!files?.length) {
    return
  }

  const [projectInfo, baseColor] = await Promise.all([
    getProjectInfo(config.resolvedPaths.cwd),
    config.tailwind.baseColor
      ? getRegistryBaseColor(config.tailwind.baseColor)
      : Promise.resolve(undefined),
  ])

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    if (!file.content) {
      continue
    }

    let filePath = resolveFilePath(file, config, {
      isSrcDir: projectInfo?.isSrcDir,
      framework: projectInfo?.framework.name,
      commonRoot: findCommonRoot(
        files.map((f) => f.path),
        file.path
      ),
      fileIndex: index,
    })

    if (!filePath) {
      continue
    }

    if (!config.tsx) {
      filePath = filePath.replace(/\.tsx?$/, (match) =>
        match === ".tsx" ? ".jsx" : ".js"
      )
    }

    const existingFile = existsSync(filePath)
    const relativePath = path.relative(config.resolvedPaths.cwd, filePath)

    // Run transformers (same as update-files.ts).
    const isUniversalItemFile =
      file.type === "registry:file" || file.type === "registry:item"
    const content =
      isEnvFile(filePath) || isUniversalItemFile
        ? file.content
        : await transform(
            {
              filename: file.path,
              raw: file.content,
              config,
              baseColor,
              transformJsx: !config.tsx,
              isRemote: false,
              supportedFontMarkers,
            },
            [
              transformImport,
              transformRsc,
              transformCssVarsTransformer,
              transformTwPrefixes,
              transformIcons,
              transformMenu,
              transformAsChild,
              transformRtl,
              transformFont,
              transformCleanup,
            ]
          )

    // Determine action.
    let action: DryRunFile["action"] = "create"
    let oldContent: string | undefined
    if (existingFile) {
      oldContent = await fs.readFile(filePath, "utf-8")
      if (isContentSame(oldContent, content)) {
        action = "skip"
      } else {
        action = "overwrite"
      }
    }

    result.files.push({
      path: relativePath,
      action,
      content,
      ...(action === "overwrite" && { existingContent: oldContent }),
      type: file.type ?? "registry:ui",
    })
  }
}

async function processCss(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config,
  result: DryRunResult,
  options: { overwriteCssVars?: boolean }
) {
  const hasCss = tree.css && Object.keys(tree.css).length > 0
  const hasCssVars = Object.keys(tree.cssVars ?? {}).length > 0

  if (!config.resolvedPaths.tailwindCss || (!hasCss && !hasCssVars)) {
    return
  }

  const cssFilepath = config.resolvedPaths.tailwindCss
  const existingFile = existsSync(cssFilepath)
  const relativePath = path.relative(config.resolvedPaths.cwd, cssFilepath)

  const existingContent = existingFile
    ? await fs.readFile(cssFilepath, "utf8")
    : ""
  let output = existingContent

  // Apply CSS vars transform.
  if (hasCssVars) {
    output = await transformCssVars(output, tree.cssVars!, config, {
      overwriteCssVars: options.overwriteCssVars,
    })
  }

  // Apply CSS transform.
  if (hasCss) {
    output = await transformCss(output, tree.css!)
  }

  // Count CSS variables across all modes.
  let cssVarsCount = 0
  if (tree.cssVars) {
    for (const vars of Object.values(tree.cssVars)) {
      if (vars) {
        cssVarsCount += Object.keys(vars).length
      }
    }
  }

  result.css = {
    path: relativePath,
    content: output,
    ...(existingFile && { existingContent }),
    action: existingFile ? "update" : "create",
    cssVarsCount,
  }
}

function processEnvVars(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  config: Config,
  result: DryRunResult
) {
  if (!tree.envVars || Object.keys(tree.envVars).length === 0) {
    return
  }

  const envFilePath = path.join(config.resolvedPaths.cwd, ".env.local")
  const existingFile = existsSync(envFilePath)
  const relativePath = path.relative(config.resolvedPaths.cwd, envFilePath)

  result.envVars = {
    path: relativePath,
    variables: tree.envVars,
    action: existingFile ? "update" : "create",
  }
}

function processFonts(
  tree: z.infer<typeof registryResolvedItemsTreeSchema>,
  result: DryRunResult
) {
  if (!tree.fonts?.length) {
    return
  }

  for (const font of tree.fonts) {
    result.fonts.push({
      name: font.font.family,
      provider:
        font.font.provider === "google" ? "Google Fonts" : font.font.provider,
    })
  }
}
