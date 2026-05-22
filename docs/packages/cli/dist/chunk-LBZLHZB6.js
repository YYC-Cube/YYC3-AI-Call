import { Command } from 'commander';
import * as path4 from 'path';
import path4__default, { join, basename } from 'path';
import { promises, existsSync, statSync } from 'fs';
import { cyan, green, yellow, red, dim, bold } from 'kleur/colors';
import fg3 from 'fast-glob';
import fs11 from 'fs-extra';
import z18, { z } from 'zod';
import { loadConfig, createMatchPath } from 'tsconfig-paths';
import os, { tmpdir, homedir } from 'os';
import prompts5 from 'prompts';
import { Project, ScriptKind, SyntaxKind, VariableDeclarationKind, QuoteKind } from 'ts-morph';
import ora from 'ora';
import { transformFromAstSync } from '@babel/core';
import { parse } from '@babel/parser';
import transformTypescript from '@babel/plugin-transform-typescript';
import * as recast from 'recast';
import { twMerge } from 'tailwind-merge';
import { cosmiconfig } from 'cosmiconfig';
import deepmerge3 from 'deepmerge';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch, { Headers } from 'node-fetch';
import { randomBytes, createHash } from 'crypto';
import objectToString from 'stringify-object';
import open from 'open';
import dedent6 from 'dedent';
import { execa } from 'execa';
import postcss2 from 'postcss';
import AtRule from 'postcss/lib/at-rule';
import { detect } from '@antfu/ni';
import { diffLines, structuredPatch, diffWords } from 'diff';
import * as fs25 from 'fs/promises';
import fs25__default from 'fs/promises';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fuzzysort from 'fuzzysort';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

// src/index.ts

// src/utils/errors.ts
var MISSING_DIR_OR_EMPTY_PROJECT = "1";
var MISSING_CONFIG = "3";
var TAILWIND_NOT_CONFIGURED = "5";
var IMPORT_ALIAS_MISSING = "6";
var UNSUPPORTED_FRAMEWORK = "7";
var BUILD_MISSING_REGISTRY_FILE = "13";
var highlighter = {
  error: red,
  warn: yellow,
  info: cyan,
  success: green
};

// src/utils/logger.ts
var logger = {
  error(...args) {
    console.log(highlighter.error(args.join(" ")));
  },
  warn(...args) {
    console.log(highlighter.warn(args.join(" ")));
  },
  info(...args) {
    console.log(highlighter.info(args.join(" ")));
  },
  success(...args) {
    console.log(highlighter.success(args.join(" ")));
  },
  log(...args) {
    console.log(args.join(" "));
  },
  break() {
    console.log("");
  }
};
var FRAMEWORK_CONFIG_FILES = [
  "next.config.*",
  "vite.config.*",
  "astro.config.*",
  "remix.config.*",
  "nuxt.config.*",
  "svelte.config.*",
  "gatsby-config.*",
  "angular.json"
];
async function isMonorepoRoot(cwd) {
  if (fs11.existsSync(path4__default.resolve(cwd, "pnpm-workspace.yaml"))) {
    return true;
  }
  const packageJsonPath = path4__default.resolve(cwd, "package.json");
  if (fs11.existsSync(packageJsonPath)) {
    try {
      const packageJson = await fs11.readJson(packageJsonPath);
      if (packageJson.workspaces) {
        return true;
      }
    } catch {
    }
  }
  if (fs11.existsSync(path4__default.resolve(cwd, "lerna.json"))) {
    return true;
  }
  if (fs11.existsSync(path4__default.resolve(cwd, "nx.json"))) {
    return true;
  }
  return false;
}
async function getMonorepoTargets(cwd) {
  const patterns = await getWorkspacePatterns(cwd);
  if (!patterns.length) {
    return [];
  }
  const dirs = await fg3(patterns, {
    cwd,
    onlyDirectories: true,
    ignore: ["**/node_modules/**"]
  });
  const targets = [];
  for (const dir of dirs) {
    const fullPath = path4__default.resolve(cwd, dir);
    if (!fs11.existsSync(path4__default.resolve(fullPath, "package.json"))) {
      continue;
    }
    const hasComponentsJson = fs11.existsSync(
      path4__default.resolve(fullPath, "components.json")
    );
    const hasFrameworkConfig = FRAMEWORK_CONFIG_FILES.some((pattern) => {
      const matches = fg3.sync(pattern, {
        cwd: fullPath,
        dot: true
      });
      return matches.length > 0;
    });
    if (hasComponentsJson || hasFrameworkConfig) {
      targets.push({
        name: dir,
        hasConfig: hasComponentsJson
      });
    }
  }
  return targets;
}
function formatMonorepoMessage(command, targets, options) {
  const cwdFlag = options?.cwdFlag ?? "-c";
  logger.break();
  logger.log(
    `It looks like you are running ${highlighter.info(
      command
    )} from a monorepo root.`
  );
  logger.log(
    `To use shadcn in a specific workspace, use the ${highlighter.info(
      cwdFlag
    )} flag:`
  );
  logger.break();
  for (const target of targets) {
    logger.log(`  shadcn ${command} ${cwdFlag} ${target.name}`);
  }
  logger.break();
}
async function getWorkspacePatterns(cwd) {
  const patterns = [];
  const pnpmWorkspacePath = path4__default.resolve(cwd, "pnpm-workspace.yaml");
  if (fs11.existsSync(pnpmWorkspacePath)) {
    const content = await fs11.readFile(pnpmWorkspacePath, "utf8");
    const matches = Array.from(
      content.matchAll(/^\s*-\s*["']?([^"'\n#]+)["']?\s*$/gm)
    );
    for (const match of matches) {
      patterns.push(match[1].trim());
    }
  }
  const packageJsonPath = path4__default.resolve(cwd, "package.json");
  if (fs11.existsSync(packageJsonPath)) {
    try {
      const packageJson = await fs11.readJson(packageJsonPath);
      const workspaces = Array.isArray(packageJson.workspaces) ? packageJson.workspaces : packageJson.workspaces?.packages;
      if (Array.isArray(workspaces)) {
        patterns.push(...workspaces.filter((w) => !w.startsWith("!")));
      }
    } catch {
    }
  }
  return Array.from(new Set(patterns));
}

// src/registry/constants.ts
var REGISTRY_URL = process.env.REGISTRY_URL ?? "https://ui.shadcn.com/r";
var SHADCN_URL = REGISTRY_URL.replace(/\/r\/?$/, "");
var YYC3_REGISTRY_URL = process.env.YYC3_REGISTRY_URL ?? "https://yyc3.shadcn.com/r";
YYC3_REGISTRY_URL.replace(/\/r\/?$/, "");
var FALLBACK_STYLE = "new-york-v4";
var BASE_COLORS = [
  {
    name: "neutral",
    label: "Neutral"
  },
  {
    name: "zinc",
    label: "Zinc"
  },
  {
    name: "stone",
    label: "Stone"
  },
  {
    name: "mauve",
    label: "Mauve"
  },
  {
    name: "olive",
    label: "Olive"
  },
  {
    name: "mist",
    label: "Mist"
  },
  {
    name: "taupe",
    label: "Taupe"
  }
];
var BUILTIN_REGISTRIES = {
  "@shadcn": `${REGISTRY_URL}/styles/{style}/{name}.json`,
  "@yyc3": `${YYC3_REGISTRY_URL}/{name}.json`
};
var DEPRECATED_COMPONENTS = [
  {
    name: "toast",
    deprecatedBy: "sonner",
    message: "The toast component is deprecated. Use the sonner component instead."
  },
  {
    name: "toaster",
    deprecatedBy: "sonner",
    message: "The toaster component is deprecated. Use the sonner component instead."
  }
];

// src/registry/env.ts
function expandEnvVars(value) {
  return value.replace(/\${(\w+)}/g, (_match, key) => process.env[key] || "");
}
function extractEnvVars(value) {
  const vars = [];
  const regex = /\${(\w+)}/g;
  let match;
  while ((match = regex.exec(value)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}
var RegistryErrorCode = {
  NOT_FOUND: "NOT_FOUND",
  GONE: "GONE",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  FETCH_ERROR: "FETCH_ERROR",
  // Configuration errors
  NOT_CONFIGURED: "NOT_CONFIGURED",
  INVALID_CONFIG: "INVALID_CONFIG",
  MISSING_ENV_VARS: "MISSING_ENV_VARS",
  // File system errors
  LOCAL_FILE_ERROR: "LOCAL_FILE_ERROR",
  // Parsing errors
  PARSE_ERROR: "PARSE_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  // Generic errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
};
var RegistryError = class extends Error {
  code;
  statusCode;
  context;
  suggestion;
  timestamp;
  cause;
  constructor(message, options = {}) {
    super(message);
    this.name = "RegistryError";
    this.code = options.code || RegistryErrorCode.UNKNOWN_ERROR;
    this.statusCode = options.statusCode;
    this.cause = options.cause;
    this.context = options.context;
    this.suggestion = options.suggestion;
    this.timestamp = /* @__PURE__ */ new Date();
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      suggestion: this.suggestion,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
};
var RegistryNotFoundError = class extends RegistryError {
  constructor(url, cause) {
    const message = `The item at ${url} was not found. It may not exist at the registry.`;
    super(message, {
      code: RegistryErrorCode.NOT_FOUND,
      statusCode: 404,
      cause,
      context: { url },
      suggestion: "Check if the item name is correct and the registry URL is accessible."
    });
    this.url = url;
    this.name = "RegistryNotFoundError";
  }
  url;
};
var RegistryGoneError = class extends RegistryError {
  constructor(url, cause) {
    const message = `The item at ${url} is no longer available. It may have been removed or expired.`;
    super(message, {
      code: RegistryErrorCode.GONE,
      statusCode: 410,
      cause,
      context: { url },
      suggestion: "This resource was previously available but has been permanently removed. Check if a newer version exists or contact the registry maintainer."
    });
    this.url = url;
    this.name = "RegistryGoneError";
  }
  url;
};
var RegistryUnauthorizedError = class extends RegistryError {
  constructor(url, cause) {
    const message = `You are not authorized to access the item at ${url}. If this is a remote registry, you may need to authenticate.`;
    super(message, {
      code: RegistryErrorCode.UNAUTHORIZED,
      statusCode: 401,
      cause,
      context: { url },
      suggestion: "Check your authentication credentials and environment variables."
    });
    this.url = url;
    this.name = "RegistryUnauthorizedError";
  }
  url;
};
var RegistryForbiddenError = class extends RegistryError {
  constructor(url, cause) {
    const message = `You are not authorized to access the item at ${url}. If this is a remote registry, you may need to authenticate.`;
    super(message, {
      code: RegistryErrorCode.FORBIDDEN,
      statusCode: 403,
      cause,
      context: { url },
      suggestion: "Check your authentication credentials and environment variables."
    });
    this.url = url;
    this.name = "RegistryForbiddenError";
  }
  url;
};
var RegistryFetchError = class extends RegistryError {
  constructor(url, statusCode, responseBody, cause) {
    const baseMessage = statusCode ? `Failed to fetch from registry (${statusCode}): ${url}` : `Failed to fetch from registry: ${url}`;
    const message = typeof cause === "string" && cause ? `${baseMessage} - ${cause}` : baseMessage;
    let suggestion = "Check your network connection and try again.";
    if (statusCode === 404) {
      suggestion = "The requested resource was not found. Check the URL or item name.";
    } else if (statusCode === 500) {
      suggestion = "The registry server encountered an error. Try again later.";
    } else if (statusCode && statusCode >= 400 && statusCode < 500) {
      suggestion = "There was a client error. Check your request parameters.";
    }
    super(message, {
      code: RegistryErrorCode.FETCH_ERROR,
      statusCode,
      cause,
      context: { url, responseBody },
      suggestion
    });
    this.url = url;
    this.responseBody = responseBody;
    this.name = "RegistryFetchError";
  }
  url;
  responseBody;
};
var RegistryNotConfiguredError = class extends RegistryError {
  constructor(registryName) {
    const message = registryName ? `Unknown registry "${registryName}". Make sure it is defined in components.json as follows:
{
  "registries": {
    "${registryName}": "[URL_TO_REGISTRY]"
  }
}` : `Unknown registry. Make sure it is defined in components.json under "registries".`;
    super(message, {
      code: RegistryErrorCode.NOT_CONFIGURED,
      context: { registryName },
      suggestion: "Add the registry configuration to your components.json file. Consult the registry documentation for the correct format."
    });
    this.registryName = registryName;
    this.name = "RegistryNotConfiguredError";
  }
  registryName;
};
var RegistryLocalFileError = class extends RegistryError {
  constructor(filePath, cause) {
    super(`Failed to read local registry file: ${filePath}`, {
      code: RegistryErrorCode.LOCAL_FILE_ERROR,
      cause,
      context: { filePath },
      suggestion: "Check if the file exists and you have read permissions."
    });
    this.filePath = filePath;
    this.name = "RegistryLocalFileError";
  }
  filePath;
};
var RegistryParseError = class extends RegistryError {
  constructor(item, parseError) {
    let message = `Failed to parse registry item: ${item}`;
    if (parseError instanceof z.ZodError) {
      message = `Failed to parse registry item: ${item}
${parseError.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")}`;
    }
    super(message, {
      code: RegistryErrorCode.PARSE_ERROR,
      cause: parseError,
      context: { item },
      suggestion: `The registry item may be corrupted or have an invalid format. Please make sure it returns a valid JSON object. See ${SHADCN_URL}/schema/registry-item.json.`
    });
    this.item = item;
    this.parseError = parseError;
    this.name = "RegistryParseError";
  }
  item;
  parseError;
};
var RegistryMissingEnvironmentVariablesError = class extends RegistryError {
  constructor(registryName, missingVars) {
    const message = `Registry "${registryName}" requires the following environment variables:

` + missingVars.map((v) => `  \u2022 ${v}`).join("\n");
    super(message, {
      code: RegistryErrorCode.MISSING_ENV_VARS,
      context: { registryName, missingVars },
      suggestion: "Set the required environment variables to your .env or .env.local file."
    });
    this.registryName = registryName;
    this.missingVars = missingVars;
    this.name = "RegistryMissingEnvironmentVariablesError";
  }
  registryName;
  missingVars;
};
var RegistryInvalidNamespaceError = class extends RegistryError {
  constructor(name) {
    const message = `Invalid registry namespace: "${name}". Registry names must start with @ (e.g., @shadcn, @v0).`;
    super(message, {
      code: RegistryErrorCode.VALIDATION_ERROR,
      context: { name },
      suggestion: "Use a valid registry name starting with @ or provide a direct URL to the registry."
    });
    this.name = name;
    this.name = "RegistryInvalidNamespaceError";
  }
  name;
};
var ConfigParseError = class extends RegistryError {
  constructor(cwd, parseError) {
    let message = `Invalid components.json configuration in ${cwd}.`;
    if (parseError instanceof z.ZodError) {
      message = `Invalid components.json configuration in ${cwd}:
${parseError.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")}`;
    }
    super(message, {
      code: RegistryErrorCode.INVALID_CONFIG,
      cause: parseError,
      context: { cwd },
      suggestion: "Check your components.json file for syntax errors or invalid configuration. Run 'npx shadcn@latest init' to regenerate a valid configuration."
    });
    this.cwd = cwd;
    this.name = "ConfigParseError";
  }
  cwd;
};
var RegistriesIndexParseError = class extends RegistryError {
  parseError;
  constructor(parseError) {
    let message = "Failed to parse registries index";
    if (parseError instanceof z.ZodError) {
      const invalidNamespaces = parseError.errors.filter((e) => e.path.length > 0).map((e) => `"${e.path[0]}"`).filter((v, i, arr) => arr.indexOf(v) === i);
      if (invalidNamespaces.length > 0) {
        message = `Failed to parse registries index. Invalid registry namespace(s): ${invalidNamespaces.join(
          ", "
        )}
${parseError.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")}`;
      } else {
        message = `Failed to parse registries index:
${parseError.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n")}`;
      }
    }
    super(message, {
      code: RegistryErrorCode.PARSE_ERROR,
      cause: parseError,
      context: { parseError },
      suggestion: "The registries index may be corrupted or have invalid registry namespace format. Registry names must start with @ (e.g., @shadcn, @example)."
    });
    this.parseError = parseError;
    this.name = "RegistriesIndexParseError";
  }
};

// src/registry/parser.ts
var REGISTRY_PATTERN = /^(@[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?)\/(.+)$/;
function parseRegistryAndItemFromString(name) {
  if (!name.startsWith("@")) {
    return {
      registry: null,
      item: name
    };
  }
  const match = name.match(REGISTRY_PATTERN);
  if (match) {
    return {
      registry: match[1],
      item: match[2]
    };
  }
  return {
    registry: null,
    item: name
  };
}
var registryConfigItemSchema = z.union([
  // Simple string format: "https://example.com/{name}.json"
  z.string().refine((s) => s.includes("{name}"), {
    message: "Registry URL must include {name} placeholder"
  }),
  // Advanced object format with auth options
  z.object({
    url: z.string().refine((s) => s.includes("{name}"), {
      message: "Registry URL must include {name} placeholder"
    }),
    params: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional()
  })
]);
var registryConfigSchema = z.record(
  z.string().refine((key) => key.startsWith("@"), {
    message: "Registry names must start with @ (e.g., @v0, @acme)"
  }),
  registryConfigItemSchema
);
var rawConfigSchema = z.object({
  $schema: z.string().optional(),
  style: z.string(),
  rsc: z.coerce.boolean().default(false),
  tsx: z.coerce.boolean().default(true),
  tailwind: z.object({
    config: z.string().optional(),
    css: z.string(),
    baseColor: z.string(),
    cssVariables: z.boolean().default(true),
    prefix: z.string().default("").optional()
  }),
  iconLibrary: z.string().optional(),
  rtl: z.coerce.boolean().default(false).optional(),
  menuColor: z.enum([
    "default",
    "inverted",
    "default-translucent",
    "inverted-translucent"
  ]).default("default").optional(),
  menuAccent: z.enum(["subtle", "bold"]).default("subtle").optional(),
  aliases: z.object({
    components: z.string(),
    utils: z.string(),
    ui: z.string().optional(),
    lib: z.string().optional(),
    hooks: z.string().optional()
  }),
  registries: registryConfigSchema.optional()
}).strict();
var configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    tailwindConfig: z.string(),
    tailwindCss: z.string(),
    utils: z.string(),
    components: z.string(),
    lib: z.string(),
    hooks: z.string(),
    ui: z.string()
  })
});
var workspaceConfigSchema = z.record(configSchema);
var registryItemTypeSchema = z.enum([
  "registry:lib",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:hook",
  "registry:page",
  "registry:file",
  "registry:theme",
  "registry:style",
  "registry:item",
  "registry:base",
  "registry:font",
  // Internal use only.
  "registry:example",
  "registry:internal"
]);
var registryItemFileSchema = z.discriminatedUnion("type", [
  // Target is required for registry:file and registry:page
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: z.enum(["registry:file", "registry:page"]),
    target: z.string()
  }),
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: registryItemTypeSchema.exclude(["registry:file", "registry:page"]),
    target: z.string().optional()
  })
]);
var registryItemTailwindSchema = z.object({
  config: z.object({
    content: z.array(z.string()).optional(),
    theme: z.record(z.string(), z.any()).optional(),
    plugins: z.array(z.string()).optional()
  }).optional()
});
var registryItemCssVarsSchema = z.object({
  theme: z.record(z.string(), z.string()).optional(),
  light: z.record(z.string(), z.string()).optional(),
  dark: z.record(z.string(), z.string()).optional()
});
var cssValueSchema = z.lazy(
  () => z.union([
    z.string(),
    z.array(z.union([z.string(), z.record(z.string(), z.string())])),
    z.record(z.string(), cssValueSchema)
  ])
);
var registryItemCssSchema = z.record(z.string(), cssValueSchema);
var registryItemEnvVarsSchema = z.record(z.string(), z.string());
var registryItemFontSchema = z.object({
  family: z.string(),
  provider: z.literal("google"),
  import: z.string(),
  variable: z.string(),
  weight: z.array(z.string()).optional(),
  subsets: z.array(z.string()).optional(),
  selector: z.string().optional(),
  dependency: z.string().optional()
});
var registryItemCommonSchema = z.object({
  $schema: z.string().optional(),
  extends: z.string().optional(),
  name: z.string(),
  title: z.string().optional(),
  author: z.string().min(2).optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryItemFileSchema).optional(),
  tailwind: registryItemTailwindSchema.optional(),
  cssVars: registryItemCssVarsSchema.optional(),
  css: registryItemCssSchema.optional(),
  envVars: registryItemEnvVarsSchema.optional(),
  meta: z.record(z.string(), z.any()).optional(),
  docs: z.string().optional(),
  categories: z.array(z.string()).optional()
});
var registryItemSchema = z.discriminatedUnion("type", [
  registryItemCommonSchema.extend({
    type: z.literal("registry:base"),
    config: rawConfigSchema.deepPartial().optional()
  }),
  registryItemCommonSchema.extend({
    type: z.literal("registry:font"),
    font: registryItemFontSchema
  }),
  registryItemCommonSchema.extend({
    type: registryItemTypeSchema.exclude(["registry:base", "registry:font"])
  })
]);
var registrySchema = z.object({
  name: z.string(),
  homepage: z.string(),
  items: z.array(registryItemSchema)
});
var registryIndexSchema = z.array(registryItemSchema);
var stylesSchema = z.array(
  z.object({
    name: z.string(),
    label: z.string()
  })
);
var iconsSchema = z.record(
  z.string(),
  z.record(z.string(), z.string())
);
var registryBaseColorSchema = z.object({
  inlineColors: z.object({
    light: z.record(z.string(), z.string()),
    dark: z.record(z.string(), z.string())
  }),
  cssVars: registryItemCssVarsSchema,
  cssVarsV4: registryItemCssVarsSchema.optional(),
  inlineColorsTemplate: z.string(),
  cssVarsTemplate: z.string()
});
var registryResolvedItemsTreeSchema = registryItemCommonSchema.pick({
  dependencies: true,
  devDependencies: true,
  files: true,
  tailwind: true,
  cssVars: true,
  css: true,
  envVars: true,
  docs: true
}).extend({
  fonts: z.array(
    registryItemCommonSchema.extend({
      type: z.literal("registry:font"),
      font: registryItemFontSchema
    })
  ).optional()
});
var searchResultItemSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  registry: z.string(),
  addCommandArgument: z.string()
});
var searchResultsSchema = z.object({
  pagination: z.object({
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
    hasMore: z.boolean()
  }),
  items: z.array(searchResultItemSchema)
});
z.record(
  z.string().regex(/^@[a-zA-Z0-9][a-zA-Z0-9-_]*$/),
  z.string()
);
var registriesSchema = z.array(
  z.object({
    name: z.string(),
    homepage: z.string().optional(),
    url: z.string(),
    description: z.string().optional()
  })
);
var presetSchema = z.object({
  name: z.string(),
  title: z.string(),
  description: z.string(),
  base: z.string(),
  style: z.string(),
  baseColor: z.string(),
  theme: z.string(),
  iconLibrary: z.string(),
  font: z.string(),
  rtl: z.coerce.boolean().default(false),
  menuAccent: z.enum(["subtle", "bold"]),
  menuColor: z.enum([
    "default",
    "inverted",
    "default-translucent",
    "inverted-translucent"
  ]),
  radius: z.string()
});
var configJsonSchema = z.object({
  presets: z.array(presetSchema)
});
async function resolveImport(importPath, config) {
  return createMatchPath(config.absoluteBaseUrl, config.paths)(
    importPath,
    void 0,
    () => true,
    [".ts", ".tsx", ".jsx", ".js", ".css"]
  );
}

// src/utils/brand-header.ts
var YYC3_FILE_HEADER = "// \u27E8YYC\xB3\u27E9 \u2014 YYC\xB3 UI \u667A\u80FD\u7F16\u7A0B\u5E93 | \u8A00\u542F\u8C61\u9650 \xB7 \u8BED\u67A2\u672A\u6765\n";
function withYyc3Header(content, filePath) {
  const ext = filePath.replace(/^.*\./, ".");
  if (![".tsx", ".ts", ".jsx", ".js"].includes(ext)) return content;
  if (content.startsWith("// \u27E8YYC\xB3\u27E9")) return content;
  return YYC3_FILE_HEADER + content;
}

// src/utils/compare.ts
function isContentSame(existingContent, newContent, options = {}) {
  const { ignoreImports = false } = options;
  const normalizedExisting = existingContent.replace(/\r\n/g, "\n").trim();
  const normalizedNew = newContent.replace(/\r\n/g, "\n").trim();
  if (normalizedExisting === normalizedNew) {
    return true;
  }
  if (!ignoreImports) {
    return false;
  }
  const importRegex = /^(import\s+(?:type\s+)?(?:\*\s+as\s+\w+|\{[^}]*\}|\w+)?(?:\s*,\s*(?:\{[^}]*\}|\w+))?\s+from\s+["'])([^"']+)(["'])/gm;
  const normalizeImports = (content) => {
    return content.replace(
      importRegex,
      (_match, prefix, importPath, suffix) => {
        if (importPath.startsWith(".")) {
          return `${prefix}${importPath}${suffix}`;
        }
        const parts = importPath.split("/");
        const lastPart = parts[parts.length - 1];
        return `${prefix}@normalized/${lastPart}${suffix}`;
      }
    );
  };
  const existingNormalized = normalizeImports(normalizedExisting);
  const newNormalized = normalizeImports(normalizedNew);
  return existingNormalized === newNormalized;
}
function isEnvFile(filePath) {
  const fileName = path4__default.basename(filePath);
  return /^\.env(\.|$)/.test(fileName);
}
function findExistingEnvFile(targetDir) {
  const variants = [
    ".env.local",
    ".env",
    ".env.development.local",
    ".env.development"
  ];
  for (const variant of variants) {
    const filePath = path4__default.join(targetDir, variant);
    if (existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}
function parseEnvContent(content) {
  const lines = content.split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }
    const key = trimmed.substring(0, equalIndex).trim();
    const value = trimmed.substring(equalIndex + 1).trim();
    if (key) {
      env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return env;
}
function getNewEnvKeys(existingContent, newContent) {
  const existingEnv = parseEnvContent(existingContent);
  const newEnv = parseEnvContent(newContent);
  const newKeys = [];
  for (const key of Object.keys(newEnv)) {
    if (!(key in existingEnv)) {
      newKeys.push(key);
    }
  }
  return newKeys;
}
function mergeEnvContent(existingContent, newContent) {
  const existingEnv = parseEnvContent(existingContent);
  const newEnv = parseEnvContent(newContent);
  let result = existingContent.trimEnd();
  if (result && !result.endsWith("\n")) {
    result += "\n";
  }
  const newKeys = [];
  for (const [key, value] of Object.entries(newEnv)) {
    if (!(key in existingEnv)) {
      newKeys.push(`${key}=${value}`);
    }
  }
  if (newKeys.length > 0) {
    if (result) {
      result += "\n";
    }
    result += newKeys.join("\n");
    return result + "\n";
  }
  if (result && !result.endsWith("\n")) {
    return result + "\n";
  }
  return result;
}
function spinner(text, options) {
  return ora({
    text,
    isSilent: options?.silent
  });
}
var transformCssVars = async ({
  sourceFile,
  config,
  baseColor
}) => {
  if (config.tailwind?.cssVariables || !baseColor?.inlineColors) {
    return sourceFile;
  }
  sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral).forEach((node) => {
    const raw = node.getLiteralText();
    const mapped = applyColorMapping(raw, baseColor.inlineColors).trim();
    if (mapped !== raw) {
      node.setLiteralValue(mapped);
    }
  });
  return sourceFile;
};
function splitClassName(className) {
  if (!className.includes("/") && !className.includes(":")) {
    return [null, className, null];
  }
  let lastColonIndex = -1;
  let bracketDepth = 0;
  for (let i = className.length - 1; i >= 0; i--) {
    const char = className[i];
    if (char === "]") bracketDepth++;
    else if (char === "[") bracketDepth--;
    else if (char === ":" && bracketDepth === 0) {
      lastColonIndex = i;
      break;
    }
  }
  let variant = null;
  let nameWithAlpha;
  if (lastColonIndex === -1) {
    nameWithAlpha = className;
  } else {
    variant = className.slice(0, lastColonIndex);
    nameWithAlpha = className.slice(lastColonIndex + 1);
  }
  const slashIndex = nameWithAlpha.lastIndexOf("/");
  if (slashIndex === -1) {
    return [variant, nameWithAlpha, null];
  }
  const name = nameWithAlpha.slice(0, slashIndex);
  const alpha = nameWithAlpha.slice(slashIndex + 1);
  return [variant, name, alpha];
}
var PREFIXES = ["bg-", "text-", "border-", "ring-offset-", "ring-"];
function applyColorMapping(input, mapping) {
  if (input.includes(" border ")) {
    input = input.replace(" border ", " border border-border ");
  }
  const classNames = input.split(" ");
  const lightMode = /* @__PURE__ */ new Set();
  const darkMode = /* @__PURE__ */ new Set();
  for (let className of classNames) {
    const [variant, value, modifier] = splitClassName(className);
    const prefix = PREFIXES.find((prefix2) => value?.startsWith(prefix2));
    if (!prefix) {
      if (!lightMode.has(className)) {
        lightMode.add(className);
      }
      continue;
    }
    const needle = value?.replace(prefix, "");
    if (needle && needle in mapping.light) {
      lightMode.add(
        [variant, `${prefix}${mapping.light[needle]}`].filter(Boolean).join(":") + (modifier ? `/${modifier}` : "")
      );
      darkMode.add(
        ["dark", variant, `${prefix}${mapping.dark[needle]}`].filter(Boolean).join(":") + (modifier ? `/${modifier}` : "")
      );
      continue;
    }
    if (!lightMode.has(className)) {
      lightMode.add(className);
    }
  }
  return [...Array.from(lightMode), ...Array.from(darkMode)].join(" ").trim();
}

// src/icons/libraries.ts
var iconLibraries = {
  lucide: {
    name: "lucide",
    title: "Lucide",
    packages: ["lucide-react"],
    import: "import { ICON } from 'lucide-react'",
    usage: "<ICON />",
    export: "lucide-react"
  },
  tabler: {
    name: "tabler",
    title: "Tabler Icons",
    packages: ["@tabler/icons-react"],
    import: "import { ICON } from '@tabler/icons-react'",
    usage: "<ICON />",
    export: "@tabler/icons-react"
  },
  hugeicons: {
    name: "hugeicons",
    title: "HugeIcons",
    packages: ["@hugeicons/react", "@hugeicons/core-free-icons"],
    import: "import { HugeiconsIcon } from '@hugeicons/react'\nimport { ICON } from '@hugeicons/core-free-icons';",
    usage: "<HugeiconsIcon icon={ICON} strokeWidth={2} />",
    export: "@hugeicons/core-free-icons"
  },
  phosphor: {
    name: "phosphor",
    title: "Phosphor Icons",
    packages: ["@phosphor-icons/react"],
    import: "import { ICON } from '@phosphor-icons/react'",
    usage: "<ICON strokeWidth={2} />",
    export: "@phosphor-icons/react"
  },
  remixicon: {
    name: "remixicon",
    title: "Remix Icon",
    packages: ["@remixicon/react"],
    import: "import { ICON } from '@remixicon/react'",
    usage: "<ICON />",
    export: "@remixicon/react"
  }
};
var transformIcons = async ({ sourceFile, config }) => {
  const iconLibrary = config.iconLibrary;
  if (!iconLibrary || !(iconLibrary in iconLibraries)) {
    return sourceFile;
  }
  const targetLibrary = iconLibrary;
  const libraryConfig = iconLibraries[targetLibrary];
  let transformedIcons = [];
  for (const element of sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxSelfClosingElement
  )) {
    if (element.getTagNameNode()?.getText() !== "IconPlaceholder") {
      continue;
    }
    const libraryPropAttr = element.getAttributes().find((attr) => {
      if (attr.getKind() !== SyntaxKind.JsxAttribute) {
        return false;
      }
      const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
      return jsxAttr.getNameNode().getText() === targetLibrary;
    });
    if (!libraryPropAttr) {
      continue;
    }
    const jsxIconAttr = libraryPropAttr.asKindOrThrow(SyntaxKind.JsxAttribute);
    const targetIconName = jsxIconAttr.getInitializer()?.getText().replace(/^["']|["']$/g, "");
    if (!targetIconName) {
      continue;
    }
    if (!transformedIcons.includes(targetIconName)) {
      transformedIcons.push(targetIconName);
    }
    const usage = libraryConfig.usage;
    const usageMatch = usage.match(/<(\w+)([^>]*)\s*\/>/);
    jsxIconAttr.remove();
    for (const attr of element.getAttributes()) {
      if (attr.getKind() !== SyntaxKind.JsxAttribute) {
        continue;
      }
      const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
      const attrName = jsxAttr.getNameNode().getText();
      if (attrName in iconLibraries) {
        jsxAttr.remove();
      }
    }
    if (!usageMatch) {
      element.getTagNameNode()?.replaceWithText(targetIconName);
      continue;
    }
    const [, componentName, defaultPropsStr] = usageMatch;
    if (componentName === "ICON") {
      const userAttributes = element.getAttributes().filter((attr) => {
        if (attr.getKind() !== SyntaxKind.JsxAttribute) {
          return true;
        }
        const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
        const attrName = jsxAttr.getNameNode().getText();
        return !(attrName in iconLibraries);
      }).map((attr) => attr.getText()).join(" ");
      if (userAttributes.trim()) {
        element.replaceWithText(`<${targetIconName} ${userAttributes} />`);
      } else {
        element.getTagNameNode()?.replaceWithText(targetIconName);
      }
    } else {
      const existingPropNames = new Set(
        element.getAttributes().filter((attr) => attr.getKind() === SyntaxKind.JsxAttribute).map(
          (attr) => attr.asKindOrThrow(SyntaxKind.JsxAttribute).getNameNode().getText()
        )
      );
      const defaultPropsWithIcon = defaultPropsStr.replace(
        /\{ICON\}/g,
        `{${targetIconName}}`
      );
      const defaultPropsToAdd = defaultPropsWithIcon.trim().split(/\s+(?=\w+=)/).filter((prop) => prop).map((prop) => {
        const propName = prop.split("=")[0];
        return propName && !existingPropNames.has(propName) ? prop : null;
      }).filter(Boolean);
      const userAttributes = element.getAttributes().filter((attr) => {
        if (attr.getKind() !== SyntaxKind.JsxAttribute) {
          return true;
        }
        const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
        const attrName = jsxAttr.getNameNode().getText();
        return !(attrName in iconLibraries);
      }).map((attr) => attr.getText()).join(" ");
      const allProps = [...defaultPropsToAdd, userAttributes].filter(Boolean).join(" ");
      element.replaceWithText(`<${componentName} ${allProps} />`);
    }
  }
  for (const importDeclaration of sourceFile.getImportDeclarations() ?? []) {
    const moduleSpecifier = importDeclaration.getModuleSpecifier()?.getText();
    if (moduleSpecifier?.includes("icon-placeholder")) {
      const namedImports = importDeclaration.getNamedImports() ?? [];
      const iconPlaceholderImport = namedImports.find(
        (specifier) => specifier.getName() === "IconPlaceholder"
      );
      if (iconPlaceholderImport) {
        iconPlaceholderImport.remove();
      }
      if (importDeclaration.getNamedImports()?.length === 0) {
        importDeclaration.remove();
      }
    }
  }
  if (transformedIcons.length > 0) {
    const importStatements = libraryConfig.import.split("\n");
    const addedImports = [];
    for (const importStmt of importStatements) {
      const importMatch = importStmt.match(
        /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/
      );
      if (!importMatch) continue;
      const [, importedNames, modulePath] = importMatch;
      const namedImports = importedNames.split(",").map((name) => name.trim()).map((name) => {
        if (name === "ICON") {
          return transformedIcons.map((icon) => ({ name: icon }));
        }
        return { name };
      }).flat();
      const newImport = sourceFile.addImportDeclaration({
        moduleSpecifier: modulePath,
        namedImports
      });
      addedImports.push(newImport);
    }
    if (!_useSemicolon(sourceFile)) {
      for (const importDecl of addedImports) {
        importDecl.replaceWithText(importDecl.getText().replace(";", ""));
      }
    }
  }
  return sourceFile;
};
function _useSemicolon(sourceFile) {
  return sourceFile.getImportDeclarations()?.[0]?.getText().endsWith(";") ?? false;
}
var transformImport = async ({
  sourceFile,
  config,
  isRemote
}) => {
  const utilsAlias = config.aliases?.utils;
  const workspaceAlias = typeof utilsAlias === "string" && utilsAlias.includes("/") ? utilsAlias.split("/")[0] : "@";
  const utilsImport = `${workspaceAlias}/lib/utils`;
  if (![".tsx", ".ts", ".jsx", ".js"].includes(sourceFile.getExtension())) {
    return sourceFile;
  }
  for (const specifier of sourceFile.getImportStringLiterals()) {
    const updated = updateImportAliases(
      specifier.getLiteralValue(),
      config,
      isRemote
    );
    specifier.setLiteralValue(updated);
    if (utilsImport === updated || updated === "@/lib/utils") {
      const importDeclaration = specifier.getFirstAncestorByKind(
        SyntaxKind.ImportDeclaration
      );
      const isCnImport = importDeclaration?.getNamedImports().some((namedImport) => namedImport.getName() === "cn");
      if (!isCnImport || !config.aliases.utils) {
        continue;
      }
      specifier.setLiteralValue(
        utilsImport === updated ? updated.replace(utilsImport, config.aliases.utils) : config.aliases.utils
      );
    }
  }
  return sourceFile;
};
function updateImportAliases(moduleSpecifier, config, isRemote = false) {
  if (!moduleSpecifier.startsWith("@/") && !isRemote) {
    return moduleSpecifier;
  }
  if (isRemote && moduleSpecifier.startsWith("@/")) {
    moduleSpecifier = moduleSpecifier.replace(/^@\//, `@/registry/new-york/`);
  }
  if (!moduleSpecifier.startsWith("@/registry/")) {
    const alias = config.aliases.components.split("/")[0];
    return moduleSpecifier.replace(/^@\//, `${alias}/`);
  }
  if (moduleSpecifier.match(/^@\/registry\/(.+)\/ui/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/ui/,
      config.aliases.ui ?? `${config.aliases.components}/ui`
    );
  }
  if (config.aliases.components && moduleSpecifier.match(/^@\/registry\/(.+)\/components/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/components/,
      config.aliases.components
    );
  }
  if (config.aliases.lib && moduleSpecifier.match(/^@\/registry\/(.+)\/lib/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/lib/,
      config.aliases.lib
    );
  }
  if (config.aliases.hooks && moduleSpecifier.match(/^@\/registry\/(.+)\/hooks/)) {
    return moduleSpecifier.replace(
      /^@\/registry\/(.+)\/hooks/,
      config.aliases.hooks
    );
  }
  return moduleSpecifier.replace(
    /^@\/registry\/[^/]+/,
    config.aliases.components
  );
}
var PARSE_OPTIONS = {
  sourceType: "module",
  allowImportExportEverywhere: true,
  allowReturnOutsideFunction: true,
  startLine: 1,
  tokens: true,
  plugins: [
    "asyncGenerators",
    "bigInt",
    "classPrivateMethods",
    "classPrivateProperties",
    "classProperties",
    "classStaticBlock",
    "decimal",
    "decorators-legacy",
    "doExpressions",
    "dynamicImport",
    "exportDefaultFrom",
    "exportNamespaceFrom",
    "functionBind",
    "functionSent",
    "importAssertions",
    "importMeta",
    "nullishCoalescingOperator",
    "numericSeparator",
    "objectRestSpread",
    "optionalCatchBinding",
    "optionalChaining",
    [
      "pipelineOperator",
      {
        proposal: "minimal"
      }
    ],
    [
      "recordAndTuple",
      {
        syntaxType: "hash"
      }
    ],
    "throwExpressions",
    "topLevelAwait",
    "v8intrinsic",
    "typescript",
    "jsx"
  ]
};
var transformJsx = async ({
  sourceFile,
  config
}) => {
  const output = sourceFile.getFullText();
  if (config.tsx) {
    return output;
  }
  const ast = recast.parse(output, {
    parser: {
      parse: (code) => {
        return parse(code, PARSE_OPTIONS);
      }
    }
  });
  const result = transformFromAstSync(ast, output, {
    cloneInputAst: false,
    code: false,
    ast: true,
    plugins: [transformTypescript],
    configFile: false
  });
  if (!result || !result.ast) {
    throw new Error("Failed to transform JSX");
  }
  return recast.print(result.ast).code;
};
var directiveRegex = /^["']use client["']$/g;
var transformRsc = async ({ sourceFile, config }) => {
  if (config.rsc) {
    return sourceFile;
  }
  const first = sourceFile.getFirstChildByKind(SyntaxKind.ExpressionStatement);
  if (first && directiveRegex.test(first.getText())) {
    first.remove();
  }
  return sourceFile;
};
var PRESERVED_CN_MARKERS = /* @__PURE__ */ new Set(["cn-font-heading"]);
var CN_MARKER_REGEX = /\bcn-[a-z-]+\b/;
function isRemovableCnMarker(token) {
  return CN_MARKER_REGEX.test(token) && !PRESERVED_CN_MARKERS.has(token);
}
function stripCnMarkers(className) {
  return className.split(/\s+/).filter((token) => token.length > 0 && !isRemovableCnMarker(token)).join(" ");
}
function hasRemovableCnMarker(className) {
  return className.split(/\s+/).some(isRemovableCnMarker);
}
function processStringLiteral(node) {
  const currentValue = node.getLiteralValue();
  if (!hasRemovableCnMarker(currentValue)) {
    return;
  }
  const newValue = stripCnMarkers(currentValue);
  if (newValue !== currentValue) {
    node.setLiteralValue(newValue);
  }
}
function processStringLiterals(node) {
  for (const stringLit of node.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
    processStringLiteral(stringLit);
  }
  for (const templateLit of node.getDescendantsOfKind(
    SyntaxKind.NoSubstitutionTemplateLiteral
  )) {
    processStringLiteral(templateLit);
  }
}
function applyCleanup(sourceFile) {
  const attributesToRemove = [];
  for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    const attrName = attr.getNameNode().getText();
    if (attrName !== "className" && attrName !== "classNames") {
      continue;
    }
    const initializer = attr.getInitializer();
    if (initializer?.isKind(SyntaxKind.StringLiteral)) {
      const currentValue = initializer.getLiteralValue();
      if (hasRemovableCnMarker(currentValue)) {
        const newValue = stripCnMarkers(currentValue);
        if (newValue === "") {
          attributesToRemove.push(attr);
        } else if (newValue !== currentValue) {
          initializer.setLiteralValue(newValue);
        }
      }
    }
    if (initializer?.isKind(SyntaxKind.JsxExpression)) {
      processStringLiterals(initializer);
    }
  }
  for (const attr of attributesToRemove) {
    attr.remove();
  }
  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression
  )) {
    if (call.getExpression().getText() !== "cva") {
      continue;
    }
    for (const arg of call.getArguments()) {
      if (arg.isKind(SyntaxKind.StringLiteral)) {
        processStringLiteral(arg);
        continue;
      }
      if (arg.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
        processStringLiteral(arg);
        continue;
      }
      processStringLiterals(arg);
    }
  }
  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression
  )) {
    if (call.getExpression().getText() !== "mergeProps") {
      continue;
    }
    processStringLiterals(call);
  }
}
var transformCleanup = async ({ sourceFile }) => {
  applyCleanup(sourceFile);
  return sourceFile;
};
var RTL_MAPPINGS = [
  ["-ml-", "-ms-"],
  ["-mr-", "-me-"],
  ["ml-", "ms-"],
  ["mr-", "me-"],
  ["pl-", "ps-"],
  ["pr-", "pe-"],
  ["-left-", "-start-"],
  ["-right-", "-end-"],
  ["left-", "start-"],
  ["right-", "end-"],
  ["inset-l-", "inset-inline-start-"],
  ["inset-r-", "inset-inline-end-"],
  ["rounded-tl-", "rounded-ss-"],
  ["rounded-tr-", "rounded-se-"],
  ["rounded-bl-", "rounded-es-"],
  ["rounded-br-", "rounded-ee-"],
  ["rounded-l-", "rounded-s-"],
  ["rounded-r-", "rounded-e-"],
  ["border-l-", "border-s-"],
  ["border-r-", "border-e-"],
  ["border-l", "border-s"],
  ["border-r", "border-e"],
  ["text-left", "text-start"],
  ["text-right", "text-end"],
  ["scroll-ml-", "scroll-ms-"],
  ["scroll-mr-", "scroll-me-"],
  ["scroll-pl-", "scroll-ps-"],
  ["scroll-pr-", "scroll-pe-"],
  ["float-left", "float-start"],
  ["float-right", "float-end"],
  ["clear-left", "clear-start"],
  ["clear-right", "clear-end"],
  ["origin-top-left", "origin-top-start"],
  ["origin-top-right", "origin-top-end"],
  ["origin-bottom-left", "origin-bottom-start"],
  ["origin-bottom-right", "origin-bottom-end"],
  ["origin-left", "origin-start"],
  ["origin-right", "origin-end"]
];
var RTL_TRANSLATE_X_MAPPINGS = [
  ["-translate-x-", "translate-x-"],
  ["translate-x-", "-translate-x-"]
];
var RTL_REVERSE_MAPPINGS = [
  ["space-x-", "space-x-reverse"],
  ["divide-x-", "divide-x-reverse"]
];
var RTL_SWAP_MAPPINGS = [
  ["cursor-w-resize", "cursor-e-resize"],
  ["cursor-e-resize", "cursor-w-resize"]
];
var RTL_LOGICAL_SIDE_SLIDE_MAPPINGS = [
  ["data-[side=inline-start]", "slide-in-from-right", "slide-in-from-end"],
  ["data-[side=inline-start]", "slide-out-to-right", "slide-out-to-end"],
  ["data-[side=inline-end]", "slide-in-from-left", "slide-in-from-start"],
  ["data-[side=inline-end]", "slide-out-to-left", "slide-out-to-start"]
];
var RTL_FLIP_MARKER = "cn-rtl-flip";
var RTL_SIDE_PROP_COMPONENTS = [
  "ContextMenuContent",
  "ContextMenuSubContent",
  "DropdownMenuSubContent"
];
var RTL_SIDE_PROP_MAPPINGS = {
  right: "inline-end",
  left: "inline-start"
};
var POSITIONING_PREFIXES = ["-left-", "-right-", "left-", "right-"];
var transformRtl = async ({ sourceFile, config }) => {
  if (!config.rtl) {
    return sourceFile;
  }
  applyRtlTransformToSourceFile(sourceFile);
  return sourceFile;
};
async function transformDirection(source, rtl) {
  const project3 = new Project({
    useInMemoryFileSystem: true
  });
  const sourceFile = project3.createSourceFile("component.tsx", source, {
    scriptKind: ScriptKind.TSX,
    overwrite: true
  });
  applyRtlTransformToSourceFile(sourceFile);
  return sourceFile.getText();
}
function stripQuotes(str) {
  return str.replace(/^["']|["']$/g, "");
}
function transformStringLiteralNode(node) {
  const text = stripQuotes(node.getText() ?? "");
  node.replaceWithText(`"${applyRtlMapping(text)}"`);
}
function applyRtlMapping(input) {
  return input.split(" ").flatMap((className) => {
    if (className.startsWith("rtl:") || className.startsWith("ltr:")) {
      return [className];
    }
    if (className === RTL_FLIP_MARKER) {
      return ["rtl:rotate-180"];
    }
    const [variant, value, modifier] = splitClassName(className);
    if (!value) {
      return [className];
    }
    for (const [physical, rtlPhysical] of RTL_TRANSLATE_X_MAPPINGS) {
      if (value.startsWith(physical)) {
        const rtlValue = value.replace(physical, rtlPhysical);
        const rtlClass = variant ? `rtl:${variant}:${rtlValue}${modifier ? `/${modifier}` : ""}` : `rtl:${rtlValue}${modifier ? `/${modifier}` : ""}`;
        return [className, rtlClass];
      }
    }
    for (const [prefix, reverseClass] of RTL_REVERSE_MAPPINGS) {
      if (value.startsWith(prefix)) {
        const rtlClass = variant ? `rtl:${variant}:${reverseClass}` : `rtl:${reverseClass}`;
        return [className, rtlClass];
      }
    }
    for (const [physical, swapped] of RTL_SWAP_MAPPINGS) {
      if (value === physical) {
        const rtlClass = variant ? `rtl:${variant}:${swapped}` : `rtl:${swapped}`;
        return [className, rtlClass];
      }
    }
    for (const [
      variantPattern,
      physical,
      logical
    ] of RTL_LOGICAL_SIDE_SLIDE_MAPPINGS) {
      if (variant?.includes(variantPattern) && value.startsWith(physical)) {
        const mappedValue2 = value.replace(physical, logical);
        const result2 = modifier ? `${variant}:${mappedValue2}/${modifier}` : `${variant}:${mappedValue2}`;
        return [result2];
      }
    }
    const isPhysicalSideVariant = variant?.includes("data-[side=left]") || variant?.includes("data-[side=right]");
    let mappedValue = value;
    for (const [physical, logical] of RTL_MAPPINGS) {
      if (isPhysicalSideVariant && POSITIONING_PREFIXES.some((p) => physical.startsWith(p))) {
        continue;
      }
      if (value.startsWith(physical)) {
        if (!physical.endsWith("-") && value !== physical) {
          continue;
        }
        mappedValue = value.replace(physical, logical);
        break;
      }
    }
    let result;
    if (variant) {
      result = modifier ? `${variant}:${mappedValue}/${modifier}` : `${variant}:${mappedValue}`;
    } else {
      result = modifier ? `${mappedValue}/${modifier}` : mappedValue;
    }
    return [result];
  }).join(" ");
}
function applyRtlTransformToSourceFile(sourceFile) {
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((node) => node.getExpression().getText() === "cva").forEach((node) => {
    const firstArg = node.getArguments()[0];
    if (firstArg?.isKind(SyntaxKind.StringLiteral)) {
      transformStringLiteralNode(firstArg);
    }
    if (node.getArguments()[1]?.isKind(SyntaxKind.ObjectLiteralExpression)) {
      node.getArguments()[1]?.getDescendantsOfKind(SyntaxKind.PropertyAssignment).find((node2) => node2.getName() === "variants")?.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((node2) => {
        node2.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((prop) => {
          const classNames = prop.getInitializerIfKind(
            SyntaxKind.StringLiteral
          );
          if (classNames) {
            transformStringLiteralNode(classNames);
          }
        });
      });
    }
  });
  sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((node) => {
    if (node.getNameNode().getText() === "className") {
      const initializer = node.getInitializer();
      if (initializer?.isKind(SyntaxKind.StringLiteral)) {
        transformStringLiteralNode(initializer);
      }
      if (node.getInitializer()?.isKind(SyntaxKind.JsxExpression)) {
        const callExpression = node.getInitializer()?.getDescendantsOfKind(SyntaxKind.CallExpression).find((node2) => node2.getExpression().getText() === "cn");
        if (callExpression) {
          callExpression.getArguments().forEach((arg) => {
            if (arg.isKind(SyntaxKind.ConditionalExpression) || arg.isKind(SyntaxKind.BinaryExpression)) {
              arg.getChildrenOfKind(SyntaxKind.StringLiteral).forEach(transformStringLiteralNode);
            }
            if (arg.isKind(SyntaxKind.StringLiteral)) {
              transformStringLiteralNode(arg);
            }
          });
        }
      }
    }
    if (node.getNameNode().getText() === "classNames") {
      if (node.getInitializer()?.isKind(SyntaxKind.JsxExpression)) {
        node.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((node2) => {
          if (node2.getInitializer()?.isKind(SyntaxKind.CallExpression)) {
            const callExpression = node2.getInitializerIfKind(
              SyntaxKind.CallExpression
            );
            if (callExpression) {
              callExpression.getArguments().forEach((arg) => {
                if (arg.isKind(SyntaxKind.ConditionalExpression)) {
                  arg.getChildrenOfKind(SyntaxKind.StringLiteral).forEach(transformStringLiteralNode);
                }
                if (arg.isKind(SyntaxKind.StringLiteral)) {
                  transformStringLiteralNode(arg);
                }
              });
            }
          }
          const propInit = node2.getInitializer();
          if (propInit?.isKind(SyntaxKind.StringLiteral)) {
            if (node2.getNameNode().getText() !== "variant") {
              transformStringLiteralNode(propInit);
            }
          }
        });
      }
    }
  });
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((node) => node.getExpression().getText() === "mergeProps").forEach((node) => {
    const firstArg = node.getArguments()[0];
    if (firstArg?.isKind(SyntaxKind.ObjectLiteralExpression)) {
      const classNameProp = firstArg.getProperties().find(
        (prop) => prop.isKind(SyntaxKind.PropertyAssignment) && prop.getName() === "className"
      );
      if (classNameProp?.isKind(SyntaxKind.PropertyAssignment)) {
        const init2 = classNameProp.getInitializer();
        if (init2?.isKind(SyntaxKind.CallExpression)) {
          if (init2.getExpression().getText() === "cn") {
            init2.getArguments().forEach((arg) => {
              if (arg.isKind(SyntaxKind.StringLiteral)) {
                transformStringLiteralNode(arg);
              }
              if (arg.isKind(SyntaxKind.ConditionalExpression) || arg.isKind(SyntaxKind.BinaryExpression)) {
                arg.getChildrenOfKind(SyntaxKind.StringLiteral).forEach(transformStringLiteralNode);
              }
            });
          }
        }
        if (init2?.isKind(SyntaxKind.StringLiteral)) {
          transformStringLiteralNode(init2);
        }
      }
    }
  });
  [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
  ].forEach((element) => {
    const tagName = element.getTagNameNode().getText();
    if (!RTL_SIDE_PROP_COMPONENTS.includes(tagName)) {
      return;
    }
    const sideAttr = element.getAttributes().find(
      (attr) => attr.isKind(SyntaxKind.JsxAttribute) && attr.getNameNode().getText() === "side"
    );
    if (!sideAttr?.isKind(SyntaxKind.JsxAttribute)) {
      return;
    }
    const sideValue = sideAttr.getInitializer();
    if (!sideValue?.isKind(SyntaxKind.StringLiteral)) {
      return;
    }
    const currentValue = stripQuotes(sideValue.getText() ?? "");
    const mappedValue = RTL_SIDE_PROP_MAPPINGS[currentValue];
    if (mappedValue) {
      sideValue.replaceWithText(`"${mappedValue}"`);
    }
  });
  sourceFile.getDescendantsOfKind(SyntaxKind.BindingElement).forEach((node) => {
    const paramName = node.getNameNode().getText();
    if (paramName !== "side") {
      return;
    }
    const functionDecl = node.getFirstAncestorByKind(
      SyntaxKind.FunctionDeclaration
    );
    const functionName = functionDecl?.getName();
    if (!functionName || !RTL_SIDE_PROP_COMPONENTS.includes(functionName)) {
      return;
    }
    const initializer = node.getInitializer();
    if (!initializer?.isKind(SyntaxKind.StringLiteral)) {
      return;
    }
    const currentValue = stripQuotes(initializer.getText() ?? "");
    const mappedValue = RTL_SIDE_PROP_MAPPINGS[currentValue];
    if (mappedValue) {
      initializer.replaceWithText(`"${mappedValue}"`);
    }
  });
}
var transformTwPrefixes = async ({
  sourceFile,
  config
}) => {
  if (!config.tailwind?.prefix) {
    return sourceFile;
  }
  const tailwindVersion = await getProjectTailwindVersionFromConfig(config);
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((node) => node.getExpression().getText() === "cva").forEach((node) => {
    if (node.getArguments()[0]?.isKind(SyntaxKind.StringLiteral)) {
      const defaultClassNames = node.getArguments()[0];
      if (defaultClassNames) {
        defaultClassNames.replaceWithText(
          `"${applyPrefix(
            defaultClassNames.getText()?.replace(/"|'/g, ""),
            config.tailwind.prefix,
            tailwindVersion
          )}"`
        );
      }
    }
    if (node.getArguments()[1]?.isKind(SyntaxKind.ObjectLiteralExpression)) {
      node.getArguments()[1]?.getDescendantsOfKind(SyntaxKind.PropertyAssignment).find((node2) => node2.getName() === "variants")?.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((node2) => {
        node2.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((node3) => {
          const classNames = node3.getInitializerIfKind(
            SyntaxKind.StringLiteral
          );
          if (classNames) {
            classNames?.replaceWithText(
              `"${applyPrefix(
                classNames.getText()?.replace(/"|'/g, ""),
                config.tailwind.prefix,
                tailwindVersion
              )}"`
            );
          }
        });
      });
    }
  });
  sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach((node) => {
    if (node.getNameNode().getText() === "className") {
      if (node.getInitializer()?.isKind(SyntaxKind.StringLiteral)) {
        const value = node.getInitializer();
        if (value) {
          value.replaceWithText(
            `"${applyPrefix(
              value.getText()?.replace(/"|'/g, ""),
              config.tailwind.prefix,
              tailwindVersion
            )}"`
          );
        }
      }
      if (node.getInitializer()?.isKind(SyntaxKind.JsxExpression)) {
        const callExpression = node.getInitializer()?.getDescendantsOfKind(SyntaxKind.CallExpression).find((node2) => node2.getExpression().getText() === "cn");
        if (callExpression) {
          callExpression.getArguments().forEach((node2) => {
            if (node2.isKind(SyntaxKind.ConditionalExpression) || node2.isKind(SyntaxKind.BinaryExpression)) {
              node2.getChildrenOfKind(SyntaxKind.StringLiteral).forEach((node3) => {
                node3.replaceWithText(
                  `"${applyPrefix(
                    node3.getText()?.replace(/"|'/g, ""),
                    config.tailwind.prefix,
                    tailwindVersion
                  )}"`
                );
              });
            }
            if (node2.isKind(SyntaxKind.StringLiteral)) {
              node2.replaceWithText(
                `"${applyPrefix(
                  node2.getText()?.replace(/"|'/g, ""),
                  config.tailwind.prefix,
                  tailwindVersion
                )}"`
              );
            }
          });
        }
      }
    }
    if (node.getNameNode().getText() === "classNames") {
      if (node.getInitializer()?.isKind(SyntaxKind.JsxExpression)) {
        node.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach((node2) => {
          if (node2.getInitializer()?.isKind(SyntaxKind.CallExpression)) {
            const callExpression = node2.getInitializerIfKind(
              SyntaxKind.CallExpression
            );
            if (callExpression) {
              callExpression.getArguments().forEach((arg) => {
                if (arg.isKind(SyntaxKind.ConditionalExpression)) {
                  arg.getChildrenOfKind(SyntaxKind.StringLiteral).forEach((node3) => {
                    node3.replaceWithText(
                      `"${applyPrefix(
                        node3.getText()?.replace(/"|'/g, ""),
                        config.tailwind.prefix,
                        tailwindVersion
                      )}"`
                    );
                  });
                }
                if (arg.isKind(SyntaxKind.StringLiteral)) {
                  arg.replaceWithText(
                    `"${applyPrefix(
                      arg.getText()?.replace(/"|'/g, ""),
                      config.tailwind.prefix,
                      tailwindVersion
                    )}"`
                  );
                }
              });
            }
          }
          if (node2.getInitializer()?.isKind(SyntaxKind.StringLiteral)) {
            if (node2.getNameNode().getText() !== "variant") {
              const classNames = node2.getInitializer();
              if (classNames) {
                classNames.replaceWithText(
                  `"${applyPrefix(
                    classNames.getText()?.replace(/"|'/g, ""),
                    config.tailwind.prefix,
                    tailwindVersion
                  )}"`
                );
              }
            }
          }
        });
      }
    }
  });
  return sourceFile;
};
function applyPrefix(input, prefix = "", tailwindVersion) {
  if (tailwindVersion === "v3") {
    return input.split(" ").map((className) => {
      const [variant, value, modifier] = splitClassName(className);
      if (variant) {
        return modifier ? `${variant}:${prefix}${value}/${modifier}` : `${variant}:${prefix}${value}`;
      } else {
        return modifier ? `${prefix}${value}/${modifier}` : `${prefix}${value}`;
      }
    }).join(" ");
  }
  return input.split(" ").map(
    (className) => className.indexOf(`${prefix}:`) === 0 ? className : `${prefix}:${className.trim()}`
  ).join(" ");
}

// src/utils/transformers/index.ts
var project = new Project({
  compilerOptions: {}
});
async function createTempSourceFile(filename) {
  const dir = await promises.mkdtemp(path4__default.join(tmpdir(), "shadcn-"));
  return path4__default.join(dir, filename);
}
async function transform(opts, transformers = [
  transformImport,
  transformRsc,
  transformCssVars,
  transformTwPrefixes,
  transformRtl,
  transformIcons,
  transformCleanup
]) {
  const tempFile = await createTempSourceFile(opts.filename);
  const sourceFile = project.createSourceFile(tempFile, opts.raw, {
    scriptKind: ScriptKind.TSX
  });
  for (const transformer of transformers) {
    await transformer({ sourceFile, ...opts });
  }
  if (opts.transformJsx) {
    return await transformJsx({
      sourceFile,
      ...opts
    });
  }
  return sourceFile.getText();
}
var ELEMENTS_REQUIRING_NATIVE_BUTTON_FALSE = [
  "a",
  "span",
  "div",
  "Link",
  "label",
  "Label"
];
var transformAsChild = async ({ sourceFile, config }) => {
  if (!config.style?.startsWith("base-")) {
    return sourceFile;
  }
  const MAX_ITERATIONS = 10;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
    const asChildElements = jsxElements.filter(
      (el) => el.getOpeningElement().getAttribute("asChild")
    );
    if (asChildElements.length === 0) {
      break;
    }
    const leafElements = asChildElements.filter((el) => {
      const descendants = el.getDescendantsOfKind(SyntaxKind.JsxElement);
      return !descendants.some(
        (d) => d.getOpeningElement().getAttribute("asChild")
      );
    });
    const transformations = [];
    for (const jsxElement of leafElements) {
      const openingElement = jsxElement.getOpeningElement();
      const asChildAttr = openingElement.getAttribute("asChild");
      if (!asChildAttr) {
        continue;
      }
      const parentTagName = openingElement.getTagNameNode().getText();
      const children = jsxElement.getJsxChildren();
      const childElement = children.find(
        (child) => child.getKind() === SyntaxKind.JsxElement || child.getKind() === SyntaxKind.JsxSelfClosingElement
      );
      if (!childElement) {
        asChildAttr.remove();
        continue;
      }
      let childTagName;
      let childProps;
      let childChildren;
      if (childElement.getKind() === SyntaxKind.JsxSelfClosingElement) {
        const selfClosing = childElement.asKindOrThrow(
          SyntaxKind.JsxSelfClosingElement
        );
        childTagName = selfClosing.getTagNameNode().getText();
        childProps = selfClosing.getAttributes().map((attr) => attr.getText()).join(" ");
        childChildren = "";
      } else {
        const jsxChild = childElement.asKindOrThrow(SyntaxKind.JsxElement);
        const openingEl = jsxChild.getOpeningElement();
        childTagName = openingEl.getTagNameNode().getText();
        childProps = openingEl.getAttributes().map((attr) => attr.getText()).join(" ");
        childChildren = jsxChild.getJsxChildren().map((c) => c.getText()).join("");
      }
      const needsNativeButton = parentTagName === "Button" && ELEMENTS_REQUIRING_NATIVE_BUTTON_FALSE.includes(childTagName);
      transformations.push({
        parentElement: jsxElement,
        parentTagName,
        childTagName,
        childProps,
        childChildren,
        needsNativeButton
      });
    }
    for (const info2 of transformations.reverse()) {
      const openingElement = info2.parentElement.getOpeningElement();
      const existingAttrs = openingElement.getAttributes().filter((attr) => {
        if (attr.getKind() === SyntaxKind.JsxAttribute) {
          const jsxAttr = attr.asKindOrThrow(SyntaxKind.JsxAttribute);
          return jsxAttr.getNameNode().getText() !== "asChild";
        }
        return true;
      }).map((attr) => attr.getText()).join(" ");
      const renderValue = info2.childProps ? `{<${info2.childTagName} ${info2.childProps} />}` : `{<${info2.childTagName} />}`;
      let newAttrs = existingAttrs ? `${existingAttrs} ` : "";
      newAttrs += `render=${renderValue}`;
      if (info2.needsNativeButton) {
        newAttrs += ` nativeButton={false}`;
      }
      const newChildren = info2.childChildren.trim() ? `${info2.childChildren}` : "";
      const newElementText = `<${info2.parentTagName} ${newAttrs}>${newChildren}</${info2.parentTagName}>`;
      info2.parentElement.replaceWithText(newElementText);
    }
  }
  return sourceFile;
};
var FONT_MARKERS = [
  {
    marker: "cn-font-heading",
    utility: "font-heading",
    supportToken: "--font-heading:"
  }
];
var MARKER_REGEX = /\bcn-font-heading\b/;
var supportCache = /* @__PURE__ */ new Map();
async function getSupportedFontMarkers(tailwindCssPath, extraMarkers = []) {
  const supported = new Set(extraMarkers);
  if (!tailwindCssPath) {
    return supported;
  }
  let cached = supportCache.get(tailwindCssPath);
  if (!cached) {
    cached = promises.readFile(tailwindCssPath, "utf8").then((content) => {
      const projectMarkers = /* @__PURE__ */ new Set();
      for (const marker of FONT_MARKERS) {
        if (content.includes(marker.supportToken)) {
          projectMarkers.add(marker.marker);
        }
      }
      return projectMarkers;
    }).catch(() => /* @__PURE__ */ new Set());
    supportCache.set(tailwindCssPath, cached);
  }
  (await cached).forEach((marker) => {
    supported.add(marker);
  });
  return supported;
}
function rewriteFontMarkers(className, supportedMarkers) {
  let next2 = className;
  for (const marker of FONT_MARKERS) {
    if (!next2.includes(marker.marker)) {
      continue;
    }
    next2 = next2.replace(
      new RegExp(`\\b${marker.marker}\\b`, "g"),
      supportedMarkers.has(marker.marker) ? marker.utility : ""
    );
  }
  return next2.replace(/\s+/g, " ").trim();
}
function processStringLiteral2(node, supportedMarkers) {
  const currentValue = node.getLiteralValue();
  if (!MARKER_REGEX.test(currentValue)) {
    return;
  }
  const newValue = rewriteFontMarkers(currentValue, supportedMarkers);
  if (newValue !== currentValue) {
    node.setLiteralValue(newValue);
  }
}
function processStringLiterals2(node, supportedMarkers) {
  for (const stringLit of node.getDescendantsOfKind(SyntaxKind.StringLiteral)) {
    processStringLiteral2(stringLit, supportedMarkers);
  }
  for (const templateLit of node.getDescendantsOfKind(
    SyntaxKind.NoSubstitutionTemplateLiteral
  )) {
    processStringLiteral2(templateLit, supportedMarkers);
  }
}
var transformFont = async ({
  sourceFile,
  config,
  supportedFontMarkers
}) => {
  const supportedMarkers = await getSupportedFontMarkers(
    config.resolvedPaths.tailwindCss,
    supportedFontMarkers
  );
  const attributesToRemove = [];
  for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    const attrName = attr.getNameNode().getText();
    if (attrName !== "className" && attrName !== "classNames") {
      continue;
    }
    const initializer = attr.getInitializer();
    if (initializer?.isKind(SyntaxKind.StringLiteral)) {
      const currentValue = initializer.getLiteralValue();
      if (MARKER_REGEX.test(currentValue)) {
        const newValue = rewriteFontMarkers(currentValue, supportedMarkers);
        if (newValue === "") {
          attributesToRemove.push(attr);
        } else if (newValue !== currentValue) {
          initializer.setLiteralValue(newValue);
        }
      }
    }
    if (initializer?.isKind(SyntaxKind.JsxExpression)) {
      processStringLiterals2(initializer, supportedMarkers);
    }
  }
  for (const attr of attributesToRemove) {
    attr.remove();
  }
  for (const call of sourceFile.getDescendantsOfKind(
    SyntaxKind.CallExpression
  )) {
    if (call.getExpression().getText() === "cva") {
      for (const arg of call.getArguments()) {
        if (arg.isKind(SyntaxKind.StringLiteral)) {
          processStringLiteral2(arg, supportedMarkers);
          continue;
        }
        if (arg.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
          processStringLiteral2(arg, supportedMarkers);
          continue;
        }
        processStringLiterals2(arg, supportedMarkers);
      }
      continue;
    }
    if (call.getExpression().getText() === "mergeProps") {
      processStringLiterals2(call, supportedMarkers);
    }
  }
  return sourceFile;
};
var TRANSLUCENT_CLASSES = "animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!";
var transformMenu = async ({ sourceFile, config }) => {
  const menuColor = config.menuColor;
  const isTranslucent = menuColor === "default-translucent" || menuColor === "inverted-translucent";
  for (const attr of sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)) {
    const attrName = attr.getNameNode().getText();
    if (attrName !== "className") {
      continue;
    }
    const initializer = attr.getInitializer();
    if (!initializer) {
      continue;
    }
    const text = initializer.getText();
    if (!text.includes("cn-menu-target") && !text.includes("cn-menu-translucent")) {
      continue;
    }
    let newText = text;
    let needsCleanup = false;
    if (menuColor === "inverted" || menuColor === "inverted-translucent") {
      newText = newText.replace(/cn-menu-target/g, "dark");
    } else {
      newText = newText.replace(/cn-menu-target/g, "");
      needsCleanup = true;
    }
    if (isTranslucent) {
      newText = newText.replace(
        /"([^"]*cn-menu-translucent[^"]*)"/g,
        (_, classes) => {
          const merged = twMerge(classes, TRANSLUCENT_CLASSES);
          return `"${merged.replace(/\s*\bcn-menu-translucent\b\s*/g, " ").trim()}"`;
        }
      );
    } else {
      if (newText.includes("cn-menu-translucent")) {
        newText = newText.replace(/cn-menu-translucent/g, "");
        needsCleanup = true;
      }
    }
    if (needsCleanup) {
      newText = newText.replace(/\s{2,}/g, " ");
      newText = newText.replace(/"\s+/g, '"');
      newText = newText.replace(/\s+"/g, '"');
      newText = newText.replace(/,\s*""\s*,/g, ",");
      newText = newText.replace(/\(\s*""\s*,/g, "(");
      newText = newText.replace(/,\s*""\s*\)/g, ")");
    }
    attr.setInitializer(newText);
  }
  return sourceFile;
};

// src/utils/transformers/transform-next.ts
var transformNext = async ({ sourceFile }) => {
  sourceFile.getFunctions().forEach((func) => {
    if (func.getName() === "middleware") {
      func.rename("proxy");
    }
  });
  sourceFile.getVariableDeclarations().forEach((variable) => {
    if (variable.getName() === "middleware") {
      variable.rename("proxy");
    }
  });
  sourceFile.getExportDeclarations().forEach((exportDecl) => {
    const namedExports = exportDecl.getNamedExports();
    namedExports.forEach((namedExport) => {
      if (namedExport.getName() === "middleware") {
        namedExport.setName("proxy");
      }
      const aliasNode = namedExport.getAliasNode();
      if (aliasNode?.getText() === "middleware") {
        namedExport.setAlias("proxy");
      }
    });
  });
  return sourceFile;
};

// src/utils/updaters/update-files.ts
async function updateFiles(files, config, options) {
  if (!files?.length) {
    return {
      filesCreated: [],
      filesUpdated: [],
      filesSkipped: []
    };
  }
  options = {
    overwrite: false,
    force: false,
    silent: false,
    isRemote: false,
    isWorkspace: false,
    ...options
  };
  const filesCreatedSpinner = spinner(`Updating files.`, {
    silent: options.silent
  })?.start();
  const [projectInfo, baseColor] = await Promise.all([
    getProjectInfo(config.resolvedPaths.cwd),
    config.tailwind.baseColor ? getRegistryBaseColor(config.tailwind.baseColor) : Promise.resolve(void 0)
  ]);
  let filesCreated = [];
  let filesUpdated = [];
  let filesSkipped = [];
  let envVarsAdded = [];
  let envFile = null;
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!file.content) {
      continue;
    }
    let filePath = resolveFilePath(file, config, {
      isSrcDir: projectInfo?.isSrcDir,
      framework: projectInfo?.framework.name,
      commonRoot: findCommonRoot(
        files.map((f) => f.path),
        file.path
      ),
      path: options.path,
      fileIndex: index
    });
    if (!filePath) {
      continue;
    }
    const fileName = basename(file.path);
    const targetDir = path4__default.dirname(filePath);
    if (!config.tsx) {
      filePath = filePath.replace(
        /\.tsx?$/,
        (match) => match === ".tsx" ? ".jsx" : ".js"
      );
    }
    if (isEnvFile(filePath) && !existsSync(filePath)) {
      const alternativeEnvFile = findExistingEnvFile(targetDir);
      if (alternativeEnvFile) {
        filePath = alternativeEnvFile;
      }
    }
    const existingFile = existsSync(filePath);
    if (file.type === "registry:lib" && basename(file.path) === "utils.ts" && projectInfo?.framework.name === "laravel" && existingFile) {
      filesSkipped.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
      continue;
    }
    if (existingFile && statSync(filePath).isDirectory()) {
      throw new Error(
        `Cannot write to ${filePath}: path exists and is a directory. Please provide a file path instead.`
      );
    }
    const isUniversalItemFile = file.type === "registry:file" || file.type === "registry:item";
    const content = isEnvFile(filePath) || isUniversalItemFile ? file.content : await transform(
      {
        filename: file.path,
        raw: file.content,
        config,
        baseColor,
        transformJsx: !config.tsx,
        isRemote: options.isRemote,
        supportedFontMarkers: options.supportedFontMarkers
      },
      [
        transformImport,
        transformRsc,
        transformCssVars,
        transformTwPrefixes,
        transformIcons,
        transformMenu,
        transformAsChild,
        transformRtl,
        ..._isNext16Middleware(filePath, projectInfo, config) ? [transformNext] : [],
        transformFont,
        transformCleanup
      ]
    );
    if (existingFile && !isEnvFile(filePath)) {
      const existingFileContent = await promises.readFile(filePath, "utf-8");
      if (isContentSame(existingFileContent, content, {
        // Ignore import differences for workspace components.
        // TODO: figure out if we always want this.
        ignoreImports: options.isWorkspace
      })) {
        filesSkipped.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
        continue;
      }
    }
    if (existingFile && !options.overwrite && !isEnvFile(filePath)) {
      filesCreatedSpinner.stop();
      if (options.rootSpinner) {
        options.rootSpinner.stop();
      }
      const { overwrite } = await prompts5({
        type: "confirm",
        name: "overwrite",
        message: `The file ${highlighter.info(
          fileName
        )} already exists. Would you like to overwrite?`,
        initial: false
      });
      if (!overwrite) {
        filesSkipped.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
        if (options.rootSpinner) {
          options.rootSpinner.start();
        }
        continue;
      }
      filesCreatedSpinner?.start();
      if (options.rootSpinner) {
        options.rootSpinner.start();
      }
    }
    if (_isNext16Middleware(filePath, projectInfo, config)) {
      filePath = filePath.replace(/middleware\.(ts|js)$/, "proxy.$1");
    }
    if (!existsSync(targetDir)) {
      await promises.mkdir(targetDir, { recursive: true });
    }
    if (isEnvFile(filePath) && existingFile) {
      const existingFileContent = await promises.readFile(filePath, "utf-8");
      const mergedContent = mergeEnvContent(existingFileContent, content);
      envVarsAdded = getNewEnvKeys(existingFileContent, content);
      envFile = path4__default.relative(config.resolvedPaths.cwd, filePath);
      if (!envVarsAdded.length) {
        filesSkipped.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
        continue;
      }
      await promises.writeFile(filePath, mergedContent, "utf-8");
      filesUpdated.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
      continue;
    }
    await promises.writeFile(filePath, withYyc3Header(content, filePath), "utf-8");
    if (!existingFile) {
      filesCreated.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
      if (isEnvFile(filePath)) {
        envVarsAdded = Object.keys(parseEnvContent(content));
        envFile = path4__default.relative(config.resolvedPaths.cwd, filePath);
      }
    } else {
      filesUpdated.push(path4__default.relative(config.resolvedPaths.cwd, filePath));
    }
  }
  const allFiles = [...filesCreated, ...filesUpdated, ...filesSkipped];
  const updatedFiles = await resolveImports(allFiles, config);
  filesUpdated.push(...updatedFiles);
  filesCreated = Array.from(new Set(filesCreated));
  filesUpdated = Array.from(
    new Set(filesUpdated.filter((file) => !filesCreated.includes(file)))
  );
  filesSkipped = Array.from(new Set(filesSkipped));
  const hasUpdatedFiles = filesCreated.length || filesUpdated.length;
  if (!hasUpdatedFiles && !filesSkipped.length) {
    filesCreatedSpinner?.info("No files updated.");
  }
  if (filesCreated.length) {
    filesCreatedSpinner?.succeed(
      `Created ${filesCreated.length} ${filesCreated.length === 1 ? "file" : "files"}:`
    );
    if (!options.silent) {
      for (const file of filesCreated) {
        logger.log(`  - ${file}`);
      }
    }
  } else {
    filesCreatedSpinner?.stop();
  }
  if (filesUpdated.length) {
    spinner(
      `Updated ${filesUpdated.length} ${filesUpdated.length === 1 ? "file" : "files"}:`,
      {
        silent: options.silent
      }
    )?.info();
    if (!options.silent) {
      for (const file of filesUpdated) {
        logger.log(`  - ${file}`);
      }
    }
  }
  if (filesSkipped.length) {
    spinner(
      `Skipped ${filesSkipped.length} ${filesSkipped.length === 1 ? "file" : "files"}: (files might be identical, use --overwrite to overwrite)`,
      {
        silent: options.silent
      }
    )?.info();
    if (!options.silent) {
      for (const file of filesSkipped) {
        logger.log(`  - ${file}`);
      }
    }
  }
  if (envVarsAdded.length && envFile) {
    spinner(
      `Added the following variables to ${highlighter.info(envFile)}:`
    )?.info();
    if (!options.silent) {
      for (const key of envVarsAdded) {
        logger.log(`  ${highlighter.success("+")} ${key}`);
      }
    }
  }
  return {
    filesCreated,
    filesUpdated,
    filesSkipped
  };
}
function resolveFilePath(file, config, options) {
  if (options.path) {
    const resolvedPath = path4__default.isAbsolute(options.path) ? options.path : path4__default.join(config.resolvedPaths.cwd, options.path);
    const isFilePath = /\.[^/\\]+$/.test(resolvedPath);
    if (isFilePath) {
      if (options.fileIndex === 0) {
        return resolvedPath;
      }
    } else {
      const fileName = path4__default.basename(file.path);
      return path4__default.join(resolvedPath, fileName);
    }
  }
  if (file.target) {
    if (file.target.startsWith("~/")) {
      return path4__default.join(config.resolvedPaths.cwd, file.target.replace("~/", ""));
    }
    let target = file.target;
    if (file.type === "registry:page") {
      target = resolvePageTarget(target, options.framework);
      if (!target) {
        return "";
      }
    }
    return options.isSrcDir ? path4__default.join(config.resolvedPaths.cwd, "src", target.replace("src/", "")) : path4__default.join(config.resolvedPaths.cwd, target.replace("src/", ""));
  }
  const targetDir = resolveFileTargetDirectory(file, config);
  const relativePath = resolveNestedFilePath(file.path, targetDir);
  return path4__default.join(targetDir, relativePath);
}
function resolveFileTargetDirectory(file, config) {
  if (file.type === "registry:ui") {
    return config.resolvedPaths.ui;
  }
  if (file.type === "registry:lib") {
    return config.resolvedPaths.lib;
  }
  if (file.type === "registry:block" || file.type === "registry:component") {
    return config.resolvedPaths.components;
  }
  if (file.type === "registry:hook") {
    return config.resolvedPaths.hooks;
  }
  return config.resolvedPaths.components;
}
function findCommonRoot(paths, needle) {
  const normalizedPaths = paths.map((p) => p.replace(/^\//, ""));
  const normalizedNeedle = needle.replace(/^\//, "");
  const needleDir = normalizedNeedle.split("/").slice(0, -1).join("/");
  if (!needleDir) {
    return "";
  }
  const needleSegments = needleDir.split("/");
  for (let i = needleSegments.length; i > 0; i--) {
    const testPath = needleSegments.slice(0, i).join("/");
    const hasRelatedPaths = normalizedPaths.some(
      (path45) => path45 !== normalizedNeedle && path45.startsWith(testPath + "/")
    );
    if (hasRelatedPaths) {
      return "/" + testPath;
    }
  }
  return "/" + needleDir;
}
function resolveNestedFilePath(filePath, targetDir) {
  const normalizedFilePath = filePath.replace(/^\/|\/$/g, "");
  const normalizedTargetDir = targetDir.replace(/^\/|\/$/g, "");
  const fileSegments = normalizedFilePath.split("/");
  const targetSegments = normalizedTargetDir.split("/");
  const lastTargetSegment = targetSegments[targetSegments.length - 1];
  const commonDirIndex = fileSegments.findIndex(
    (segment) => segment === lastTargetSegment
  );
  if (commonDirIndex === -1) {
    return fileSegments[fileSegments.length - 1];
  }
  return fileSegments.slice(commonDirIndex + 1).join("/");
}
function resolvePageTarget(target, framework) {
  if (!framework) {
    return "";
  }
  if (framework === "next-app") {
    return target;
  }
  if (framework === "next-pages") {
    let result = target.replace(/^app\//, "pages/");
    result = result.replace(/\/page(\.[jt]sx?)$/, "$1");
    return result;
  }
  if (framework === "react-router") {
    let result = target.replace(/^app\//, "app/routes/");
    result = result.replace(/\/page(\.[jt]sx?)$/, "$1");
    return result;
  }
  if (framework === "laravel") {
    let result = target.replace(/^app\//, "resources/js/pages/");
    result = result.replace(/\/page(\.[jt]sx?)$/, "$1");
    return result;
  }
  return "";
}
async function resolveImports(filePaths, config) {
  const project3 = new Project({
    compilerOptions: {}
  });
  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);
  const tsConfig = loadConfig(config.resolvedPaths.cwd);
  const updatedFiles = [];
  if (!projectInfo || tsConfig.resultType === "failed") {
    return [];
  }
  for (const filepath of filePaths) {
    const resolvedPath = path4__default.resolve(config.resolvedPaths.cwd, filepath);
    if (!existsSync(resolvedPath)) {
      continue;
    }
    const content = await promises.readFile(resolvedPath, "utf-8");
    const dir = await promises.mkdtemp(path4__default.join(tmpdir(), "shadcn-"));
    const sourceFile = project3.createSourceFile(
      path4__default.join(dir, basename(resolvedPath)),
      content,
      {
        scriptKind: ScriptKind.TSX
      }
    );
    if (![".tsx", ".ts", ".jsx", ".js"].includes(sourceFile.getExtension())) {
      continue;
    }
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDeclaration of importDeclarations) {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      if (projectInfo?.aliasPrefix && !moduleSpecifier.startsWith(`${projectInfo.aliasPrefix}/`)) {
        continue;
      }
      const probableImportFilePath = await resolveImport(
        moduleSpecifier,
        tsConfig
      );
      if (!probableImportFilePath) {
        continue;
      }
      const resolvedImportFilePath = resolveModuleByProbablePath(
        probableImportFilePath,
        filePaths,
        config
      );
      if (!resolvedImportFilePath) {
        continue;
      }
      const newImport = toAliasedImport(
        resolvedImportFilePath,
        config,
        projectInfo
      );
      if (!newImport || newImport === moduleSpecifier) {
        continue;
      }
      importDeclaration.setModuleSpecifier(newImport);
      await promises.writeFile(resolvedPath, sourceFile.getFullText(), "utf-8");
      updatedFiles.push(filepath);
    }
  }
  return updatedFiles;
}
function resolveModuleByProbablePath(probableImportFilePath, files, config, extensions = [".tsx", ".ts", ".js", ".jsx", ".css"]) {
  const cwd = path4__default.normalize(config.resolvedPaths.cwd);
  const relativeFiles = files.map((f) => f.split(path4__default.sep).join(path4__default.posix.sep));
  const fileSet = new Set(relativeFiles);
  const extInPath = path4__default.extname(probableImportFilePath);
  const hasExt = extInPath !== "";
  const absBase = hasExt ? probableImportFilePath.slice(0, -extInPath.length) : probableImportFilePath;
  const relBaseRaw = path4__default.relative(cwd, absBase);
  const relBase = relBaseRaw.split(path4__default.sep).join(path4__default.posix.sep);
  const tryExts = hasExt ? [extInPath] : extensions;
  const candidates = /* @__PURE__ */ new Set();
  for (const e of tryExts) {
    const absCand = absBase + e;
    const relCand = path4__default.posix.normalize(path4__default.relative(cwd, absCand));
    if (fileSet.has(relCand) || existsSync(absCand)) {
      candidates.add(relCand);
    }
    const absIdx = path4__default.join(absBase, `index${e}`);
    const relIdx = path4__default.posix.normalize(path4__default.relative(cwd, absIdx));
    if (fileSet.has(relIdx) || existsSync(absIdx)) {
      candidates.add(relIdx);
    }
  }
  const name = path4__default.basename(absBase);
  for (const f of relativeFiles) {
    if (tryExts.some((e) => f.endsWith(`/${name}${e}`))) {
      candidates.add(f);
    }
  }
  if (candidates.size === 0) return null;
  const sorted = Array.from(candidates).sort((a, b) => {
    const aExt = path4__default.posix.extname(a);
    const bExt = path4__default.posix.extname(b);
    const ord = tryExts.indexOf(aExt) - tryExts.indexOf(bExt);
    if (ord !== 0) return ord;
    const aStrong = relBase && a.startsWith(relBase) ? -1 : 1;
    const bStrong = relBase && b.startsWith(relBase) ? -1 : 1;
    return aStrong - bStrong;
  });
  return sorted[0];
}
function toAliasedImport(filePath, config, projectInfo) {
  const abs = path4__default.normalize(path4__default.join(config.resolvedPaths.cwd, filePath));
  const matches = Object.entries(config.resolvedPaths).filter(
    ([, root]) => root && abs.startsWith(path4__default.normalize(root + path4__default.sep))
  ).sort((a, b) => b[1].length - a[1].length);
  if (matches.length === 0) {
    return null;
  }
  const [aliasKey, rootDir] = matches[0];
  let rel = path4__default.relative(rootDir, abs);
  rel = rel.split(path4__default.sep).join("/");
  const ext = path4__default.posix.extname(rel);
  const codeExts = [".ts", ".tsx", ".js", ".jsx"];
  const keepExt = codeExts.includes(ext) ? "" : ext;
  let noExt = rel.slice(0, rel.length - ext.length);
  if (noExt.endsWith("/index")) {
    noExt = noExt.slice(0, -"/index".length);
  }
  const aliasBase = aliasKey === "cwd" ? projectInfo.aliasPrefix : config.aliases[aliasKey];
  if (!aliasBase) {
    return null;
  }
  let suffix = noExt === "" ? "" : `/${noExt}`;
  suffix = suffix.replace("/src", "");
  return `${aliasBase}${suffix}${keepExt}`;
}
function _isNext16Middleware(filePath, projectInfo, config) {
  const isRootMiddleware = filePath === path4__default.join(config.resolvedPaths.cwd, "middleware.ts") || filePath === path4__default.join(config.resolvedPaths.cwd, "middleware.js");
  const isNextJs = projectInfo?.framework.name === "next-app" || projectInfo?.framework.name === "next-pages";
  if (!isRootMiddleware || !isNextJs || !projectInfo?.frameworkVersion) {
    return false;
  }
  const majorVersion = parseInt(projectInfo.frameworkVersion.split(".")[0]);
  const isNext16Plus = !isNaN(majorVersion) && majorVersion >= 16;
  return isNext16Plus;
}
new Project({
  compilerOptions: {}
});
function isUrl(path45) {
  try {
    new URL(path45);
    return true;
  } catch (error) {
    return false;
  }
}
function isLocalFile(path45) {
  return path45.endsWith(".json") && !isUrl(path45);
}
function isUniversalRegistryItem(registryItem) {
  if (!registryItem) {
    return false;
  }
  if (registryItem.type !== "registry:item" && registryItem.type !== "registry:file") {
    return false;
  }
  const files = registryItem.files ?? [];
  return files.every(
    (file) => !!file.target && (file.type === "registry:file" || file.type === "registry:item")
  );
}
async function deduplicateFilesByTarget(filesArrays, config) {
  if (!canDeduplicateFiles(config)) {
    return z.array(registryItemFileSchema).parse(filesArrays.flat().filter(Boolean));
  }
  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);
  const targetMap = /* @__PURE__ */ new Map();
  const allFiles = z.array(registryItemFileSchema).parse(filesArrays.flat().filter(Boolean));
  allFiles.forEach((file) => {
    const resolvedPath = resolveFilePath(file, config, {
      isSrcDir: projectInfo?.isSrcDir,
      framework: projectInfo?.framework.name,
      commonRoot: findCommonRoot(
        allFiles.map((f) => f.path),
        file.path
      )
    });
    if (resolvedPath) {
      targetMap.set(resolvedPath, file);
    }
  });
  return Array.from(targetMap.values());
}
function canDeduplicateFiles(config) {
  return !!(config?.resolvedPaths?.cwd && (config?.resolvedPaths?.ui || config?.resolvedPaths?.lib || config?.resolvedPaths?.components || config?.resolvedPaths?.hooks));
}
var DEFAULT_COMPONENTS = "@/components";
var DEFAULT_UTILS = "@/lib/utils";
var DEFAULT_TAILWIND_CSS = "app/globals.css";
var DEFAULT_TAILWIND_CONFIG = "tailwind.config.js";
var explorer = cosmiconfig("components", {
  searchPlaces: ["components.json"]
});
async function getConfig(cwd) {
  const config = await getRawConfig(cwd);
  if (!config) {
    return null;
  }
  if (!config.iconLibrary) {
    config.iconLibrary = config.style === "new-york" ? "radix" : "lucide";
  }
  return await resolveConfigPaths(cwd, config);
}
async function resolveConfigPaths(cwd, config) {
  config.registries = {
    ...BUILTIN_REGISTRIES,
    ...config.registries || {}
  };
  const tsConfig = await loadConfig(cwd);
  if (tsConfig.resultType === "failed") {
    throw new Error(
      `Failed to load ${config.tsx ? "tsconfig" : "jsconfig"}.json. ${tsConfig.message ?? ""}`.trim()
    );
  }
  return configSchema.parse({
    ...config,
    resolvedPaths: {
      cwd,
      tailwindConfig: config.tailwind.config ? path4__default.resolve(cwd, config.tailwind.config) : "",
      tailwindCss: path4__default.resolve(cwd, config.tailwind.css),
      utils: await resolveImport(config.aliases["utils"], tsConfig),
      components: await resolveImport(config.aliases["components"], tsConfig),
      ui: config.aliases["ui"] ? await resolveImport(config.aliases["ui"], tsConfig) : path4__default.resolve(
        await resolveImport(config.aliases["components"], tsConfig) ?? cwd,
        "ui"
      ),
      // TODO: Make this configurable.
      // For now, we assume the lib and hooks directories are one level up from the components directory.
      lib: config.aliases["lib"] ? await resolveImport(config.aliases["lib"], tsConfig) : path4__default.resolve(
        await resolveImport(config.aliases["utils"], tsConfig) ?? cwd,
        ".."
      ),
      hooks: config.aliases["hooks"] ? await resolveImport(config.aliases["hooks"], tsConfig) : path4__default.resolve(
        await resolveImport(config.aliases["components"], tsConfig) ?? cwd,
        "..",
        "hooks"
      )
    }
  });
}
async function getRawConfig(cwd) {
  try {
    const configResult = await explorer.search(cwd);
    if (!configResult) {
      return null;
    }
    const config = rawConfigSchema.parse(configResult.config);
    if (config.registries) {
      for (const registryName of Object.keys(config.registries)) {
        if (registryName in BUILTIN_REGISTRIES) {
          throw new Error(
            `"${registryName}" is a built-in registry and cannot be overridden.`
          );
        }
      }
    }
    return config;
  } catch (error) {
    const componentPath = `${cwd}/components.json`;
    if (error instanceof Error && error.message.includes("reserved registry")) {
      throw error;
    }
    throw new Error(
      `Invalid configuration found in ${highlighter.info(componentPath)}.`
    );
  }
}
async function getWorkspaceConfig(config) {
  let resolvedAliases = {};
  for (const key of Object.keys(config.aliases)) {
    if (!isAliasKey(key, config)) {
      continue;
    }
    const resolvedPath = config.resolvedPaths[key];
    const packageRoot = await findPackageRoot(
      config.resolvedPaths.cwd,
      resolvedPath
    );
    if (!packageRoot) {
      resolvedAliases[key] = config;
      continue;
    }
    resolvedAliases[key] = await getConfig(packageRoot);
  }
  const result = workspaceConfigSchema.safeParse(resolvedAliases);
  if (!result.success) {
    return null;
  }
  return result.data;
}
async function findPackageRoot(cwd, resolvedPath) {
  const commonRoot = findCommonRoot2(cwd, resolvedPath);
  const relativePath = path4__default.relative(commonRoot, resolvedPath);
  const packageRoots = await fg3.glob("**/package.json", {
    cwd: commonRoot,
    deep: 3,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/public/**"]
  });
  const matchingPackageRoot = packageRoots.map((pkgPath) => path4__default.dirname(pkgPath)).find((pkgDir) => relativePath.startsWith(pkgDir));
  return matchingPackageRoot ? path4__default.join(commonRoot, matchingPackageRoot) : null;
}
function isAliasKey(key, config) {
  return Object.keys(config.resolvedPaths).filter((key2) => key2 !== "utils").includes(key);
}
function findCommonRoot2(cwd, resolvedPath) {
  const parts1 = cwd.split(path4__default.sep);
  const parts2 = resolvedPath.split(path4__default.sep);
  const commonParts = [];
  for (let i = 0; i < Math.min(parts1.length, parts2.length); i++) {
    if (parts1[i] !== parts2[i]) {
      break;
    }
    commonParts.push(parts1[i]);
  }
  return commonParts.join(path4__default.sep);
}
async function getTargetStyleFromConfig(cwd, fallback) {
  const projectInfo = await getProjectInfo(cwd);
  return projectInfo?.tailwindVersion === "v4" ? "new-york-v4" : fallback;
}
function getBase(style) {
  return style?.startsWith("base-") ? "base" : "radix";
}
function createConfig(partial) {
  const defaultConfig = {
    resolvedPaths: {
      cwd: process.cwd(),
      tailwindConfig: "",
      tailwindCss: "",
      utils: "",
      components: "",
      ui: "",
      lib: "",
      hooks: ""
    },
    style: "",
    tailwind: {
      config: "",
      css: "",
      baseColor: "",
      cssVariables: false
    },
    rsc: false,
    tsx: true,
    aliases: {
      components: "",
      utils: ""
    },
    registries: {
      ...BUILTIN_REGISTRIES
    }
  };
  if (partial) {
    return {
      ...defaultConfig,
      ...partial,
      resolvedPaths: {
        ...defaultConfig.resolvedPaths,
        ...partial.resolvedPaths || {}
      },
      tailwind: {
        ...defaultConfig.tailwind,
        ...partial.tailwind || {}
      },
      aliases: {
        ...defaultConfig.aliases,
        ...partial.aliases || {}
      },
      registries: {
        ...defaultConfig.registries,
        ...partial.registries || {}
      }
    };
  }
  return defaultConfig;
}
function resolveStyleFromConfig(config) {
  if (!config.style) {
    return FALLBACK_STYLE;
  }
  if (config.style === "new-york" && config.tailwind?.config === "") {
    return FALLBACK_STYLE;
  }
  return config.style;
}
function configWithDefaults(config) {
  const baseConfig = createConfig({
    style: FALLBACK_STYLE,
    registries: BUILTIN_REGISTRIES
  });
  if (!config) {
    return baseConfig;
  }
  return configSchema.parse(
    deepmerge3(baseConfig, {
      ...config,
      style: resolveStyleFromConfig(config),
      registries: { ...BUILTIN_REGISTRIES, ...config.registries }
    })
  );
}

// src/registry/context.ts
var context = {
  headers: {}
};
function setRegistryHeaders(headers) {
  context.headers = { ...context.headers, ...headers };
}
function getRegistryHeadersFromContext(url) {
  return context.headers[url] || {};
}
function clearRegistryContext() {
  context.headers = {};
}

// src/registry/validator.ts
function extractEnvVarsFromRegistryConfig(config) {
  const vars = /* @__PURE__ */ new Set();
  if (typeof config === "string") {
    extractEnvVars(config).forEach((v) => vars.add(v));
  } else {
    extractEnvVars(config.url).forEach((v) => vars.add(v));
    if (config.params) {
      Object.values(config.params).forEach((value) => {
        extractEnvVars(value).forEach((v) => vars.add(v));
      });
    }
    if (config.headers) {
      Object.values(config.headers).forEach((value) => {
        extractEnvVars(value).forEach((v) => vars.add(v));
      });
    }
  }
  return Array.from(vars);
}
function validateRegistryConfig(registryName, config) {
  const requiredVars = extractEnvVarsFromRegistryConfig(config);
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new RegistryMissingEnvironmentVariablesError(registryName, missing);
  }
}
function validateRegistryConfigForItems(items, config) {
  for (const item of items) {
    buildUrlAndHeadersForRegistryItem(item, configWithDefaults(config));
  }
  clearRegistryContext();
}

// src/registry/builder.ts
var NAME_PLACEHOLDER = "{name}";
var STYLE_PLACEHOLDER = "{style}";
var ENV_VAR_PATTERN = /\${(\w+)}/g;
var QUERY_PARAM_SEPARATOR = "?";
var QUERY_PARAM_DELIMITER = "&";
function isLocalPath(path45) {
  return path45.startsWith("./") || path45.startsWith("/");
}
function buildUrlAndHeadersForRegistryItem(name, config) {
  let { registry: registry2, item } = parseRegistryAndItemFromString(name);
  if (!registry2) {
    if (isUrl(name) || isLocalFile(name) || isLocalPath(name)) {
      return null;
    }
    registry2 = "@shadcn";
  }
  const registries = { ...BUILTIN_REGISTRIES, ...config?.registries };
  const registryConfig = registries[registry2];
  if (!registryConfig) {
    throw new RegistryNotConfiguredError(registry2);
  }
  validateRegistryConfig(registry2, registryConfig);
  return {
    url: buildUrlFromRegistryConfig(item, registryConfig, config),
    headers: buildHeadersFromRegistryConfig(registryConfig)
  };
}
function buildUrlFromRegistryConfig(item, registryConfig, config) {
  if (typeof registryConfig === "string") {
    let url = registryConfig.replace(NAME_PLACEHOLDER, item);
    if (config?.style && url.includes(STYLE_PLACEHOLDER)) {
      url = url.replace(STYLE_PLACEHOLDER, config.style);
    }
    return expandEnvVars(url);
  }
  let baseUrl = registryConfig.url.replace(NAME_PLACEHOLDER, item);
  if (config?.style && baseUrl.includes(STYLE_PLACEHOLDER)) {
    baseUrl = baseUrl.replace(STYLE_PLACEHOLDER, config.style);
  }
  baseUrl = expandEnvVars(baseUrl);
  if (!registryConfig.params) {
    return baseUrl;
  }
  return appendQueryParams(baseUrl, registryConfig.params);
}
function buildHeadersFromRegistryConfig(config) {
  if (typeof config === "string" || !config.headers) {
    return {};
  }
  const headers = {};
  for (const [key, value] of Object.entries(config.headers)) {
    const expandedValue = expandEnvVars(value);
    if (shouldIncludeHeader(value, expandedValue)) {
      headers[key] = expandedValue;
    }
  }
  return headers;
}
function appendQueryParams(baseUrl, params) {
  const urlParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const expandedValue = expandEnvVars(value);
    if (expandedValue) {
      urlParams.append(key, expandedValue);
    }
  }
  const queryString = urlParams.toString();
  if (!queryString) {
    return baseUrl;
  }
  const separator = baseUrl.includes(QUERY_PARAM_SEPARATOR) ? QUERY_PARAM_DELIMITER : QUERY_PARAM_SEPARATOR;
  return `${baseUrl}${separator}${queryString}`;
}
function shouldIncludeHeader(originalValue, expandedValue) {
  const trimmedExpanded = expandedValue.trim();
  if (!trimmedExpanded) {
    return false;
  }
  if (originalValue.includes("${")) {
    const envVars = originalValue.match(ENV_VAR_PATTERN);
    if (envVars) {
      const templateWithoutVars = originalValue.replace(ENV_VAR_PATTERN, "").trim();
      return trimmedExpanded !== templateWithoutVars;
    }
  }
  return true;
}
function resolveRegistryUrl(pathOrUrl) {
  if (isUrl(pathOrUrl)) {
    const url = new URL(pathOrUrl);
    if (url.pathname.match(/\/chat\/b\//) && !url.pathname.endsWith("/json")) {
      url.pathname = `${url.pathname}/json`;
    }
    return url.toString();
  }
  return `${REGISTRY_URL}/${pathOrUrl}`;
}
var agent = process.env.https_proxy ? new HttpsProxyAgent(process.env.https_proxy) : void 0;
var registryCache = /* @__PURE__ */ new Map();
async function fetchRegistry(paths, options = {}) {
  options = {
    useCache: true,
    ...options
  };
  try {
    const results = await Promise.all(
      paths.map(async (path45) => {
        const url = resolveRegistryUrl(path45);
        if (options.useCache && registryCache.has(url)) {
          return registryCache.get(url);
        }
        const fetchPromise = (async () => {
          const headers = getRegistryHeadersFromContext(url);
          const requestHeaders = new Headers({
            Accept: "application/vnd.shadcn.v1+json, application/json;q=0.9",
            "User-Agent": "shadcn"
          });
          for (const [key, value] of Object.entries(headers)) {
            requestHeaders.set(key, value);
          }
          const response = await fetch(url, {
            agent,
            headers: requestHeaders
          });
          if (!response.ok) {
            let messageFromServer = void 0;
            if (response.headers.get("content-type")?.includes("application/json")) {
              const json = await response.json();
              const parsed = z.object({
                // RFC 7807.
                detail: z.string().optional(),
                title: z.string().optional(),
                // Standard error response.
                message: z.string().optional(),
                error: z.string().optional()
              }).safeParse(json);
              if (parsed.success) {
                messageFromServer = parsed.data.detail || parsed.data.message;
                if (parsed.data.error) {
                  messageFromServer = `[${parsed.data.error}] ${messageFromServer}`;
                }
              }
            }
            if (response.status === 401) {
              throw new RegistryUnauthorizedError(url, messageFromServer);
            }
            if (response.status === 404) {
              throw new RegistryNotFoundError(url, messageFromServer);
            }
            if (response.status === 410) {
              throw new RegistryGoneError(url, messageFromServer);
            }
            if (response.status === 403) {
              throw new RegistryForbiddenError(url, messageFromServer);
            }
            throw new RegistryFetchError(
              url,
              response.status,
              messageFromServer
            );
          }
          return response.json();
        })();
        if (options.useCache) {
          registryCache.set(url, fetchPromise);
        }
        return fetchPromise;
      })
    );
    return results;
  } catch (error) {
    throw error;
  }
}
async function fetchRegistryLocal(filePath) {
  try {
    let expandedPath = filePath;
    if (filePath.startsWith("~/")) {
      expandedPath = path4__default.join(homedir(), filePath.slice(2));
    }
    const resolvedPath = path4__default.resolve(expandedPath);
    const content = await promises.readFile(resolvedPath, "utf8");
    const parsed = JSON.parse(content);
    try {
      return registryItemSchema.parse(parsed);
    } catch (error) {
      throw new RegistryParseError(filePath, error);
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes("ENOENT") || error.message.includes("no such file"))) {
      throw new RegistryLocalFileError(filePath, error);
    }
    if (error instanceof RegistryParseError) {
      throw error;
    }
    throw new RegistryLocalFileError(filePath, error);
  }
}
async function updateTailwindConfig(tailwindConfig, config, options) {
  if (!tailwindConfig) {
    return;
  }
  options = {
    silent: false,
    tailwindVersion: "v3",
    ...options
  };
  if (options.tailwindVersion === "v4") {
    return;
  }
  const tailwindFileRelativePath = path4__default.relative(
    config.resolvedPaths.cwd,
    config.resolvedPaths.tailwindConfig
  );
  const tailwindSpinner = spinner(
    `Updating ${highlighter.info(tailwindFileRelativePath)}`,
    {
      silent: options.silent
    }
  ).start();
  const raw = await promises.readFile(config.resolvedPaths.tailwindConfig, "utf8");
  const output = await transformTailwindConfig(raw, tailwindConfig, config);
  await promises.writeFile(config.resolvedPaths.tailwindConfig, output, "utf8");
  tailwindSpinner?.succeed();
}
async function transformTailwindConfig(input, tailwindConfig, config) {
  const sourceFile = await _createSourceFile(input, config);
  const configObject = sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression).find(
    (node) => node.getProperties().some(
      (property) => property.isKind(SyntaxKind.PropertyAssignment) && property.getName() === "content"
    )
  );
  if (!configObject) {
    return input;
  }
  const quoteChar = _getQuoteChar(configObject);
  addTailwindConfigProperty(
    configObject,
    {
      name: "darkMode",
      value: "class"
    },
    { quoteChar }
  );
  tailwindConfig.plugins?.forEach((plugin) => {
    addTailwindConfigPlugin(configObject, plugin);
  });
  if (tailwindConfig.theme) {
    await addTailwindConfigTheme(configObject, tailwindConfig.theme);
  }
  return sourceFile.getFullText();
}
function addTailwindConfigProperty(configObject, property, {
  quoteChar
}) {
  const existingProperty = configObject.getProperty("darkMode");
  if (!existingProperty) {
    const newProperty = {
      name: property.name,
      initializer: `[${quoteChar}${property.value}${quoteChar}]`
    };
    if (property.name === "darkMode") {
      configObject.insertPropertyAssignment(0, newProperty);
      return configObject;
    }
    configObject.addPropertyAssignment(newProperty);
    return configObject;
  }
  if (existingProperty.isKind(SyntaxKind.PropertyAssignment)) {
    const initializer = existingProperty.getInitializer();
    const newValue = `${quoteChar}${property.value}${quoteChar}`;
    if (initializer?.isKind(SyntaxKind.StringLiteral)) {
      const initializerText = initializer.getText();
      initializer.replaceWithText(`[${initializerText}, ${newValue}]`);
      return configObject;
    }
    if (initializer?.isKind(SyntaxKind.ArrayLiteralExpression)) {
      if (initializer.getElements().map((element) => element.getText()).includes(newValue)) {
        return configObject;
      }
      initializer.addElement(newValue);
    }
    return configObject;
  }
  return configObject;
}
async function addTailwindConfigTheme(configObject, theme) {
  if (!configObject.getProperty("theme")) {
    configObject.addPropertyAssignment({
      name: "theme",
      initializer: "{}"
    });
  }
  nestSpreadProperties(configObject);
  const themeProperty = configObject.getPropertyOrThrow("theme")?.asKindOrThrow(SyntaxKind.PropertyAssignment);
  const themeInitializer = themeProperty.getInitializer();
  if (themeInitializer?.isKind(SyntaxKind.ObjectLiteralExpression)) {
    const themeObjectString = themeInitializer.getText();
    const themeObject = await parseObjectLiteral(themeObjectString);
    const result = deepmerge3(themeObject, theme, {
      arrayMerge: (dst, src) => src
    });
    const resultString = objectToString(result).replace(/\'\.\.\.(.*)\'/g, "...$1").replace(/\'\"/g, "'").replace(/\"\'/g, "'").replace(/\'\[/g, "[").replace(/\]\'/g, "]").replace(/\'\\\'/g, "'").replace(/\\\'/g, "'").replace(/\\\'\'/g, "'").replace(/\'\'/g, "'");
    themeInitializer.replaceWithText(resultString);
  }
  unnestSpreadProperties(configObject);
}
function addTailwindConfigPlugin(configObject, plugin) {
  const existingPlugins = configObject.getProperty("plugins");
  if (!existingPlugins) {
    configObject.addPropertyAssignment({
      name: "plugins",
      initializer: `[${plugin}]`
    });
    return configObject;
  }
  if (existingPlugins.isKind(SyntaxKind.PropertyAssignment)) {
    const initializer = existingPlugins.getInitializer();
    if (initializer?.isKind(SyntaxKind.ArrayLiteralExpression)) {
      if (initializer.getElements().map((element) => {
        return element.getText().replace(/["']/g, "");
      }).includes(plugin.replace(/["']/g, ""))) {
        return configObject;
      }
      initializer.addElement(plugin);
    }
    return configObject;
  }
  return configObject;
}
async function _createSourceFile(input, config) {
  const dir = await promises.mkdtemp(path4__default.join(tmpdir(), "shadcn-"));
  const resolvedPath = config?.resolvedPaths?.tailwindConfig || "tailwind.config.ts";
  const tempFile = path4__default.join(dir, `shadcn-${path4__default.basename(resolvedPath)}`);
  const project3 = new Project({
    compilerOptions: {}
  });
  const sourceFile = project3.createSourceFile(tempFile, input, {
    // Note: .js and .mjs can still be valid for TS projects.
    // We can't infer TypeScript from config.tsx.
    scriptKind: path4__default.extname(resolvedPath) === ".ts" ? ScriptKind.TS : ScriptKind.JS
  });
  return sourceFile;
}
function _getQuoteChar(configObject) {
  return configObject.getFirstDescendantByKind(SyntaxKind.StringLiteral)?.getQuoteKind() === QuoteKind.Single ? "'" : '"';
}
function nestSpreadProperties(obj) {
  const properties = obj.getProperties();
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (prop.isKind(SyntaxKind.SpreadAssignment)) {
      const spreadAssignment = prop.asKindOrThrow(SyntaxKind.SpreadAssignment);
      const spreadText = spreadAssignment.getExpression().getText();
      obj.insertPropertyAssignment(i, {
        // Need to escape the name with " so that deepmerge doesn't mishandle the key
        name: `"___${spreadText.replace(/^\.\.\./, "")}"`,
        initializer: `"...${spreadText.replace(/^\.\.\./, "")}"`
      });
      spreadAssignment.remove();
    } else if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const propAssignment = prop.asKindOrThrow(SyntaxKind.PropertyAssignment);
      const initializer = propAssignment.getInitializer();
      if (initializer && initializer.isKind(SyntaxKind.ObjectLiteralExpression)) {
        nestSpreadProperties(
          initializer.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        );
      } else if (initializer && initializer.isKind(SyntaxKind.ArrayLiteralExpression)) {
        nestSpreadElements(
          initializer.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
        );
      }
    }
  }
}
function nestSpreadElements(arr) {
  const elements = arr.getElements();
  for (let j = 0; j < elements.length; j++) {
    const element = elements[j];
    if (element.isKind(SyntaxKind.ObjectLiteralExpression)) {
      nestSpreadProperties(
        element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      );
    } else if (element.isKind(SyntaxKind.ArrayLiteralExpression)) {
      nestSpreadElements(
        element.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
      );
    } else if (element.isKind(SyntaxKind.SpreadElement)) {
      const spreadText = element.getText();
      arr.removeElement(j);
      arr.insertElement(j, `"${spreadText}"`);
    }
  }
}
function unnestSpreadProperties(obj) {
  const properties = obj.getProperties();
  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    if (prop.isKind(SyntaxKind.PropertyAssignment)) {
      const propAssignment = prop;
      const initializer = propAssignment.getInitializer();
      if (initializer && initializer.isKind(SyntaxKind.StringLiteral)) {
        const value = initializer.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
        if (value.startsWith("...")) {
          obj.insertSpreadAssignment(i, { expression: value.slice(3) });
          propAssignment.remove();
        }
      } else if (initializer?.isKind(SyntaxKind.ObjectLiteralExpression)) {
        unnestSpreadProperties(initializer);
      } else if (initializer && initializer.isKind(SyntaxKind.ArrayLiteralExpression)) {
        unsetSpreadElements(
          initializer.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
        );
      }
    }
  }
}
function unsetSpreadElements(arr) {
  const elements = arr.getElements();
  for (let j = 0; j < elements.length; j++) {
    const element = elements[j];
    if (element.isKind(SyntaxKind.ObjectLiteralExpression)) {
      unnestSpreadProperties(
        element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
      );
    } else if (element.isKind(SyntaxKind.ArrayLiteralExpression)) {
      unsetSpreadElements(
        element.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
      );
    } else if (element.isKind(SyntaxKind.StringLiteral)) {
      const spreadText = element.getText();
      const spreadTest = /(?:^['"])(\.\.\..*)(?:['"]$)/g;
      if (spreadTest.test(spreadText)) {
        arr.removeElement(j);
        arr.insertElement(j, spreadText.replace(spreadTest, "$1"));
      }
    }
  }
}
async function parseObjectLiteral(objectLiteralString) {
  const sourceFile = await _createSourceFile(
    `const theme = ${objectLiteralString}`,
    null
  );
  const statement = sourceFile.getStatements()[0];
  if (statement?.getKind() === SyntaxKind.VariableStatement) {
    const declaration = statement.getDeclarationList()?.getDeclarations()[0];
    const initializer = declaration.getInitializer();
    if (initializer?.isKind(SyntaxKind.ObjectLiteralExpression)) {
      return await parseObjectLiteralExpression(initializer);
    }
  }
  throw new Error("Invalid input: not an object literal");
}
function parseObjectLiteralExpression(node) {
  const result = {};
  for (const property of node.getProperties()) {
    if (property.isKind(SyntaxKind.PropertyAssignment)) {
      const name = property.getName().replace(/\'/g, "");
      if (property.getInitializer()?.isKind(SyntaxKind.ObjectLiteralExpression)) {
        result[name] = parseObjectLiteralExpression(
          property.getInitializer()
        );
      } else if (property.getInitializer()?.isKind(SyntaxKind.ArrayLiteralExpression)) {
        result[name] = parseArrayLiteralExpression(
          property.getInitializer()
        );
      } else {
        result[name] = parseValue(property.getInitializer());
      }
    }
  }
  return result;
}
function parseArrayLiteralExpression(node) {
  const result = [];
  for (const element of node.getElements()) {
    if (element.isKind(SyntaxKind.ObjectLiteralExpression)) {
      result.push(
        parseObjectLiteralExpression(
          element.asKindOrThrow(SyntaxKind.ObjectLiteralExpression)
        )
      );
    } else if (element.isKind(SyntaxKind.ArrayLiteralExpression)) {
      result.push(
        parseArrayLiteralExpression(
          element.asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
        )
      );
    } else {
      result.push(parseValue(element));
    }
  }
  return result;
}
function parseValue(node) {
  switch (node.getKind()) {
    case SyntaxKind.StringLiteral:
      return node.getText();
    case SyntaxKind.NumericLiteral:
      return Number(node.getText());
    case SyntaxKind.TrueKeyword:
      return true;
    case SyntaxKind.FalseKeyword:
      return false;
    case SyntaxKind.NullKeyword:
      return null;
    case SyntaxKind.ArrayLiteralExpression:
      return node.getElements().map(parseValue);
    case SyntaxKind.ObjectLiteralExpression:
      return parseObjectLiteralExpression(node);
    default:
      return node.getText();
  }
}
function buildTailwindThemeColorsFromCssVars(cssVars) {
  const result = {};
  for (const key of Object.keys(cssVars)) {
    const parts = key.split("-");
    const colorName = parts[0];
    const subType = parts.slice(1).join("-");
    if (subType === "") {
      if (typeof result[colorName] === "object") {
        result[colorName].DEFAULT = `hsl(var(--${key}))`;
      } else {
        result[colorName] = `hsl(var(--${key}))`;
      }
    } else {
      if (typeof result[colorName] !== "object") {
        result[colorName] = { DEFAULT: `hsl(var(--${colorName}))` };
      }
      result[colorName][subType] = `hsl(var(--${key}))`;
    }
  }
  for (const [colorName, value] of Object.entries(result)) {
    if (typeof value === "object" && value.DEFAULT === `hsl(var(--${colorName}))` && !(colorName in cssVars)) {
      delete value.DEFAULT;
    }
  }
  return result;
}
function resolveRegistryItemsFromRegistries(items, config) {
  const registryHeaders = {};
  const resolvedItems = [...items];
  if (!config?.registries) {
    setRegistryHeaders({});
    return resolvedItems;
  }
  for (let i = 0; i < resolvedItems.length; i++) {
    const resolved = buildUrlAndHeadersForRegistryItem(resolvedItems[i], config);
    if (resolved) {
      resolvedItems[i] = resolved.url;
      if (Object.keys(resolved.headers).length > 0) {
        registryHeaders[resolved.url] = resolved.headers;
      }
    }
  }
  setRegistryHeaders(registryHeaders);
  return resolvedItems;
}
async function fetchRegistryItems(items, config, options = {}) {
  const results = await Promise.all(
    items.map(async (item) => {
      if (isLocalFile(item)) {
        return fetchRegistryLocal(item);
      }
      if (isUrl(item)) {
        const [result2] = await fetchRegistry([item], options);
        try {
          return registryItemSchema.parse(result2);
        } catch (error) {
          throw new RegistryParseError(item, error);
        }
      }
      if (item.startsWith("@") && config?.registries) {
        const paths = resolveRegistryItemsFromRegistries([item], config);
        const [result2] = await fetchRegistry(paths, options);
        try {
          return registryItemSchema.parse(result2);
        } catch (error) {
          throw new RegistryParseError(item, error);
        }
      }
      const path45 = `styles/${config?.style ?? "new-york-v4"}/${item}.json`;
      const [result] = await fetchRegistry([path45], options);
      try {
        return registryItemSchema.parse(result);
      } catch (error) {
        throw new RegistryParseError(item, error);
      }
    })
  );
  return results;
}
registryItemCommonSchema.extend({
  type: registryItemTypeSchema,
  _source: z.string().optional(),
  // Optional fields for specific item types.
  font: registryItemFontSchema.optional(),
  config: z.any().optional()
}).passthrough();
async function resolveRegistryTree(names, config, options = {}) {
  options = {
    useCache: true,
    ...options
  };
  let payload = [];
  let allDependencyItems = [];
  let allDependencyRegistryNames = [];
  const uniqueNames = Array.from(new Set(names));
  const results = await fetchRegistryItems(uniqueNames, config, options);
  const resultMap = /* @__PURE__ */ new Map();
  for (let i = 0; i < results.length; i++) {
    if (results[i]) {
      resultMap.set(uniqueNames[i], results[i]);
    }
  }
  for (const [sourceName, item] of Array.from(resultMap.entries())) {
    const itemWithSource = {
      ...item,
      _source: sourceName
    };
    payload.push(itemWithSource);
    if (item.registryDependencies) {
      let resolvedDependencies = item.registryDependencies;
      if (!config?.registries) {
        const namespacedDeps = item.registryDependencies.filter(
          (dep) => dep.startsWith("@")
        );
        if (namespacedDeps.length > 0) {
          const { registry: registry2 } = parseRegistryAndItemFromString(namespacedDeps[0]);
          throw new RegistryNotConfiguredError(registry2);
        }
      } else {
        resolvedDependencies = resolveRegistryItemsFromRegistries(
          item.registryDependencies,
          config
        );
      }
      const { items, registryNames } = await resolveDependenciesRecursively(
        resolvedDependencies,
        config,
        options,
        new Set(uniqueNames)
      );
      allDependencyItems.push(...items);
      allDependencyRegistryNames.push(...registryNames);
    }
  }
  payload.push(...allDependencyItems);
  if (allDependencyRegistryNames.length > 0) {
    const uniqueRegistryNames = Array.from(new Set(allDependencyRegistryNames));
    const nonNamespacedItems = uniqueRegistryNames.filter(
      (name) => !name.startsWith("@")
    );
    const namespacedDepItems = uniqueRegistryNames.filter(
      (name) => name.startsWith("@")
    );
    if (namespacedDepItems.length > 0) {
      const depResults = await fetchRegistryItems(
        namespacedDepItems,
        config,
        options
      );
      for (let i = 0; i < depResults.length; i++) {
        const item = depResults[i];
        const itemWithSource = {
          ...item,
          _source: namespacedDepItems[i]
        };
        payload.push(itemWithSource);
      }
    }
    if (nonNamespacedItems.length > 0) {
      const index = await getShadcnRegistryIndex();
      if (!index && payload.length === 0) {
        return null;
      }
      if (index) {
        if (nonNamespacedItems.includes("index")) {
          nonNamespacedItems.unshift("index");
        }
        const registryUrls = [];
        for (const name of nonNamespacedItems) {
          const itemDependencies = await resolveRegistryDependencies(
            name,
            config,
            options
          );
          registryUrls.push(...itemDependencies);
        }
        const uniqueUrls = Array.from(new Set(registryUrls));
        let result = await fetchRegistry(uniqueUrls, options);
        const registryPayload = z.array(registryItemSchema).parse(result);
        payload.push(...registryPayload);
      }
    }
  }
  if (!payload.length) {
    return null;
  }
  if (uniqueNames.includes("index") || allDependencyRegistryNames.includes("index")) {
    if (config.tailwind.baseColor) {
      const theme = await registryGetTheme(config.tailwind.baseColor, config);
      if (theme) {
        payload.unshift(theme);
      }
    }
  }
  const sourceMap = /* @__PURE__ */ new Map();
  payload.forEach((item) => {
    const source = item._source || item.name;
    sourceMap.set(item, source);
  });
  payload = topologicalSortRegistryItems(payload, sourceMap);
  payload.sort((a, b) => {
    if (a.type === "registry:theme" && b.type !== "registry:theme") {
      return -1;
    }
    if (a.type !== "registry:theme" && b.type === "registry:theme") {
      return 1;
    }
    return 0;
  });
  let tailwind = {};
  payload.forEach((item) => {
    tailwind = deepmerge3(tailwind, item.tailwind ?? {});
  });
  let cssVars = {};
  payload.forEach((item) => {
    cssVars = deepmerge3(cssVars, item.cssVars ?? {});
  });
  let css = {};
  payload.forEach((item) => {
    css = deepmerge3(css, item.css ?? {});
  });
  let docs2 = "";
  payload.forEach((item) => {
    if (item.docs) {
      docs2 += `${item.docs}
`;
    }
  });
  let envVars = {};
  payload.forEach((item) => {
    envVars = deepmerge3(envVars, item.envVars ?? {});
  });
  const deduplicatedFiles = await deduplicateFilesByTarget(
    payload.map((item) => item.files ?? []),
    config
  );
  const fonts = payload.filter((item) => item.type === "registry:font" && item.font).map((item) => ({
    ...item,
    type: "registry:font",
    font: item.font
  }));
  const parsed = registryResolvedItemsTreeSchema.parse({
    dependencies: deepmerge3.all(payload.map((item) => item.dependencies ?? [])),
    devDependencies: deepmerge3.all(
      payload.map((item) => item.devDependencies ?? [])
    ),
    files: deduplicatedFiles,
    tailwind,
    cssVars,
    css,
    docs: docs2,
    fonts: fonts.length > 0 ? fonts : void 0
  });
  if (Object.keys(envVars).length > 0) {
    parsed.envVars = envVars;
  }
  return parsed;
}
async function resolveDependenciesRecursively(dependencies, config, options = {}, visited = /* @__PURE__ */ new Set()) {
  const items = [];
  const registryNames = [];
  for (const dep of dependencies) {
    if (visited.has(dep)) {
      continue;
    }
    visited.add(dep);
    if (isUrl(dep) || isLocalFile(dep)) {
      const [item] = await fetchRegistryItems([dep], config, options);
      if (item) {
        items.push(item);
        if (item.registryDependencies) {
          const resolvedDeps = config?.registries ? resolveRegistryItemsFromRegistries(
            item.registryDependencies,
            config
          ) : item.registryDependencies;
          const nested = await resolveDependenciesRecursively(
            resolvedDeps,
            config,
            options,
            visited
          );
          items.push(...nested.items);
          registryNames.push(...nested.registryNames);
        }
      }
    } else if (dep.startsWith("@") && config?.registries) {
      const { registry: registry2 } = parseRegistryAndItemFromString(dep);
      if (registry2 && !(registry2 in config.registries)) {
        throw new RegistryNotConfiguredError(registry2);
      }
      const [item] = await fetchRegistryItems([dep], config, options);
      if (item) {
        items.push(item);
        if (item.registryDependencies) {
          const resolvedDeps = config?.registries ? resolveRegistryItemsFromRegistries(
            item.registryDependencies,
            config
          ) : item.registryDependencies;
          const nested = await resolveDependenciesRecursively(
            resolvedDeps,
            config,
            options,
            visited
          );
          items.push(...nested.items);
          registryNames.push(...nested.registryNames);
        }
      }
    } else {
      registryNames.push(dep);
      if (config) {
        try {
          const [item] = await fetchRegistryItems([dep], config, options);
          if (item && item.registryDependencies) {
            const resolvedDeps = config?.registries ? resolveRegistryItemsFromRegistries(
              item.registryDependencies,
              config
            ) : item.registryDependencies;
            const nested = await resolveDependenciesRecursively(
              resolvedDeps,
              config,
              options,
              visited
            );
            items.push(...nested.items);
            registryNames.push(...nested.registryNames);
          }
        } catch (error) {
        }
      }
    }
  }
  return { items, registryNames };
}
async function resolveRegistryDependencies(url, config, options = {}) {
  if (isUrl(url)) {
    return [url];
  }
  const { registryNames } = await resolveDependenciesRecursively(
    [url],
    config,
    options,
    /* @__PURE__ */ new Set()
  );
  const style = config.resolvedPaths?.cwd ? await getTargetStyleFromConfig(config.resolvedPaths.cwd, config.style) : config.style;
  const urls = registryNames.map(
    (name) => resolveRegistryUrl(isUrl(name) ? name : `styles/${style}/${name}.json`)
  );
  return Array.from(new Set(urls));
}
async function registryGetTheme(name, config) {
  const [baseColor, tailwindVersion] = await Promise.all([
    getRegistryBaseColor(name),
    getProjectTailwindVersionFromConfig(config)
  ]);
  if (!baseColor) {
    return null;
  }
  const theme = {
    name,
    type: "registry:theme",
    tailwind: {
      config: {
        theme: {
          extend: {
            borderRadius: {
              lg: "var(--radius)",
              md: "calc(var(--radius) - 2px)",
              sm: "calc(var(--radius) - 4px)"
            },
            colors: {}
          }
        }
      }
    },
    cssVars: {
      theme: {},
      light: {
        radius: "0.5rem"
      },
      dark: {}
    }
  };
  if (config.tailwind.cssVariables) {
    theme.tailwind.config.theme.extend.colors = {
      ...theme.tailwind.config.theme.extend.colors,
      ...buildTailwindThemeColorsFromCssVars(baseColor.cssVars.dark ?? {})
    };
    theme.cssVars = {
      theme: {
        ...baseColor.cssVars.theme,
        ...theme.cssVars.theme
      },
      light: {
        ...baseColor.cssVars.light,
        ...theme.cssVars.light
      },
      dark: {
        ...baseColor.cssVars.dark,
        ...theme.cssVars.dark
      }
    };
    if (tailwindVersion === "v4" && baseColor.cssVarsV4) {
      theme.cssVars = {
        theme: {
          ...baseColor.cssVarsV4.theme,
          ...theme.cssVars.theme
        },
        light: {
          radius: "0.625rem",
          ...baseColor.cssVarsV4.light
        },
        dark: {
          ...baseColor.cssVarsV4.dark
        }
      };
    }
  }
  return theme;
}
function computeItemHash(item, source) {
  const identifier = source || item.name;
  const hash = createHash("sha256").update(identifier).digest("hex").substring(0, 8);
  return `${item.name}::${hash}`;
}
function extractItemIdentifierFromDependency(dependency) {
  if (isUrl(dependency)) {
    const url = new URL(dependency);
    const pathname = url.pathname;
    const match = pathname.match(/\/([^/]+)\.json$/);
    const name = match ? match[1] : path4__default.basename(pathname, ".json");
    return {
      name,
      hash: computeItemHash({ name }, dependency)
    };
  }
  if (isLocalFile(dependency)) {
    const match = dependency.match(/\/([^/]+)\.json$/);
    const name = match ? match[1] : path4__default.basename(dependency, ".json");
    return {
      name,
      hash: computeItemHash({ name }, dependency)
    };
  }
  const { item } = parseRegistryAndItemFromString(dependency);
  return {
    name: item,
    hash: computeItemHash({ name: item }, dependency)
  };
}
function topologicalSortRegistryItems(items, sourceMap) {
  const itemMap = /* @__PURE__ */ new Map();
  const hashToItem = /* @__PURE__ */ new Map();
  const inDegree = /* @__PURE__ */ new Map();
  const adjacencyList = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    const source = sourceMap.get(item) || item.name;
    const hash = computeItemHash(item, source);
    itemMap.set(hash, item);
    hashToItem.set(hash, item);
    inDegree.set(hash, 0);
    adjacencyList.set(hash, []);
  });
  const depToHashes = /* @__PURE__ */ new Map();
  items.forEach((item) => {
    const source = sourceMap.get(item) || item.name;
    const hash = computeItemHash(item, source);
    if (!depToHashes.has(item.name)) {
      depToHashes.set(item.name, []);
    }
    depToHashes.get(item.name).push(hash);
    if (source !== item.name) {
      if (!depToHashes.has(source)) {
        depToHashes.set(source, []);
      }
      depToHashes.get(source).push(hash);
    }
  });
  items.forEach((item) => {
    const itemSource = sourceMap.get(item) || item.name;
    const itemHash = computeItemHash(item, itemSource);
    if (item.registryDependencies) {
      item.registryDependencies.forEach((dep) => {
        let depHash;
        const exactMatches = depToHashes.get(dep) || [];
        if (exactMatches.length === 1) {
          depHash = exactMatches[0];
        } else if (exactMatches.length > 1) {
          depHash = exactMatches[0];
        } else {
          const { name } = extractItemIdentifierFromDependency(dep);
          const nameMatches = depToHashes.get(name) || [];
          if (nameMatches.length > 0) {
            depHash = nameMatches[0];
          }
        }
        if (depHash && itemMap.has(depHash)) {
          adjacencyList.get(depHash).push(itemHash);
          inDegree.set(itemHash, inDegree.get(itemHash) + 1);
        }
      });
    }
  });
  const queue = [];
  const sorted = [];
  inDegree.forEach((degree, hash) => {
    if (degree === 0) {
      queue.push(hash);
    }
  });
  while (queue.length > 0) {
    const currentHash = queue.shift();
    const item = itemMap.get(currentHash);
    sorted.push(item);
    adjacencyList.get(currentHash).forEach((dependentHash) => {
      const newDegree = inDegree.get(dependentHash) - 1;
      inDegree.set(dependentHash, newDegree);
      if (newDegree === 0) {
        queue.push(dependentHash);
      }
    });
  }
  if (sorted.length !== items.length) {
    const sortedHashes = new Set(
      sorted.map((item) => {
        const source = sourceMap.get(item) || item.name;
        return computeItemHash(item, source);
      })
    );
    items.forEach((item) => {
      const source = sourceMap.get(item) || item.name;
      const hash = computeItemHash(item, source);
      if (!sortedHashes.has(hash)) {
        sorted.push(item);
      }
    });
  }
  return sorted;
}
function handleError(error) {
  logger.break();
  logger.error(
    `Something went wrong. Please check the error below for more details.`
  );
  logger.error(`If the problem persists, please open an issue on GitHub.`);
  logger.error("");
  if (typeof error === "string") {
    logger.error(error);
    logger.break();
    process.exit(1);
  }
  if (error instanceof RegistryError) {
    if (error.message) {
      logger.error(error.cause ? "Error:" : "Message:");
      logger.error(error.message);
    }
    if (error.cause) {
      logger.error("\nMessage:");
      logger.error(error.cause);
    }
    if (error.suggestion) {
      logger.error("\nSuggestion:");
      logger.error(error.suggestion);
    }
    logger.break();
    process.exit(1);
  }
  if (error instanceof z.ZodError) {
    logger.error("Validation failed:");
    for (const [key, value] of Object.entries(error.flatten().fieldErrors)) {
      logger.error(`- ${highlighter.info(key)}: ${value}`);
    }
    logger.break();
    process.exit(1);
  }
  if (error instanceof Error) {
    logger.error(error.message);
    logger.break();
    process.exit(1);
  }
  logger.break();
  process.exit(1);
}
async function getRegistry(name, options) {
  const { config, useCache } = options || {};
  if (isUrl(name)) {
    const [result2] = await fetchRegistry([name], { useCache });
    try {
      return registrySchema.parse(result2);
    } catch (error) {
      throw new RegistryParseError(name, error);
    }
  }
  if (!name.startsWith("@")) {
    throw new RegistryInvalidNamespaceError(name);
  }
  let registryName = name;
  if (!registryName.endsWith("/registry")) {
    registryName = `${registryName}/registry`;
  }
  const urlAndHeaders = buildUrlAndHeadersForRegistryItem(
    registryName,
    configWithDefaults(config)
  );
  if (!urlAndHeaders?.url) {
    throw new RegistryNotFoundError(registryName);
  }
  if (urlAndHeaders.headers && Object.keys(urlAndHeaders.headers).length > 0) {
    setRegistryHeaders({
      [urlAndHeaders.url]: urlAndHeaders.headers
    });
  }
  const [result] = await fetchRegistry([urlAndHeaders.url], { useCache });
  try {
    return registrySchema.parse(result);
  } catch (error) {
    throw new RegistryParseError(registryName, error);
  }
}
async function getRegistryItems(items, options) {
  const { config, useCache = false } = options || {};
  clearRegistryContext();
  return fetchRegistryItems(items, configWithDefaults(config), { useCache });
}
async function resolveRegistryItems(items, options) {
  const { config, useCache = false } = options || {};
  clearRegistryContext();
  return resolveRegistryTree(items, configWithDefaults(config), { useCache });
}
async function getRegistriesConfig(cwd, options) {
  const { useCache = true } = options || {};
  if (!useCache) {
    explorer.clearCaches();
  }
  const configResult = await explorer.search(cwd);
  if (!configResult) {
    return {
      registries: BUILTIN_REGISTRIES
    };
  }
  const registriesConfig = z.object({
    registries: registryConfigSchema.optional()
  }).safeParse(configResult.config);
  if (!registriesConfig.success) {
    throw new ConfigParseError(cwd, registriesConfig.error);
  }
  return {
    registries: {
      ...BUILTIN_REGISTRIES,
      ...registriesConfig.data.registries || {}
    }
  };
}
async function getShadcnRegistryIndex() {
  try {
    const [result] = await fetchRegistry(["index.json"]);
    return registryIndexSchema.parse(result);
  } catch (error) {
    logger.error("\n");
    handleError(error);
  }
}
async function getRegistryStyles() {
  try {
    const [result] = await fetchRegistry(["styles/index.json"]);
    return stylesSchema.parse(result);
  } catch (error) {
    logger.error("\n");
    handleError(error);
    return [];
  }
}
async function getRegistryIcons() {
  try {
    const [result] = await fetchRegistry(["icons/index.json"]);
    return iconsSchema.parse(result);
  } catch (error) {
    handleError(error);
    return {};
  }
}
async function getRegistryBaseColors() {
  return BASE_COLORS;
}
async function getRegistryBaseColor(baseColor) {
  try {
    const [result] = await fetchRegistry([`colors/${baseColor}.json`]);
    return registryBaseColorSchema.parse(result);
  } catch (error) {
    handleError(error);
  }
}
async function resolveTree(index, names) {
  const tree = [];
  for (const name of names) {
    const entry = index.find((entry2) => entry2.name === name);
    if (!entry) {
      continue;
    }
    tree.push(entry);
    if (entry.registryDependencies) {
      const dependencies = await resolveTree(index, entry.registryDependencies);
      tree.push(...dependencies);
    }
  }
  return tree.filter(
    (component, index2, self) => self.findIndex((c) => c.name === component.name) === index2
  );
}
async function fetchTree(style, tree) {
  try {
    const paths = tree.map((item) => `styles/${style}/${item.name}.json`);
    const results = await fetchRegistry(paths);
    return results.map((result) => registryItemSchema.parse(result));
  } catch (error) {
    handleError(error);
    return [];
  }
}
async function getItemTargetPath(config, item, override) {
  if (override) {
    return override;
  }
  if (item.type === "registry:ui") {
    return config.resolvedPaths.ui ?? config.resolvedPaths.components;
  }
  const [parent, type] = item.type?.split(":") ?? [];
  if (!(parent in config.resolvedPaths)) {
    return null;
  }
  return path4__default.join(
    config.resolvedPaths[parent],
    type
  );
}
async function getRegistries(options) {
  options = {
    useCache: true,
    ...options
  };
  const url = `${REGISTRY_URL}/registries.json`;
  const [data] = await fetchRegistry([url], {
    useCache: options.useCache
  });
  try {
    return registriesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new RegistriesIndexParseError(error);
    }
    throw error;
  }
}
async function getRegistriesIndex(options) {
  const registries = await getRegistries(options);
  if (!registries) return null;
  return Object.fromEntries(registries.map((r) => [r.name, r.url]));
}
async function getPresets(options) {
  options = {
    useCache: true,
    ...options
  };
  const url = `${REGISTRY_URL}/config.json`;
  const [data] = await fetchRegistry([url], {
    useCache: options.useCache
  });
  const result = configJsonSchema.parse(data);
  return result.presets;
}
async function getPreset(name, options) {
  const presets = await getPresets(options);
  return presets.find(
    (preset) => preset.name.toLowerCase() === name.toLowerCase()
  ) ?? null;
}

// src/utils/frameworks.ts
var FRAMEWORKS = {
  "next-app": {
    name: "next-app",
    label: "Next.js",
    links: {
      installation: `${SHADCN_URL}/docs/installation/next`,
      tailwind: "https://tailwindcss.com/docs/guides/nextjs"
    }
  },
  "next-pages": {
    name: "next-pages",
    label: "Next.js",
    links: {
      installation: `${SHADCN_URL}/docs/installation/next`,
      tailwind: "https://tailwindcss.com/docs/guides/nextjs"
    }
  },
  remix: {
    name: "remix",
    label: "Remix",
    links: {
      installation: `${SHADCN_URL}/docs/installation/remix`,
      tailwind: "https://tailwindcss.com/docs/guides/remix"
    }
  },
  "react-router": {
    name: "react-router",
    label: "React Router",
    links: {
      installation: `${SHADCN_URL}/docs/installation/react-router`,
      tailwind: "https://tailwindcss.com/docs/installation/framework-guides/react-router"
    }
  },
  vite: {
    name: "vite",
    label: "Vite",
    links: {
      installation: `${SHADCN_URL}/docs/installation/vite`,
      tailwind: "https://tailwindcss.com/docs/guides/vite"
    }
  },
  astro: {
    name: "astro",
    label: "Astro",
    links: {
      installation: `${SHADCN_URL}/docs/installation/astro`,
      tailwind: "https://tailwindcss.com/docs/guides/astro"
    }
  },
  laravel: {
    name: "laravel",
    label: "Laravel",
    links: {
      installation: `${SHADCN_URL}/docs/installation/laravel`,
      tailwind: "https://tailwindcss.com/docs/guides/laravel"
    }
  },
  "tanstack-start": {
    name: "tanstack-start",
    label: "TanStack Start",
    links: {
      installation: `${SHADCN_URL}/docs/installation/tanstack`,
      tailwind: "https://tailwindcss.com/docs/installation/using-postcss"
    }
  },
  gatsby: {
    name: "gatsby",
    label: "Gatsby",
    links: {
      installation: `${SHADCN_URL}/docs/installation/gatsby`,
      tailwind: "https://tailwindcss.com/docs/guides/gatsby"
    }
  },
  expo: {
    name: "expo",
    label: "Expo",
    links: {
      installation: `${SHADCN_URL}/docs/installation/expo`,
      tailwind: "https://www.nativewind.dev/docs/getting-started/installation"
    }
  },
  manual: {
    name: "manual",
    label: "Manual",
    links: {
      installation: `${SHADCN_URL}/docs/installation/manual`,
      tailwind: "https://tailwindcss.com/docs/installation"
    }
  }
};
function getPackageInfo(cwd = "", shouldThrow = true) {
  const packageJsonPath = path4__default.join(cwd, "package.json");
  return fs11.readJSONSync(packageJsonPath, {
    throws: shouldThrow
  });
}
var PROJECT_SHARED_IGNORE = [
  "**/node_modules/**",
  ".next",
  "public",
  "dist",
  "build"
];
z.object({
  compilerOptions: z.object({
    paths: z.record(z.string().or(z.array(z.string())))
  })
});
async function getProjectInfo(cwd, opts) {
  const [
    configFiles,
    isSrcDir,
    isTsx,
    tailwindConfigFile,
    tailwindCssFile,
    tailwindVersion,
    aliasPrefix,
    packageJson
  ] = await Promise.all([
    fg3.glob(
      "**/{next,vite,astro,app}.config.*|gatsby-config.*|composer.json|react-router.config.*",
      {
        cwd,
        deep: 3,
        ignore: PROJECT_SHARED_IGNORE
      }
    ),
    fs11.pathExists(path4__default.resolve(cwd, "src")),
    isTypeScriptProject(cwd),
    getTailwindConfigFile(cwd),
    getTailwindCssFile(cwd, opts?.configCssFile),
    getTailwindVersion(cwd),
    getTsConfigAliasPrefix(cwd),
    getPackageInfo(cwd, false)
  ]);
  const isUsingAppDir = await fs11.pathExists(
    path4__default.resolve(cwd, `${isSrcDir ? "src/" : ""}app`)
  );
  const type = {
    framework: FRAMEWORKS["manual"],
    isSrcDir,
    isRSC: false,
    isTsx,
    tailwindConfigFile,
    tailwindCssFile,
    tailwindVersion,
    frameworkVersion: null,
    aliasPrefix
  };
  if (configFiles.find((file) => file.startsWith("next.config."))?.length) {
    type.framework = isUsingAppDir ? FRAMEWORKS["next-app"] : FRAMEWORKS["next-pages"];
    type.isRSC = isUsingAppDir;
    type.frameworkVersion = await getFrameworkVersion(
      type.framework,
      packageJson
    );
    return type;
  }
  if (configFiles.find((file) => file.startsWith("astro.config."))?.length) {
    type.framework = FRAMEWORKS["astro"];
    return type;
  }
  if (configFiles.find((file) => file.startsWith("gatsby-config."))?.length) {
    type.framework = FRAMEWORKS["gatsby"];
    return type;
  }
  if (configFiles.find((file) => file.startsWith("composer.json"))?.length) {
    type.framework = FRAMEWORKS["laravel"];
    return type;
  }
  if (Object.keys(packageJson?.dependencies ?? {}).find(
    (dep) => dep.startsWith("@remix-run/")
  )) {
    type.framework = FRAMEWORKS["remix"];
    return type;
  }
  if ([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {})
  ].find((dep) => dep.startsWith("@tanstack/react-start"))) {
    type.framework = FRAMEWORKS["tanstack-start"];
    return type;
  }
  if (configFiles.find((file) => file.startsWith("react-router.config."))?.length) {
    type.framework = FRAMEWORKS["react-router"];
    return type;
  }
  if (configFiles.find((file) => file.startsWith("vite.config."))?.length) {
    type.framework = FRAMEWORKS["vite"];
    return type;
  }
  const appConfig = configFiles.find((file) => file.startsWith("app.config"));
  if (appConfig?.length) {
    const appConfigContents = await fs11.readFile(
      path4__default.resolve(cwd, appConfig),
      "utf8"
    );
    if (appConfigContents.includes("defineConfig")) {
      type.framework = FRAMEWORKS["vite"];
      return type;
    }
  }
  if (packageJson?.dependencies?.expo) {
    type.framework = FRAMEWORKS["expo"];
    return type;
  }
  return type;
}
async function getFrameworkVersion(framework, packageJson) {
  if (!packageJson) {
    return null;
  }
  if (!["next-app", "next-pages"].includes(framework.name)) {
    return null;
  }
  const version = packageJson.dependencies?.next || packageJson.devDependencies?.next;
  if (!version) {
    return null;
  }
  const versionMatch = version.match(/^[\^~]?(\d+\.\d+\.\d+)/);
  if (versionMatch) {
    return versionMatch[1];
  }
  const rangeMatch = version.match(/(\d+\.\d+\.\d+)/);
  if (rangeMatch) {
    return rangeMatch[1];
  }
  return version;
}
async function getTailwindVersion(cwd) {
  const [packageInfo, config] = await Promise.all([
    getPackageInfo(cwd, false),
    getConfig(cwd)
  ]);
  if (config?.tailwind?.config === "") {
    return "v4";
  }
  if (!packageInfo?.dependencies?.tailwindcss && !packageInfo?.devDependencies?.tailwindcss) {
    return null;
  }
  if (/^(?:\^|~)?3(?:\.\d+)*(?:-.*)?$/.test(
    packageInfo?.dependencies?.tailwindcss || packageInfo?.devDependencies?.tailwindcss || ""
  )) {
    return "v3";
  }
  return "v4";
}
async function getTailwindCssFile(cwd, configCssFile) {
  if (configCssFile) {
    const resolvedPath = path4__default.resolve(cwd, configCssFile);
    if (await fs11.pathExists(resolvedPath)) {
      return configCssFile;
    }
  }
  const [files, tailwindVersion] = await Promise.all([
    fg3.glob(["**/*.css", "**/*.scss"], {
      cwd,
      deep: 5,
      ignore: PROJECT_SHARED_IGNORE
    }),
    getTailwindVersion(cwd)
  ]);
  if (!files.length) {
    return null;
  }
  for (const file of files) {
    const contents = await fs11.readFile(path4__default.resolve(cwd, file), "utf8");
    if (contents.includes(`@import "tailwindcss"`) || contents.includes(`@import 'tailwindcss'`) || contents.includes(`@tailwind base`)) {
      return file;
    }
  }
  return null;
}
async function getTailwindConfigFile(cwd) {
  const files = await fg3.glob("tailwind.config.*", {
    cwd,
    deep: 3,
    ignore: PROJECT_SHARED_IGNORE
  });
  if (!files.length) {
    return null;
  }
  return files[0];
}
async function getTsConfigAliasPrefix(cwd) {
  const tsConfig = await loadConfig(cwd);
  if (tsConfig?.resultType === "failed" || !Object.entries(tsConfig?.paths).length) {
    return null;
  }
  for (const [alias, paths] of Object.entries(tsConfig.paths)) {
    if (paths.includes("./*") || paths.includes("./src/*") || paths.includes("./app/*") || paths.includes("./resources/js/*")) {
      return alias.replace(/\/\*$/, "") ?? null;
    }
  }
  return Object.keys(tsConfig?.paths)?.[0].replace(/\/\*$/, "") ?? null;
}
async function isTypeScriptProject(cwd) {
  const files = await fg3.glob("tsconfig.*", {
    cwd,
    deep: 1,
    ignore: PROJECT_SHARED_IGNORE
  });
  return files.length > 0;
}
async function getProjectConfig(cwd, defaultProjectInfo = null) {
  const [existingConfig, projectInfo] = await Promise.all([
    getConfig(cwd),
    !defaultProjectInfo ? getProjectInfo(cwd) : Promise.resolve(defaultProjectInfo)
  ]);
  if (existingConfig) {
    return existingConfig;
  }
  if (!projectInfo || !projectInfo.tailwindCssFile || projectInfo.tailwindVersion === "v3" && !projectInfo.tailwindConfigFile) {
    return null;
  }
  const config = {
    $schema: "https://ui.shadcn.com/schema.json",
    rsc: projectInfo.isRSC,
    tsx: projectInfo.isTsx,
    style: "new-york",
    tailwind: {
      config: projectInfo.tailwindConfigFile ?? "",
      baseColor: "zinc",
      css: projectInfo.tailwindCssFile,
      cssVariables: true,
      prefix: ""
    },
    iconLibrary: "lucide",
    aliases: {
      components: `${projectInfo.aliasPrefix}/components`,
      ui: `${projectInfo.aliasPrefix}/components/ui`,
      hooks: `${projectInfo.aliasPrefix}/hooks`,
      lib: `${projectInfo.aliasPrefix}/lib`,
      utils: `${projectInfo.aliasPrefix}/lib/utils`
    }
  };
  return await resolveConfigPaths(cwd, config);
}
async function getProjectTailwindVersionFromConfig(config) {
  if (!config.resolvedPaths?.cwd) {
    return "v3";
  }
  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);
  if (!projectInfo?.tailwindVersion) {
    return null;
  }
  return projectInfo.tailwindVersion;
}
async function getProjectComponents(cwd) {
  const existingConfig = await getConfig(cwd);
  if (!existingConfig) {
    return [];
  }
  const resolvedConfig = await resolveConfigPaths(cwd, existingConfig);
  const uiDir = resolvedConfig.resolvedPaths.ui;
  if (!fs11.existsSync(uiDir)) {
    return [];
  }
  const registryIndex = await getShadcnRegistryIndex();
  const registryNames = new Set(registryIndex?.map((item) => item.name) ?? []);
  const files = await promises.readdir(uiDir);
  return files.filter((f) => /\.(tsx|jsx)$/.test(f)).map((f) => path4__default.basename(f, path4__default.extname(f))).filter((name) => registryNames.has(name));
}
async function preFlightInit(options) {
  const errors = {};
  if (!fs11.existsSync(options.cwd) || !fs11.existsSync(path4__default.resolve(options.cwd, "package.json"))) {
    errors[MISSING_DIR_OR_EMPTY_PROJECT] = true;
    return {
      errors,
      projectInfo: null
    };
  }
  const projectSpinner = spinner(`Preflight checks.`, {
    silent: options.silent
  }).start();
  if (fs11.existsSync(path4__default.resolve(options.cwd, "components.json")) && !options.force) {
    projectSpinner?.fail();
    logger.break();
    logger.error(
      `A ${highlighter.info(
        "components.json"
      )} file already exists at ${highlighter.info(
        options.cwd
      )}.
To start over, remove the ${highlighter.info(
        "components.json"
      )} file and run ${highlighter.info("init")} again.`
    );
    logger.break();
    process.exit(1);
  }
  projectSpinner?.succeed();
  const frameworkSpinner = spinner(`Verifying framework.`, {
    silent: options.silent
  }).start();
  const tailwind = options.existingConfig?.tailwind;
  const projectInfo = await getProjectInfo(options.cwd, {
    configCssFile: typeof tailwind?.css === "string" ? tailwind.css : void 0
  });
  if (!projectInfo || projectInfo?.framework.name === "manual") {
    errors[UNSUPPORTED_FRAMEWORK] = true;
    frameworkSpinner?.fail();
    if (!options.monorepo && await isMonorepoRoot(options.cwd)) {
      const targets = await getMonorepoTargets(options.cwd);
      if (targets.length > 0) {
        formatMonorepoMessage("init", targets);
        process.exit(1);
      }
    }
    logger.break();
    if (projectInfo?.framework.links.installation) {
      logger.error(
        `We could not detect a supported framework at ${highlighter.info(
          options.cwd
        )}.
Visit ${highlighter.info(
          projectInfo?.framework.links.installation
        )} to manually configure your project.
Once configured, you can use the cli to add components.`
      );
    }
    logger.break();
    process.exit(1);
  }
  frameworkSpinner?.succeed(
    `Verifying framework. Found ${highlighter.info(
      projectInfo.framework.label
    )}.`
  );
  let tailwindSpinnerMessage = "Validating Tailwind CSS.";
  if (projectInfo.tailwindVersion === "v4") {
    tailwindSpinnerMessage = `Validating Tailwind CSS. Found ${highlighter.info(
      "v4"
    )}.`;
  }
  const tailwindSpinner = spinner(tailwindSpinnerMessage, {
    silent: options.silent
  }).start();
  if (projectInfo.tailwindVersion === "v3" && (!projectInfo?.tailwindConfigFile || !projectInfo?.tailwindCssFile)) {
    errors[TAILWIND_NOT_CONFIGURED] = true;
    tailwindSpinner?.fail();
  } else if (projectInfo.tailwindVersion === "v4" && !projectInfo?.tailwindCssFile) {
    errors[TAILWIND_NOT_CONFIGURED] = true;
    tailwindSpinner?.fail();
  } else if (!projectInfo.tailwindVersion) {
    errors[TAILWIND_NOT_CONFIGURED] = true;
    tailwindSpinner?.fail();
  } else {
    tailwindSpinner?.succeed();
  }
  const tsConfigSpinner = spinner(`Validating import alias.`, {
    silent: options.silent
  }).start();
  if (!projectInfo?.aliasPrefix) {
    errors[IMPORT_ALIAS_MISSING] = true;
    tsConfigSpinner?.fail();
  } else {
    tsConfigSpinner?.succeed();
  }
  if (Object.keys(errors).length > 0) {
    if (errors[TAILWIND_NOT_CONFIGURED]) {
      logger.break();
      logger.error(
        `No Tailwind CSS configuration found at ${highlighter.info(
          options.cwd
        )}.`
      );
      logger.error(
        `It is likely you do not have Tailwind CSS installed or have an invalid configuration.`
      );
      logger.error(`Install Tailwind CSS then try again.`);
      if (projectInfo?.framework.links.tailwind) {
        logger.error(
          `Visit ${highlighter.info(
            projectInfo?.framework.links.tailwind
          )} to get started.`
        );
      }
    }
    if (errors[IMPORT_ALIAS_MISSING]) {
      logger.break();
      logger.error(`No import alias found in your tsconfig.json file.`);
      if (projectInfo?.framework.links.installation) {
        logger.error(
          `Visit ${highlighter.info(
            projectInfo?.framework.links.installation
          )} to learn how to set an import alias.`
        );
      }
    }
    logger.break();
    process.exit(1);
  }
  return {
    errors,
    projectInfo
  };
}

// src/preset/preset.ts
var PRESET_STYLES = [
  "nova",
  "vega",
  "maia",
  "lyra",
  "mira",
  "luma",
  "sera"
];
var PRESET_BASE_COLORS = [
  "neutral",
  "stone",
  "zinc",
  "gray",
  "mauve",
  "olive",
  "mist",
  "taupe"
];
var PRESET_THEMES = [
  "neutral",
  "stone",
  "zinc",
  "gray",
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "teal",
  "violet",
  "yellow",
  "mauve",
  "olive",
  "mist",
  "taupe"
];
var PRESET_CHART_COLORS = PRESET_THEMES;
var PRESET_ICON_LIBRARIES = [
  "lucide",
  "hugeicons",
  "tabler",
  "phosphor",
  "remixicon"
];
var PRESET_FONTS = [
  "inter",
  "noto-sans",
  "nunito-sans",
  "figtree",
  "roboto",
  "raleway",
  "dm-sans",
  "public-sans",
  "outfit",
  "jetbrains-mono",
  "geist",
  "geist-mono",
  "lora",
  "merriweather",
  "playfair-display",
  "noto-serif",
  "roboto-slab",
  "oxanium",
  "manrope",
  "space-grotesk",
  "montserrat",
  "ibm-plex-sans",
  "source-sans-3",
  "instrument-sans",
  "eb-garamond",
  "instrument-serif"
];
var PRESET_FONT_HEADINGS = ["inherit", ...PRESET_FONTS];
var PRESET_RADII = [
  "default",
  "none",
  "small",
  "medium",
  "large"
];
var PRESET_MENU_ACCENTS = ["subtle", "bold"];
var PRESET_MENU_COLORS = [
  "default",
  "inverted",
  "default-translucent",
  "inverted-translucent"
];
var PRESET_FIELDS_V1 = [
  { key: "menuColor", values: PRESET_MENU_COLORS, bits: 3 },
  { key: "menuAccent", values: PRESET_MENU_ACCENTS, bits: 3 },
  { key: "radius", values: PRESET_RADII, bits: 4 },
  { key: "font", values: PRESET_FONTS, bits: 6 },
  { key: "iconLibrary", values: PRESET_ICON_LIBRARIES, bits: 6 },
  { key: "theme", values: PRESET_THEMES, bits: 6 },
  { key: "baseColor", values: PRESET_BASE_COLORS, bits: 6 },
  { key: "style", values: PRESET_STYLES, bits: 6 }
];
var PRESET_FIELDS_V2 = [
  ...PRESET_FIELDS_V1,
  { key: "chartColor", values: PRESET_CHART_COLORS, bits: 6 },
  { key: "fontHeading", values: PRESET_FONT_HEADINGS, bits: 5 }
];
Object.fromEntries(
  PRESET_FIELDS_V2.map((f) => [f.key, f.values[0]])
);
var BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var VALID_VERSIONS = ["a", "b"];
function fromBase62(str) {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62.indexOf(str[i]);
    if (idx === -1) return -1;
    result = result * 62 + idx;
  }
  return result;
}
function decodePreset(code) {
  if (!code || code.length < 2) {
    return null;
  }
  const version = code[0];
  if (!VALID_VERSIONS.includes(version)) {
    return null;
  }
  const fields = version === "a" ? PRESET_FIELDS_V1 : PRESET_FIELDS_V2;
  const bits = fromBase62(code.slice(1));
  if (bits < 0) return null;
  const result = {};
  let offset = 0;
  for (const field of fields) {
    const idx = Math.floor(bits / 2 ** offset) % 2 ** field.bits;
    result[field.key] = idx < field.values.length ? field.values[idx] : field.values[0];
    offset += field.bits;
  }
  if (version === "a") {
    result.fontHeading = "inherit";
  }
  return result;
}
function isPresetCode(value) {
  if (!value || value.length < 2 || value.length > 10) {
    return false;
  }
  if (!VALID_VERSIONS.includes(value[0])) {
    return false;
  }
  for (let i = 1; i < value.length; i++) {
    if (BASE62.indexOf(value[i]) === -1) {
      return false;
    }
  }
  return true;
}

// src/registry/namespaces.ts
async function resolveRegistryNamespaces(components, config) {
  const discoveredNamespaces = /* @__PURE__ */ new Set();
  const visitedItems = /* @__PURE__ */ new Set();
  const itemsToProcess = [...components];
  while (itemsToProcess.length > 0) {
    const currentItem = itemsToProcess.shift();
    if (visitedItems.has(currentItem)) {
      continue;
    }
    visitedItems.add(currentItem);
    const { registry: registry2 } = parseRegistryAndItemFromString(currentItem);
    if (registry2 && !BUILTIN_REGISTRIES[registry2]) {
      discoveredNamespaces.add(registry2);
    }
    try {
      const [item] = await fetchRegistryItems([currentItem], config, {
        useCache: true
      });
      if (item?.registryDependencies) {
        for (const dep of item.registryDependencies) {
          const { registry: depRegistry } = parseRegistryAndItemFromString(dep);
          if (depRegistry && !BUILTIN_REGISTRIES[depRegistry]) {
            discoveredNamespaces.add(depRegistry);
          }
          if (!visitedItems.has(dep)) {
            itemsToProcess.push(dep);
          }
        }
      }
    } catch (error) {
      if (error instanceof RegistryNotConfiguredError) {
        const { registry: registry3 } = parseRegistryAndItemFromString(currentItem);
        if (registry3 && !BUILTIN_REGISTRIES[registry3]) {
          discoveredNamespaces.add(registry3);
        }
        continue;
      }
      continue;
    }
  }
  return Array.from(discoveredNamespaces);
}
async function ensureRegistriesInConfig(components, config, options = {}) {
  options = {
    silent: false,
    writeFile: true,
    ...options
  };
  const registryNames = await resolveRegistryNamespaces(components, config);
  const missingRegistries = registryNames.filter(
    (registry2) => !config.registries?.[registry2] && !Object.keys(BUILTIN_REGISTRIES).includes(registry2)
  );
  if (missingRegistries.length === 0) {
    return {
      config,
      newRegistries: []
    };
  }
  const registryIndex = await getRegistriesIndex({
    useCache: process.env.NODE_ENV !== "development"
  });
  if (!registryIndex) {
    return {
      config,
      newRegistries: []
    };
  }
  const foundRegistries = {};
  for (const registry2 of missingRegistries) {
    if (registryIndex[registry2]) {
      foundRegistries[registry2] = registryIndex[registry2];
    }
  }
  if (Object.keys(foundRegistries).length === 0) {
    return {
      config,
      newRegistries: []
    };
  }
  const existingRegistries = Object.fromEntries(
    Object.entries(config.registries || {}).filter(
      ([key]) => !Object.keys(BUILTIN_REGISTRIES).includes(key)
    )
  );
  const newConfigWithRegistries = {
    ...config,
    registries: {
      ...existingRegistries,
      ...foundRegistries
    }
  };
  if (options.writeFile) {
    const { resolvedPaths, ...configWithoutResolvedPaths } = newConfigWithRegistries;
    const configSpinner = spinner("Updating components.json.", {
      silent: options.silent
    }).start();
    const updatedConfig = rawConfigSchema.parse(configWithoutResolvedPaths);
    await fs11.writeFile(
      path4__default.resolve(config.resolvedPaths.cwd, "components.json"),
      JSON.stringify(updatedConfig, null, 2) + "\n",
      "utf-8"
    );
    configSpinner.succeed();
  }
  return {
    config: newConfigWithRegistries,
    newRegistries: Object.keys(foundRegistries)
  };
}
var DEFAULT_PRESETS = {
  nova: {
    title: "Nova",
    description: "Lucide / Geist",
    style: "nova",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "lucide",
    font: "geist",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  vega: {
    title: "Vega",
    description: "Lucide / Inter",
    style: "vega",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "lucide",
    font: "inter",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  maia: {
    title: "Maia",
    description: "Hugeicons / Figtree",
    style: "maia",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "hugeicons",
    font: "figtree",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  lyra: {
    title: "Lyra",
    description: "Phosphor / JetBrains Mono",
    style: "lyra",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "phosphor",
    font: "jetbrains-mono",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  mira: {
    title: "Mira",
    description: "Hugeicons / Inter",
    style: "mira",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "hugeicons",
    font: "inter",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  luma: {
    title: "Luma",
    description: "Lucide / Inter",
    style: "luma",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "lucide",
    font: "inter",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  sera: {
    title: "Sera",
    description: "Lucide / Noto Sans + Playfair Display",
    style: "sera",
    baseColor: "taupe",
    theme: "taupe",
    chartColor: "taupe",
    iconLibrary: "lucide",
    font: "noto-sans",
    fontHeading: "playfair-display",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  "yyc3-dark": {
    title: "YYC\xB3 Dark",
    description: "Lucide / Geist / Cyberpunk Neon",
    style: "nova",
    baseColor: "zinc",
    theme: "zinc",
    chartColor: "zinc",
    iconLibrary: "lucide",
    font: "geist",
    fontHeading: "inherit",
    menuAccent: "bold",
    menuColor: "inverted",
    radius: "default",
    rtl: false
  },
  "yyc3-light": {
    title: "YYC\xB3 Light",
    description: "Lucide / Inter / Clean Business",
    style: "nova",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "lucide",
    font: "inter",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  },
  "yyc3-brand": {
    title: "YYC\xB3 Brand",
    description: "Lucide / Geist / YYC\xB3 Brand Colors",
    style: "nova",
    baseColor: "neutral",
    theme: "neutral",
    chartColor: "neutral",
    iconLibrary: "lucide",
    font: "geist",
    fontHeading: "inherit",
    menuAccent: "subtle",
    menuColor: "default",
    radius: "default",
    rtl: false
  }
};
function resolveCreateUrl(searchParams) {
  const url = new URL(`${SHADCN_URL}/create`);
  const { rtl, pointer, ...params } = searchParams ?? {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== void 0) {
      url.searchParams.set(key, String(value));
    }
  }
  if (rtl) {
    url.searchParams.set("rtl", "true");
  }
  if (pointer) {
    url.searchParams.set("pointer", "true");
  }
  return url.toString();
}
async function promptToOpenPresetBuilder(options) {
  logger.break();
  logger.log(
    `  Build your custom preset on ${highlighter.info(options.createUrl)}`
  );
  logger.log(`  ${options.followUp}`);
  logger.break();
  if (options.prompt === false) {
    return;
  }
  const { proceed } = await prompts5({
    type: "confirm",
    name: "proceed",
    message: "Open in browser?",
    initial: true
  });
  if (proceed) {
    await open(options.createUrl);
  }
}
function resolveInitUrl(preset, options) {
  const params = new URLSearchParams({
    base: preset.base,
    style: preset.style,
    baseColor: preset.baseColor,
    theme: preset.theme,
    iconLibrary: preset.iconLibrary,
    font: preset.font,
    rtl: String(preset.rtl ?? false),
    menuAccent: preset.menuAccent,
    menuColor: preset.menuColor,
    radius: preset.radius
  });
  if (preset.chartColor) {
    params.set("chartColor", preset.chartColor);
  }
  if (preset.fontHeading && preset.fontHeading !== "inherit") {
    params.set("fontHeading", preset.fontHeading);
  }
  if (options?.preset) {
    params.set("preset", options.preset);
  }
  if (options?.template) {
    params.set("template", options.template);
  }
  if (options?.only) {
    params.set("only", options.only);
  }
  if (options?.pointer) {
    params.set("pointer", "true");
  }
  params.set("track", "1");
  return `${SHADCN_URL}/init?${params.toString()}`;
}
async function promptForBase() {
  const { base } = await prompts5({
    type: "select",
    name: "base",
    message: `Select a ${highlighter.info("component library")}`,
    choices: [
      { title: "Radix", value: "radix" },
      { title: "Base", value: "base" }
    ]
  });
  if (!base) process.exit(1);
  return base;
}
async function promptForPreset(options) {
  const presets = Object.entries(DEFAULT_PRESETS);
  const { selectedPreset } = await prompts5({
    type: "select",
    name: "selectedPreset",
    message: `Which ${highlighter.info("preset")} would you like to use?`,
    choices: [
      ...presets.map(([name, preset2]) => ({
        title: preset2.title,
        description: preset2.description,
        value: name
      })),
      {
        title: "Custom",
        description: `Build your own at ${highlighter.info(`${SHADCN_URL}/create`)}`,
        value: "custom"
      }
    ]
  });
  if (!selectedPreset) {
    process.exit(1);
  }
  if (selectedPreset === "custom") {
    const createUrl = resolveCreateUrl({
      command: "init",
      rtl: options.rtl,
      pointer: options.pointer,
      base: options.base,
      ...options.template && { template: options.template }
    });
    await promptToOpenPresetBuilder({
      createUrl,
      followUp: `Then ${highlighter.info(
        "copy and run the command"
      )} from ui.shadcn.com.`
    });
    process.exit(0);
  }
  const preset = DEFAULT_PRESETS[selectedPreset];
  if (!preset) {
    process.exit(1);
  }
  return {
    url: resolveInitUrl(
      { ...preset, base: options.base, rtl: options.rtl },
      {
        template: options.template,
        pointer: options.pointer
      }
    ),
    base: options.base
  };
}
async function resolveRegistryBaseConfig(initUrl, cwd, options) {
  let shadowConfig = configWithDefaults(
    createConfig({
      resolvedPaths: {
        cwd
      },
      ...options?.registries && { registries: options.registries }
    })
  );
  const { config: updatedConfig } = await ensureRegistriesInConfig(
    [initUrl],
    shadowConfig,
    {
      silent: true,
      writeFile: false
    }
  );
  shadowConfig = updatedConfig;
  buildUrlAndHeadersForRegistryItem(initUrl, shadowConfig);
  const [item] = await getRegistryItems([initUrl], {
    config: shadowConfig,
    useCache: true
  });
  const registryBaseConfig = item?.type === "registry:base" && item.config ? item.config : void 0;
  let cleanUrl = initUrl;
  if (isShadcnInitUrl(initUrl)) {
    const url = new URL(initUrl);
    url.searchParams.delete("track");
    cleanUrl = url.toString();
  }
  return {
    registryBaseConfig,
    installStyleIndex: item?.extends !== "none",
    url: cleanUrl
  };
}
function isShadcnInitUrl(url) {
  try {
    return new URL(url).pathname === "/init" && url.startsWith(SHADCN_URL);
  } catch {
    return false;
  }
}
var GITHUB_REPO_URL = process.env.SHADCN_GITHUB_URL ?? "https://github.com/shadcn-ui/ui.git";
function createTemplate(config) {
  return {
    ...config,
    frameworks: config.frameworks ?? [],
    scaffold: config.scaffold ?? defaultScaffold({
      title: config.title,
      templateDir: config.templateDir
    }),
    postInit: config.postInit ?? defaultPostInit
  };
}
function resolveTemplate(template, { monorepo }) {
  if (!monorepo || !template.monorepo) {
    return template;
  }
  const m = template.monorepo;
  const resolved = {
    ...template,
    templateDir: m.templateDir,
    defaultProjectName: m.defaultProjectName ?? m.templateDir,
    init: m.init ?? template.init,
    files: m.files ?? template.files
  };
  resolved.scaffold = defaultScaffold({
    title: template.title,
    templateDir: m.templateDir
  });
  return resolved;
}
function getInstallArgs(packageManager) {
  switch (packageManager) {
    case "pnpm":
      return ["--no-frozen-lockfile"];
    default:
      return [];
  }
}
async function adaptWorkspaceConfig(projectPath, packageManager) {
  if (packageManager === "pnpm") {
    return;
  }
  const pnpmWorkspacePath = path4__default.join(projectPath, "pnpm-workspace.yaml");
  const packageJsonPath = path4__default.join(projectPath, "package.json");
  const lockFilePath = path4__default.join(projectPath, "pnpm-lock.yaml");
  if (fs11.existsSync(lockFilePath)) {
    await fs11.remove(lockFilePath);
  }
  const isMonorepo = fs11.existsSync(pnpmWorkspacePath);
  if (fs11.existsSync(packageJsonPath)) {
    const packageJsonContent = await fs11.readFile(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonContent);
    if (isMonorepo) {
      packageJson.packageManager = await getPackageManagerVersion(packageManager);
    } else {
      delete packageJson.packageManager;
    }
    if (isMonorepo) {
      const workspaceContent = await fs11.readFile(pnpmWorkspacePath, "utf8");
      const patterns = [];
      for (const line of workspaceContent.split("\n")) {
        const match = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
        if (match) {
          patterns.push(match[1]);
        }
      }
      packageJson.workspaces = patterns;
      await fs11.remove(pnpmWorkspacePath);
    }
    await fs11.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n"
    );
  }
  if (isMonorepo && packageManager === "npm") {
    await rewriteWorkspaceProtocol(projectPath);
  }
}
async function getPackageManagerVersion(packageManager) {
  try {
    const { stdout } = await execa(packageManager, ["--version"]);
    return `${packageManager}@${stdout.trim()}`;
  } catch {
    return `${packageManager}@*`;
  }
}
async function rewriteWorkspaceProtocol(dir) {
  const entries = await fs11.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules") continue;
    const fullPath = path4__default.join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteWorkspaceProtocol(fullPath);
    } else if (entry.name === "package.json") {
      const content = await fs11.readFile(fullPath, "utf8");
      if (!content.includes("workspace:")) continue;
      const pkg = JSON.parse(content);
      let changed = false;
      for (const depKey of [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies"
      ]) {
        const deps = pkg[depKey];
        if (!deps) continue;
        for (const [name, version] of Object.entries(deps)) {
          if (typeof version === "string" && version.startsWith("workspace:")) {
            deps[name] = "*";
            changed = true;
          }
        }
      }
      if (changed) {
        await fs11.writeFile(fullPath, JSON.stringify(pkg, null, 2) + "\n");
      }
    }
  }
}
function defaultScaffold({
  title,
  templateDir
}) {
  return async ({ projectPath, packageManager }) => {
    const createSpinner = spinner(
      `Creating a new ${title} project. This may take a few minutes.`
    ).start();
    try {
      const localTemplateDir = process.env.SHADCN_TEMPLATE_DIR;
      if (localTemplateDir) {
        const localTemplatePath = path4__default.resolve(localTemplateDir, templateDir);
        await fs11.copy(localTemplatePath, projectPath, {
          filter: (src) => !src.includes("node_modules")
        });
      } else {
        const templatePath = path4__default.join(
          os.tmpdir(),
          `shadcn-template-${Date.now()}`
        );
        await execa("git", [
          "clone",
          "--depth",
          "1",
          "--filter=blob:none",
          "--sparse",
          GITHUB_REPO_URL,
          templatePath
        ]);
        await execa("git", [
          "-C",
          templatePath,
          "sparse-checkout",
          "set",
          `templates/${templateDir}`
        ]);
        const extractedPath = path4__default.resolve(
          templatePath,
          "templates",
          templateDir
        );
        await fs11.move(extractedPath, projectPath);
        await fs11.remove(templatePath);
      }
      await adaptWorkspaceConfig(projectPath, packageManager);
      const installArgs = getInstallArgs(packageManager);
      const args = ["install", ...installArgs];
      await execa(packageManager, args, {
        cwd: projectPath
      });
      const packageJsonPath = path4__default.join(projectPath, "package.json");
      if (fs11.existsSync(packageJsonPath)) {
        const packageJsonContent = await fs11.readFile(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonContent);
        packageJson.name = path4__default.basename(projectPath);
        await fs11.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + "\n"
        );
      }
      createSpinner?.succeed(`Creating a new ${title} project.`);
    } catch (error) {
      createSpinner?.fail(
        `Something went wrong creating a new ${title} project.`
      );
      handleError(error);
    }
  };
}
async function defaultPostInit({ projectPath }) {
  try {
    await execa("git", ["init"], { cwd: projectPath });
    await execa("git", ["add", "-A"], { cwd: projectPath });
    await execa("git", ["commit", "-m", "feat: initial commit"], {
      cwd: projectPath
    });
  } catch {
  }
}

// src/utils/font-markers.ts
var FONT_MARKERS_BY_VARIABLE = {
  "--font-heading": "cn-font-heading"
};
function normalizeVariable(variable) {
  return variable.startsWith("--") ? variable : `--${variable}`;
}
function getSupportedFontMarkers2(sources) {
  const supportedMarkers = /* @__PURE__ */ new Set();
  for (const source of sources) {
    for (const font of source.fonts ?? []) {
      const variable = font.font?.variable;
      if (!variable) {
        continue;
      }
      const marker = FONT_MARKERS_BY_VARIABLE[variable];
      if (marker) {
        supportedMarkers.add(marker);
      }
    }
    for (const vars of Object.values(source.cssVars ?? {})) {
      for (const key of Object.keys(vars ?? {})) {
        const marker = FONT_MARKERS_BY_VARIABLE[normalizeVariable(key)];
        if (marker) {
          supportedMarkers.add(marker);
        }
      }
    }
  }
  return Array.from(supportedMarkers);
}
function isSafeTarget(targetPath, cwd) {
  if (targetPath.includes("\0")) {
    return false;
  }
  let decodedPath;
  try {
    decodedPath = targetPath;
    let prevPath = "";
    while (decodedPath !== prevPath && decodedPath.includes("%")) {
      prevPath = decodedPath;
      decodedPath = decodeURIComponent(decodedPath);
    }
  } catch {
    return false;
  }
  const normalizedTarget = path4__default.normalize(decodedPath.replace(/\\/g, "/"));
  const normalizedRoot = path4__default.normalize(cwd);
  const hasPathTraversal = (path45) => {
    const withoutBrackets = path45.replace(/\[\.\.\..*?\]/g, "");
    return withoutBrackets.includes("..");
  };
  if (hasPathTraversal(normalizedTarget) || hasPathTraversal(decodedPath) || hasPathTraversal(targetPath)) {
    return false;
  }
  const cleanPath = (path45) => path45.replace(/\[\.\.\..*?\]/g, "");
  const cleanTarget = cleanPath(targetPath);
  const cleanDecoded = cleanPath(decodedPath);
  const suspiciousPatterns = [
    /\.\.[\/\\]/,
    // ../ or ..\
    /[\/\\]\.\./,
    // /.. or \..
    /\.\./,
    // .. anywhere
    /\.\.%/,
    // URL encoded traversal
    /\x00/,
    // null byte
    /[\x01-\x1f]/
    // control characters
  ];
  if (suspiciousPatterns.some(
    (pattern) => pattern.test(cleanTarget) || pattern.test(cleanDecoded)
  )) {
    return false;
  }
  if ((targetPath.includes("~") || decodedPath.includes("~")) && (targetPath.includes("../") || decodedPath.includes("../"))) {
    return false;
  }
  const driveLetterRegex = /^[a-zA-Z]:[\/\\]/;
  if (driveLetterRegex.test(decodedPath)) {
    if (process.platform === "win32") {
      return decodedPath.toLowerCase().startsWith(cwd.toLowerCase());
    }
    return false;
  }
  if (path4__default.isAbsolute(normalizedTarget)) {
    return normalizedTarget.startsWith(normalizedRoot + path4__default.sep);
  }
  const resolvedPath = path4__default.resolve(normalizedRoot, normalizedTarget);
  return resolvedPath.startsWith(normalizedRoot + path4__default.sep) || resolvedPath === normalizedRoot;
}
async function updateCssVars(cssVars, config, options) {
  if (!config.resolvedPaths.tailwindCss || !Object.keys(cssVars ?? {}).length) {
    return;
  }
  options = {
    cleanupDefaultNextStyles: false,
    silent: false,
    tailwindVersion: "v3",
    overwriteCssVars: false,
    ...options
  };
  const cssFilepath = config.resolvedPaths.tailwindCss;
  const cssFilepathRelative = path4__default.relative(
    config.resolvedPaths.cwd,
    cssFilepath
  );
  const cssVarsSpinner = spinner(
    `Updating CSS variables in ${highlighter.info(cssFilepathRelative)}`,
    {
      silent: options.silent
    }
  ).start();
  const raw = await promises.readFile(cssFilepath, "utf8");
  let output = await transformCssVars2(raw, cssVars ?? {}, config, {
    cleanupDefaultNextStyles: options.cleanupDefaultNextStyles,
    tailwindVersion: options.tailwindVersion,
    tailwindConfig: options.tailwindConfig,
    overwriteCssVars: options.overwriteCssVars
  });
  await promises.writeFile(cssFilepath, output, "utf8");
  cssVarsSpinner.succeed();
}
async function transformCssVars2(input, cssVars, config, options = {
  cleanupDefaultNextStyles: false,
  tailwindVersion: "v3",
  tailwindConfig: void 0,
  overwriteCssVars: false
}) {
  options = {
    cleanupDefaultNextStyles: false,
    tailwindVersion: "v3",
    tailwindConfig: void 0,
    overwriteCssVars: false,
    ...options
  };
  let plugins = [updateCssVarsPlugin(cssVars)];
  if (options.cleanupDefaultNextStyles) {
    plugins.push(cleanupDefaultNextStylesPlugin());
  }
  if (options.tailwindVersion === "v4") {
    plugins = [];
    plugins.push(addCustomVariant({ params: "dark (&:is(.dark *))" }));
    if (options.cleanupDefaultNextStyles) {
      plugins.push(cleanupDefaultNextStylesPlugin());
    }
    plugins.push(
      updateCssVarsPluginV4(cssVars, {
        overwriteCssVars: options.overwriteCssVars
      })
    );
    plugins.push(updateThemePlugin(cssVars));
    if (options.tailwindConfig) {
      plugins.push(updateTailwindConfigPlugin(options.tailwindConfig));
      plugins.push(updateTailwindConfigAnimationPlugin(options.tailwindConfig));
      plugins.push(updateTailwindConfigKeyframesPlugin(options.tailwindConfig));
    }
  }
  const result = await postcss2(plugins).process(input, {
    from: void 0
  });
  let output = result.css;
  output = output.replace(/\/\* ---break--- \*\//g, "");
  if (options.tailwindVersion === "v4") {
    output = output.replace(/(\n\s*\n)+/g, "\n\n");
  }
  return output;
}
function updateCssVarsPlugin(cssVars) {
  return {
    postcssPlugin: "update-css-vars",
    Once(root) {
      let baseLayer = root.nodes.find(
        (node) => node.type === "atrule" && node.name === "layer" && node.params === "base"
      );
      if (!(baseLayer instanceof AtRule)) {
        baseLayer = postcss2.atRule({
          name: "layer",
          params: "base",
          nodes: [],
          raws: {
            semicolon: true,
            before: "\n",
            between: " "
          }
        });
        root.append(baseLayer);
        root.insertBefore(baseLayer, postcss2.comment({ text: "---break---" }));
      }
      if (baseLayer !== void 0) {
        Object.entries(cssVars).forEach(([key, vars]) => {
          const selector = key === "light" ? ":root" : `.${key}`;
          addOrUpdateVars(baseLayer, selector, vars);
        });
      }
    }
  };
}
function removeConflictVars(root) {
  const rootRule = root.nodes.find(
    (node) => node.type === "rule" && node.selector === ":root"
  );
  if (rootRule) {
    const propsToRemove = ["--background", "--foreground"];
    rootRule.nodes.filter(
      (node) => node.type === "decl" && propsToRemove.includes(node.prop)
    ).forEach((node) => node.remove());
    if (rootRule.nodes.length === 0) {
      rootRule.remove();
    }
  }
}
function cleanupDefaultNextStylesPlugin() {
  return {
    postcssPlugin: "cleanup-default-next-styles",
    Once(root) {
      const bodyRule = root.nodes.find(
        (node) => node.type === "rule" && node.selector === "body"
      );
      if (bodyRule) {
        bodyRule.nodes.find(
          (node) => node.type === "decl" && node.prop === "color" && ["rgb(var(--foreground-rgb))", "var(--foreground)"].includes(
            node.value
          )
        )?.remove();
        bodyRule.nodes.find((node) => {
          return node.type === "decl" && node.prop === "background" && // This is only going to run on create project, so all good.
          (node.value.startsWith("linear-gradient") || node.value === "var(--background)");
        })?.remove();
        bodyRule.nodes.find(
          (node) => node.type === "decl" && node.prop === "font-family" && node.value === "Arial, Helvetica, sans-serif"
        )?.remove();
        if (bodyRule.nodes.length === 0) {
          bodyRule.remove();
        }
      }
      removeConflictVars(root);
      const darkRootRule = root.nodes.find(
        (node) => node.type === "atrule" && node.params === "(prefers-color-scheme: dark)"
      );
      if (darkRootRule) {
        removeConflictVars(darkRootRule);
        if (darkRootRule.nodes.length === 0) {
          darkRootRule.remove();
        }
      }
    }
  };
}
function addOrUpdateVars(baseLayer, selector, vars) {
  let ruleNode = baseLayer.nodes?.find(
    (node) => node.type === "rule" && node.selector === selector
  );
  if (!ruleNode) {
    if (Object.keys(vars).length > 0) {
      ruleNode = postcss2.rule({
        selector,
        raws: { between: " ", before: "\n  " }
      });
      baseLayer.append(ruleNode);
    }
  }
  Object.entries(vars).forEach(([key, value]) => {
    const prop = `--${key.replace(/^--/, "")}`;
    const newDecl = postcss2.decl({
      prop,
      value,
      raws: { semicolon: true }
    });
    const existingDecl = ruleNode?.nodes.find(
      (node) => node.type === "decl" && node.prop === prop
    );
    existingDecl ? existingDecl.replaceWith(newDecl) : ruleNode?.append(newDecl);
  });
}
function updateCssVarsPluginV4(cssVars, options) {
  return {
    postcssPlugin: "update-css-vars-v4",
    Once(root) {
      Object.entries(cssVars).forEach(([key, vars]) => {
        let selector = key === "light" ? ":root" : `.${key}`;
        if (key === "theme") {
          selector = "@theme";
          const themeNode = upsertThemeNode(root);
          Object.entries(vars).forEach(([key2, value]) => {
            const prop = `--${key2.replace(/^--/, "")}`;
            const newDecl = postcss2.decl({
              prop,
              value,
              raws: { semicolon: true }
            });
            const existingDecl = themeNode?.nodes?.find(
              (node) => node.type === "decl" && node.prop === prop
            );
            if (options.overwriteCssVars) {
              if (existingDecl) {
                existingDecl.replaceWith(newDecl);
              } else {
                themeNode?.append(newDecl);
              }
            } else {
              if (!existingDecl) {
                themeNode?.append(newDecl);
              }
            }
          });
          return;
        }
        let ruleNode = root.nodes?.find(
          (node) => node.type === "rule" && node.selector === selector
        );
        if (!ruleNode && Object.keys(vars).length > 0) {
          ruleNode = postcss2.rule({
            selector,
            nodes: [],
            raws: { semicolon: true, between: " ", before: "\n" }
          });
          root.append(ruleNode);
          root.insertBefore(ruleNode, postcss2.comment({ text: "---break---" }));
        }
        Object.entries(vars).forEach(([key2, value]) => {
          let prop = `--${key2.replace(/^--/, "")}`;
          if (prop === "--sidebar-background") {
            prop = "--sidebar";
          }
          if (isLocalHSLValue(value)) {
            value = `hsl(${value})`;
          }
          const newDecl = postcss2.decl({
            prop,
            value,
            raws: { semicolon: true }
          });
          const existingDecl = ruleNode?.nodes.find(
            (node) => node.type === "decl" && node.prop === prop
          );
          if (options.overwriteCssVars) {
            if (existingDecl) {
              existingDecl.replaceWith(newDecl);
            } else {
              ruleNode?.append(newDecl);
            }
          } else {
            if (!existingDecl) {
              ruleNode?.append(newDecl);
            }
          }
        });
      });
    }
  };
}
function updateThemePlugin(cssVars) {
  return {
    postcssPlugin: "update-theme",
    Once(root) {
      const variables = Array.from(
        new Set(
          Object.keys(cssVars).flatMap(
            (key) => Object.keys(cssVars[key] || {})
          )
        )
      );
      if (!variables.length) {
        return;
      }
      const themeNode = upsertThemeNode(root);
      const themeVarNodes = themeNode.nodes?.filter(
        (node) => node.type === "decl" && node.prop.startsWith("--")
      );
      for (const variable of variables) {
        const value = Object.values(cssVars).find((vars) => vars[variable])?.[variable];
        if (!value) {
          continue;
        }
        if (variable === "radius") {
          const radiusVariables = {
            sm: "calc(var(--radius) * 0.6)",
            md: "calc(var(--radius) * 0.8)",
            lg: "var(--radius)",
            xl: "calc(var(--radius) * 1.4)",
            "2xl": "calc(var(--radius) * 1.8)",
            "3xl": "calc(var(--radius) * 2.2)",
            "4xl": "calc(var(--radius) * 2.6)"
          };
          for (const [key, value2] of Object.entries(radiusVariables)) {
            const cssVarNode2 = postcss2.decl({
              prop: `--radius-${key}`,
              value: value2,
              raws: { semicolon: true }
            });
            if (themeNode?.nodes?.find(
              (node) => node.type === "decl" && node.prop === cssVarNode2.prop
            )) {
              continue;
            }
            themeNode?.append(cssVarNode2);
          }
          continue;
        }
        let prop = isLocalHSLValue(value) || isColorValue(value) ? `--color-${variable.replace(/^--/, "")}` : `--${variable.replace(/^--/, "")}`;
        if (prop === "--color-sidebar-background") {
          prop = "--color-sidebar";
        }
        let propValue = `var(--${variable})`;
        if (prop === "--color-sidebar") {
          propValue = "var(--sidebar)";
        }
        const cssVarNode = postcss2.decl({
          prop,
          value: propValue,
          raws: { semicolon: true }
        });
        const existingDecl = themeNode?.nodes?.find(
          (node) => node.type === "decl" && node.prop === cssVarNode.prop
        );
        if (!existingDecl) {
          if (themeVarNodes?.length) {
            themeNode?.insertAfter(
              themeVarNodes[themeVarNodes.length - 1],
              cssVarNode
            );
          } else {
            themeNode?.append(cssVarNode);
          }
        }
      }
    }
  };
}
function upsertThemeNode(root) {
  let themeNode = root.nodes.find(
    (node) => node.type === "atrule" && node.name === "theme" && node.params === "inline"
  );
  if (!themeNode) {
    themeNode = postcss2.atRule({
      name: "theme",
      params: "inline",
      nodes: [],
      raws: { semicolon: true, between: " ", before: "\n" }
    });
    root.append(themeNode);
    root.insertBefore(themeNode, postcss2.comment({ text: "---break---" }));
  }
  return themeNode;
}
function addCustomVariant({ params }) {
  return {
    postcssPlugin: "add-custom-variant",
    Once(root) {
      const customVariant = root.nodes.find(
        (node) => node.type === "atrule" && node.name === "custom-variant"
      );
      if (!customVariant) {
        const importNodes = root.nodes.filter(
          (node) => node.type === "atrule" && node.name === "import"
        );
        const variantNode = postcss2.atRule({
          name: "custom-variant",
          params,
          raws: { semicolon: true, before: "\n" }
        });
        if (importNodes.length > 0) {
          const lastImport = importNodes[importNodes.length - 1];
          root.insertAfter(lastImport, variantNode);
        } else {
          root.insertAfter(root.nodes[0], variantNode);
        }
        root.insertBefore(variantNode, postcss2.comment({ text: "---break---" }));
      }
    }
  };
}
function updateTailwindConfigPlugin(tailwindConfig) {
  return {
    postcssPlugin: "update-tailwind-config",
    Once(root) {
      if (!tailwindConfig?.plugins) {
        return;
      }
      const quoteType = getQuoteType(root);
      const quote = quoteType === "single" ? "'" : '"';
      const pluginNodes = root.nodes.filter(
        (node) => node.type === "atrule" && node.name === "plugin"
      );
      const lastPluginNode = pluginNodes[pluginNodes.length - 1] || root.nodes[0];
      for (const plugin of tailwindConfig.plugins) {
        const pluginName = plugin.replace(/^require\(["']|["']\)$/g, "");
        if (pluginNodes.some((node) => {
          return node.params.replace(/["']/g, "") === pluginName;
        })) {
          continue;
        }
        const pluginNode = postcss2.atRule({
          name: "plugin",
          params: `${quote}${pluginName}${quote}`,
          raws: { semicolon: true, before: "\n" }
        });
        root.insertAfter(lastPluginNode, pluginNode);
        root.insertBefore(pluginNode, postcss2.comment({ text: "---break---" }));
      }
    }
  };
}
function updateTailwindConfigKeyframesPlugin(tailwindConfig) {
  return {
    postcssPlugin: "update-tailwind-config-keyframes",
    Once(root) {
      if (!tailwindConfig?.theme?.extend?.keyframes) {
        return;
      }
      const themeNode = upsertThemeNode(root);
      const existingKeyFrameNodes = themeNode.nodes?.filter(
        (node) => node.type === "atrule" && node.name === "keyframes"
      );
      const keyframeValueSchema = z.record(
        z.string(),
        z.record(z.string(), z.string())
      );
      for (const [keyframeName, keyframeValue] of Object.entries(
        tailwindConfig.theme.extend.keyframes
      )) {
        if (typeof keyframeName !== "string") {
          continue;
        }
        const parsedKeyframeValue = keyframeValueSchema.safeParse(keyframeValue);
        if (!parsedKeyframeValue.success) {
          continue;
        }
        if (existingKeyFrameNodes?.find(
          (node) => node.type === "atrule" && node.name === "keyframes" && node.params === keyframeName
        )) {
          continue;
        }
        const keyframeNode = postcss2.atRule({
          name: "keyframes",
          params: keyframeName,
          nodes: [],
          raws: { semicolon: true, between: " ", before: "\n  " }
        });
        for (const [key, values] of Object.entries(parsedKeyframeValue.data)) {
          const rule = postcss2.rule({
            selector: key,
            nodes: Object.entries(values).map(
              ([key2, value]) => postcss2.decl({
                prop: key2,
                value,
                raws: { semicolon: true, before: "\n      ", between: ": " }
              })
            ),
            raws: { semicolon: true, between: " ", before: "\n    " }
          });
          keyframeNode.append(rule);
        }
        themeNode.append(keyframeNode);
        themeNode.insertBefore(
          keyframeNode,
          postcss2.comment({ text: "---break---" })
        );
      }
    }
  };
}
function updateTailwindConfigAnimationPlugin(tailwindConfig) {
  return {
    postcssPlugin: "update-tailwind-config-animation",
    Once(root) {
      if (!tailwindConfig?.theme?.extend?.animation) {
        return;
      }
      const themeNode = upsertThemeNode(root);
      const existingAnimationNodes = themeNode.nodes?.filter(
        (node) => node.type === "decl" && node.prop.startsWith("--animate-")
      );
      const parsedAnimationValue = z.record(z.string(), z.string()).safeParse(tailwindConfig.theme.extend.animation);
      if (!parsedAnimationValue.success) {
        return;
      }
      for (const [key, value] of Object.entries(parsedAnimationValue.data)) {
        const prop = `--animate-${key}`;
        if (existingAnimationNodes?.find(
          (node) => node.prop === prop
        )) {
          continue;
        }
        const animationNode = postcss2.decl({
          prop,
          value,
          raws: { semicolon: true, between: ": ", before: "\n  " }
        });
        themeNode.append(animationNode);
      }
    }
  };
}
function getQuoteType(root) {
  const firstNode = root.nodes[0];
  const raw = firstNode.toString();
  if (raw.includes("'")) {
    return "single";
  }
  return "double";
}
function isLocalHSLValue(value) {
  if (value.startsWith("hsl") || value.startsWith("rgb") || value.startsWith("#") || value.startsWith("oklch")) {
    return false;
  }
  const chunks = value.split(" ");
  return chunks.length === 3 && chunks.slice(1, 3).every((chunk) => chunk.includes("%"));
}
function isColorValue(value) {
  return value.startsWith("hsl") || value.startsWith("rgb") || value.startsWith("#") || value.startsWith("oklch") || value.includes("--color-");
}
async function updateCss(css, config, options) {
  const hasCss = css && Object.keys(css).length > 0;
  const hasCssVars = Object.keys(options.cssVars ?? {}).length > 0;
  if (!config.resolvedPaths.tailwindCss || !hasCss && !hasCssVars) {
    return;
  }
  options = {
    silent: false,
    ...options
  };
  const cssFilepath = config.resolvedPaths.tailwindCss;
  const cssFilepathRelative = path4__default.relative(
    config.resolvedPaths.cwd,
    cssFilepath
  );
  const cssSpinner = spinner(
    `Updating ${highlighter.info(cssFilepathRelative)}`,
    {
      silent: options.silent
    }
  ).start();
  let output = await promises.readFile(cssFilepath, "utf8");
  if (hasCssVars) {
    output = await transformCssVars2(output, options.cssVars, config, {
      cleanupDefaultNextStyles: options.cleanupDefaultNextStyles,
      tailwindVersion: options.tailwindVersion,
      tailwindConfig: options.tailwindConfig,
      overwriteCssVars: options.overwriteCssVars
    });
  }
  if (hasCss) {
    output = await transformCss(output, css);
  }
  await promises.writeFile(cssFilepath, output, "utf8");
  cssSpinner.succeed();
}
async function transformCss(input, css) {
  const plugins = [updateCssPlugin(css)];
  const result = await postcss2(plugins).process(input, {
    from: void 0
  });
  let output = result.css;
  const root = result.root;
  if (root.nodes && root.nodes.length > 0) {
    const lastNode = root.nodes[root.nodes.length - 1];
    if (lastNode.type === "atrule" && !lastNode.nodes && !output.trimEnd().endsWith(";")) {
      output = output.trimEnd() + ";";
    }
  }
  output = output.replace(/\/\* ---break--- \*\//g, "");
  output = output.replace(/(\n\s*\n)+/g, "\n\n");
  output = output.trimEnd();
  return output;
}
function updateCssPlugin(css) {
  return {
    postcssPlugin: "update-css",
    Once(root) {
      for (const [selector, properties] of Object.entries(css)) {
        if (selector.startsWith("@")) {
          const atRuleMatch = selector.match(/@([a-zA-Z-]+)\s*(.*)/);
          if (!atRuleMatch) continue;
          const [, name, params] = atRuleMatch;
          if (name === "import") {
            const existingImport = root.nodes?.find(
              (node) => node.type === "atrule" && node.name === "import" && node.params === params
            );
            if (!existingImport) {
              const importRule = postcss2.atRule({
                name: "import",
                params,
                raws: { semicolon: true }
              });
              const importNodes = root.nodes?.filter(
                (node) => node.type === "atrule" && node.name === "import"
              );
              if (importNodes && importNodes.length > 0) {
                const lastImport = importNodes[importNodes.length - 1];
                importRule.raws.before = "\n";
                root.insertAfter(lastImport, importRule);
              } else {
                if (!root.nodes || root.nodes.length === 0) {
                  importRule.raws.before = "";
                } else {
                  importRule.raws.before = "";
                }
                root.prepend(importRule);
              }
            }
          } else if (name === "plugin") {
            let quotedParams = params;
            if (params && !params.startsWith('"') && !params.startsWith("'")) {
              quotedParams = `"${params}"`;
            }
            const normalizeParams = (p) => {
              if (p.startsWith('"') && p.endsWith('"')) {
                return p.slice(1, -1);
              }
              if (p.startsWith("'") && p.endsWith("'")) {
                return p.slice(1, -1);
              }
              return p;
            };
            const existingPlugin = root.nodes?.find((node) => {
              if (node.type !== "atrule" || node.name !== "plugin") {
                return false;
              }
              return normalizeParams(node.params) === normalizeParams(params);
            });
            if (!existingPlugin) {
              const pluginRule = postcss2.atRule({
                name: "plugin",
                params: quotedParams,
                raws: { semicolon: true, before: "\n" }
              });
              const importNodes = root.nodes?.filter(
                (node) => node.type === "atrule" && node.name === "import"
              );
              const pluginNodes = root.nodes?.filter(
                (node) => node.type === "atrule" && node.name === "plugin"
              );
              if (pluginNodes && pluginNodes.length > 0) {
                const lastPlugin = pluginNodes[pluginNodes.length - 1];
                root.insertAfter(lastPlugin, pluginRule);
              } else if (importNodes && importNodes.length > 0) {
                const lastImport = importNodes[importNodes.length - 1];
                root.insertAfter(lastImport, pluginRule);
                root.insertBefore(
                  pluginRule,
                  postcss2.comment({ text: "---break---" })
                );
                root.insertAfter(
                  pluginRule,
                  postcss2.comment({ text: "---break---" })
                );
              } else {
                root.prepend(pluginRule);
                root.insertBefore(
                  pluginRule,
                  postcss2.comment({ text: "---break---" })
                );
                root.insertAfter(
                  pluginRule,
                  postcss2.comment({ text: "---break---" })
                );
              }
            }
          } else if (typeof properties === "object" && Object.keys(properties).length === 0) {
            const atRule = root.nodes?.find(
              (node) => node.type === "atrule" && node.name === name && node.params === params
            );
            if (!atRule) {
              const newAtRule = postcss2.atRule({
                name,
                params,
                raws: { semicolon: true }
              });
              root.append(newAtRule);
              root.insertBefore(
                newAtRule,
                postcss2.comment({ text: "---break---" })
              );
            }
          } else if (name === "keyframes") {
            let themeInline = root.nodes?.find(
              (node) => node.type === "atrule" && node.name === "theme" && node.params === "inline"
            );
            if (!themeInline) {
              themeInline = postcss2.atRule({
                name: "theme",
                params: "inline",
                raws: { semicolon: true, between: " ", before: "\n" }
              });
              root.append(themeInline);
              root.insertBefore(
                themeInline,
                postcss2.comment({ text: "---break---" })
              );
            }
            const existingKeyframesRule = themeInline.nodes?.find(
              (node) => node.type === "atrule" && node.name === "keyframes" && node.params === params
            );
            let keyframesRule;
            if (existingKeyframesRule) {
              keyframesRule = postcss2.atRule({
                name: "keyframes",
                params,
                raws: { semicolon: true, between: " ", before: "\n  " }
              });
              existingKeyframesRule.replaceWith(keyframesRule);
            } else {
              keyframesRule = postcss2.atRule({
                name: "keyframes",
                params,
                raws: { semicolon: true, between: " ", before: "\n  " }
              });
              themeInline.append(keyframesRule);
            }
            if (typeof properties === "object") {
              for (const [step, stepProps] of Object.entries(properties)) {
                processRule(keyframesRule, step, stepProps);
              }
            }
          } else if (name === "utility") {
            const utilityAtRule = root.nodes?.find(
              (node) => node.type === "atrule" && node.name === name && node.params === params
            );
            if (!utilityAtRule) {
              const atRule = postcss2.atRule({
                name,
                params,
                raws: { semicolon: true, between: " ", before: "\n" }
              });
              root.append(atRule);
              root.insertBefore(
                atRule,
                postcss2.comment({ text: "---break---" })
              );
              if (typeof properties === "object") {
                for (const [prop, value] of Object.entries(properties)) {
                  if (typeof value === "string") {
                    const decl = postcss2.decl({
                      prop,
                      value,
                      raws: { semicolon: true, before: "\n    " }
                    });
                    atRule.append(decl);
                  } else if (prop.startsWith("@") && typeof value === "object" && value !== null && Object.keys(value).length === 0) {
                    const atRuleMatch2 = prop.match(/@([a-zA-Z-]+)\s*(.*)/);
                    if (atRuleMatch2) {
                      const [, atRuleName, atRuleParams] = atRuleMatch2;
                      const existingAtRule = atRule.nodes?.find(
                        (node) => node.type === "atrule" && node.name === atRuleName && node.params === atRuleParams
                      );
                      if (!existingAtRule) {
                        const newAtRule = postcss2.atRule({
                          name: atRuleName,
                          params: atRuleParams,
                          raws: { semicolon: true, before: "\n    " }
                        });
                        atRule.append(newAtRule);
                      }
                    }
                  } else if (typeof value === "object") {
                    processRule(atRule, prop, value);
                  }
                }
              }
            } else {
              if (typeof properties === "object") {
                for (const [prop, value] of Object.entries(properties)) {
                  if (typeof value === "string") {
                    const existingDecl = utilityAtRule.nodes?.find(
                      (node) => node.type === "decl" && node.prop === prop
                    );
                    const decl = postcss2.decl({
                      prop,
                      value,
                      raws: { semicolon: true, before: "\n    " }
                    });
                    existingDecl ? existingDecl.replaceWith(decl) : utilityAtRule.append(decl);
                  } else if (prop.startsWith("@") && typeof value === "object" && value !== null && Object.keys(value).length === 0) {
                    const atRuleMatch2 = prop.match(/@([a-zA-Z-]+)\s*(.*)/);
                    if (atRuleMatch2) {
                      const [, atRuleName, atRuleParams] = atRuleMatch2;
                      const existingAtRule = utilityAtRule.nodes?.find(
                        (node) => node.type === "atrule" && node.name === atRuleName && node.params === atRuleParams
                      );
                      if (!existingAtRule) {
                        const newAtRule = postcss2.atRule({
                          name: atRuleName,
                          params: atRuleParams,
                          raws: { semicolon: true, before: "\n    " }
                        });
                        utilityAtRule.append(newAtRule);
                      }
                    }
                  } else if (typeof value === "object") {
                    processRule(utilityAtRule, prop, value);
                  }
                }
              }
            }
          } else if (name === "property") {
            processRule(root, selector, properties);
          } else {
            processAtRule(root, name, params, properties);
          }
        } else {
          processRule(root, selector, properties);
        }
      }
    }
  };
}
function processAtRule(root, name, params, properties) {
  let atRule = root.nodes?.find(
    (node) => node.type === "atrule" && node.name === name && node.params === params
  );
  if (!atRule) {
    atRule = postcss2.atRule({
      name,
      params,
      raws: { semicolon: true, between: " ", before: "\n" }
    });
    root.append(atRule);
    root.insertBefore(atRule, postcss2.comment({ text: "---break---" }));
  }
  if (typeof properties === "object") {
    for (const [childSelector, childProps] of Object.entries(properties)) {
      if (childSelector.startsWith("@")) {
        const nestedMatch = childSelector.match(/@([a-zA-Z-]+)\s*(.*)/);
        if (nestedMatch) {
          const [, nestedName, nestedParams] = nestedMatch;
          processAtRule(atRule, nestedName, nestedParams, childProps);
        }
      } else {
        processRule(atRule, childSelector, childProps);
      }
    }
  } else if (typeof properties === "string") {
    try {
      const parsed = postcss2.parse(`.temp{${properties}}`);
      const tempRule = parsed.first;
      if (tempRule && tempRule.nodes) {
        const rule = postcss2.rule({
          selector: "temp",
          raws: { semicolon: true, between: " ", before: "\n  " }
        });
        tempRule.nodes.forEach((node) => {
          if (node.type === "decl") {
            const clone = node.clone();
            clone.raws.before = "\n    ";
            rule.append(clone);
          }
        });
        if (rule.nodes?.length) {
          atRule.append(rule);
        }
      }
    } catch (error) {
      console.error("Error parsing at-rule content:", properties, error);
      throw error;
    }
  }
}
function processRule(parent, selector, properties) {
  let rule = parent.nodes?.find(
    (node) => node.type === "rule" && node.selector === selector
  );
  if (!rule) {
    rule = postcss2.rule({
      selector,
      raws: { semicolon: true, between: " ", before: "\n  " }
    });
    parent.append(rule);
  }
  if (typeof properties === "object") {
    for (const [prop, value] of Object.entries(properties)) {
      if (prop.startsWith("@") && typeof value === "object" && value !== null && Object.keys(value).length === 0) {
        const atRuleMatch = prop.match(/@([a-zA-Z-]+)\s*(.*)/);
        if (atRuleMatch) {
          const [, atRuleName, atRuleParams] = atRuleMatch;
          const existingAtRule = rule.nodes?.find(
            (node) => node.type === "atrule" && node.name === atRuleName && node.params === atRuleParams
          );
          if (!existingAtRule) {
            if (atRuleName === "apply") {
              const existingApply = rule.nodes?.find(
                (node) => node.type === "atrule" && node.name === "apply"
              );
              if (existingApply) {
                existingApply.params = twMerge(
                  existingApply.params,
                  atRuleParams
                );
                continue;
              }
            }
            const atRule = postcss2.atRule({
              name: atRuleName,
              params: atRuleParams,
              raws: { semicolon: true, before: "\n    " }
            });
            rule.append(atRule);
          }
        }
      } else if (typeof value === "string") {
        const decl = postcss2.decl({
          prop,
          value,
          raws: { semicolon: true, before: "\n    " }
        });
        const existingDecl = rule.nodes?.find(
          (node) => node.type === "decl" && node.prop === prop
        );
        existingDecl ? existingDecl.replaceWith(decl) : rule.append(decl);
      } else if (typeof value === "object") {
        const nestedSelector = prop.startsWith("&") ? selector.replace(/^([^:]+)/, `$1${prop.substring(1)}`) : prop;
        processRule(parent, nestedSelector, value);
      }
    }
  } else if (typeof properties === "string") {
    try {
      const parsed = postcss2.parse(`.temp{${properties}}`);
      const tempRule = parsed.first;
      if (tempRule && tempRule.nodes) {
        tempRule.nodes.forEach((node) => {
          if (node.type === "decl") {
            const clone = node.clone();
            clone.raws.before = "\n    ";
            rule?.append(clone);
          }
        });
      }
    } catch (error) {
      console.error("Error parsing rule content:", selector, properties, error);
      throw error;
    }
  }
}
async function getPackageManager(targetDir, { withFallback } = {
  withFallback: false
}) {
  const packageManager = await detect({ programmatic: true, cwd: targetDir });
  if (packageManager === "yarn@berry") return "yarn";
  if (packageManager === "pnpm@6") return "pnpm";
  if (packageManager === "bun") return "bun";
  if (packageManager === "deno") return "deno";
  if (!withFallback) {
    return packageManager ?? "npm";
  }
  const userAgent = process.env.npm_config_user_agent || "";
  if (userAgent.startsWith("yarn")) {
    return "yarn";
  }
  if (userAgent.startsWith("pnpm")) {
    return "pnpm";
  }
  if (userAgent.startsWith("bun")) {
    return "bun";
  }
  return "npm";
}
async function getPackageRunner(cwd) {
  const packageManager = await getPackageManager(cwd);
  if (packageManager === "pnpm") return "pnpm dlx";
  if (packageManager === "bun") return "bunx";
  return "npx";
}
async function updateDependencies(dependencies, devDependencies, config, options) {
  dependencies = Array.from(new Set(dependencies));
  devDependencies = Array.from(new Set(devDependencies));
  if (!dependencies?.length && !devDependencies?.length) {
    return;
  }
  options = {
    silent: false,
    ...options
  };
  const dependenciesSpinner = spinner(`Installing dependencies.`, {
    silent: options.silent
  })?.start();
  const packageManager = await getUpdateDependenciesPackageManager(config);
  let flag = "";
  if (shouldPromptForNpmFlag(config) && packageManager === "npm") {
    if (options.silent) {
      flag = "force";
    } else {
      dependenciesSpinner.stopAndPersist();
      logger.warn(
        `
It looks like you are using React 19. 
Some packages may fail to install due to peer dependency issues in npm (see ${SHADCN_URL}/react-19).
`
      );
      const confirmation = await prompts5([
        {
          type: "select",
          name: "flag",
          message: "How would you like to proceed?",
          choices: [
            { title: "Use --force", value: "force" },
            { title: "Use --legacy-peer-deps", value: "legacy-peer-deps" }
          ]
        }
      ]);
      if (confirmation) {
        flag = confirmation.flag;
      }
    }
  }
  dependenciesSpinner?.start();
  await installWithPackageManager(
    packageManager,
    dependencies,
    devDependencies,
    config.resolvedPaths.cwd,
    flag
  );
  dependenciesSpinner?.succeed();
}
function shouldPromptForNpmFlag(config) {
  const packageInfo = getPackageInfo(config.resolvedPaths.cwd, false);
  if (!packageInfo?.dependencies?.react) {
    return false;
  }
  const hasReact19 = /^(?:\^|~)?19(?:\.\d+)*(?:-.*)?$/.test(
    packageInfo.dependencies.react
  );
  const hasReactDayPicker8 = packageInfo.dependencies["react-day-picker"]?.startsWith("8");
  return hasReact19 && hasReactDayPicker8;
}
async function getUpdateDependenciesPackageManager(config) {
  const expoVersion = getPackageInfo(config.resolvedPaths.cwd, false)?.dependencies?.expo;
  if (expoVersion) {
    return "expo";
  }
  return getPackageManager(config.resolvedPaths.cwd);
}
async function installWithPackageManager(packageManager, dependencies, devDependencies, cwd, flag) {
  if (packageManager === "npm") {
    return installWithNpm(dependencies, devDependencies, cwd, flag);
  }
  if (packageManager === "deno") {
    return installWithDeno(dependencies, devDependencies, cwd);
  }
  if (packageManager === "expo") {
    return installWithExpo(dependencies, devDependencies, cwd);
  }
  if (dependencies?.length) {
    await execa(packageManager, ["add", ...dependencies], {
      cwd
    });
  }
  if (devDependencies?.length) {
    await execa(packageManager, ["add", "-D", ...devDependencies], { cwd });
  }
}
async function installWithNpm(dependencies, devDependencies, cwd, flag) {
  if (dependencies.length) {
    await execa(
      "npm",
      ["install", ...flag ? [`--${flag}`] : [], ...dependencies],
      { cwd }
    );
  }
  if (devDependencies.length) {
    await execa(
      "npm",
      ["install", ...flag ? [`--${flag}`] : [], "-D", ...devDependencies],
      { cwd }
    );
  }
}
async function installWithDeno(dependencies, devDependencies, cwd) {
  if (dependencies?.length) {
    await execa("deno", ["add", ...dependencies.map((dep) => `npm:${dep}`)], {
      cwd
    });
  }
  if (devDependencies?.length) {
    await execa(
      "deno",
      ["add", "-D", ...devDependencies.map((dep) => `npm:${dep}`)],
      { cwd }
    );
  }
}
async function installWithExpo(dependencies, devDependencies, cwd) {
  if (dependencies.length) {
    await execa("npx", ["expo", "install", ...dependencies], { cwd });
  }
  if (devDependencies.length) {
    await execa("npx", ["expo", "install", "-- -D", ...devDependencies], {
      cwd
    });
  }
}
async function updateEnvVars(envVars, config, options) {
  if (!envVars || Object.keys(envVars).length === 0) {
    return {
      envVarsAdded: [],
      envFileUpdated: null,
      envFileCreated: null
    };
  }
  options = {
    silent: false,
    ...options
  };
  const envSpinner = spinner(`Adding environment variables.`, {
    silent: options.silent
  })?.start();
  const projectRoot = config.resolvedPaths.cwd;
  let envFilePath = path4__default.join(projectRoot, ".env.local");
  const existingEnvFile = findExistingEnvFile(projectRoot);
  if (existingEnvFile) {
    envFilePath = existingEnvFile;
  }
  const envFileExists = existsSync(envFilePath);
  const envFileName = path4__default.basename(envFilePath);
  const newEnvContent = Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join("\n");
  let envVarsAdded = [];
  let envFileUpdated = null;
  let envFileCreated = null;
  if (envFileExists) {
    const existingContent = await promises.readFile(envFilePath, "utf-8");
    const mergedContent = mergeEnvContent(existingContent, newEnvContent);
    envVarsAdded = getNewEnvKeys(existingContent, newEnvContent);
    if (envVarsAdded.length > 0) {
      await promises.writeFile(envFilePath, mergedContent, "utf-8");
      envFileUpdated = path4__default.relative(projectRoot, envFilePath);
      envSpinner?.succeed(
        `Added the following variables to ${highlighter.info(envFileName)}:`
      );
      if (!options.silent) {
        for (const key of envVarsAdded) {
          logger.log(`  ${highlighter.success("+")} ${key}`);
        }
      }
    } else {
      envSpinner?.stop();
    }
  } else {
    await promises.writeFile(envFilePath, newEnvContent + "\n", "utf-8");
    envFileCreated = path4__default.relative(projectRoot, envFilePath);
    envVarsAdded = Object.keys(envVars);
    envSpinner?.succeed(
      `Added the following variables to ${highlighter.info(envFileName)}:`
    );
    if (!options.silent) {
      for (const key of envVarsAdded) {
        logger.log(`  ${highlighter.success("+")} ${key}`);
      }
    }
  }
  if (!options.silent && envVarsAdded.length > 0) {
    logger.break();
  }
  return {
    envVarsAdded,
    envFileUpdated,
    envFileCreated
  };
}
var ROOT_FONT_VARIABLES = /* @__PURE__ */ new Set([
  "--font-sans",
  "--font-serif",
  "--font-mono"
]);
async function massageTreeForFonts(tree, config) {
  if (!tree.fonts?.length) {
    return tree;
  }
  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);
  if (!projectInfo) {
    return tree;
  }
  tree.cssVars ??= {};
  tree.cssVars.theme ??= {};
  const isNext = projectInfo.framework.name === "next-app" || projectInfo.framework.name === "next-pages";
  for (const font of tree.fonts) {
    if (isNext) {
      tree.cssVars.theme[font.font.variable] = `var(${font.font.variable})`;
    } else {
      const fontName = font.name.replace("font-", "");
      const fontSourceDependency = font.font.dependency ?? `@fontsource-variable/${fontName}`;
      tree.dependencies ??= [];
      tree.dependencies.push(fontSourceDependency);
      tree.css ??= {};
      tree.css[`@import "${fontSourceDependency}"`] = {};
      tree.cssVars.theme[font.font.variable] = font.font.family;
    }
  }
  if (tree.fonts.length > 0) {
    const groups = /* @__PURE__ */ new Map();
    for (const font of tree.fonts) {
      const selector = font.font.selector ?? getDefaultFontSelector(font.font.variable);
      if (!selector) {
        continue;
      }
      const cls = font.font.variable.replace("--", "");
      if (!groups.has(selector)) {
        groups.set(selector, []);
      }
      groups.get(selector).push(cls);
    }
    tree.css ??= {};
    tree.css["@layer base"] ??= {};
    for (const [selector, classes] of Array.from(groups.entries())) {
      const fontClasses = classes.join(" ");
      tree.css["@layer base"][selector] ??= {};
      const existingApplyKey = Object.keys(
        tree.css["@layer base"][selector]
      ).find((key) => key.startsWith("@apply "));
      if (existingApplyKey) {
        delete tree.css["@layer base"][selector][existingApplyKey];
        tree.css["@layer base"][selector][`${existingApplyKey} ${fontClasses}`] = {};
      } else {
        tree.css["@layer base"][selector][`@apply ${fontClasses}`] = {};
      }
    }
  }
  return tree;
}
async function updateFonts(fonts, config, options) {
  if (!fonts?.length) {
    return;
  }
  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);
  if (!projectInfo) {
    return;
  }
  if (projectInfo.framework.name !== "next-app" && projectInfo.framework.name !== "next-pages") {
    return;
  }
  const fontsSpinner = spinner("Updating fonts.", {
    silent: options.silent
  })?.start();
  try {
    await updateNextFonts(fonts, config, projectInfo);
    fontsSpinner?.succeed("Updating fonts.");
  } catch (error) {
    fontsSpinner?.fail(`Failed to update fonts.`);
    throw error;
  }
}
async function updateNextFonts(fonts, config, projectInfo) {
  const layoutPath = await findLayoutFile(config, projectInfo);
  if (!layoutPath) {
    return;
  }
  const layoutContent = await promises.readFile(layoutPath, "utf-8");
  const updatedContent = await transformLayoutFonts(
    layoutContent,
    fonts,
    config
  );
  if (updatedContent !== layoutContent) {
    await promises.writeFile(layoutPath, updatedContent, "utf-8");
  }
}
async function findLayoutFile(config, projectInfo) {
  const cwd = config.resolvedPaths.cwd;
  const isSrcDir = projectInfo.isSrcDir;
  const isTsx = projectInfo.isTsx;
  const ext = isTsx ? "tsx" : "jsx";
  const possiblePaths = isSrcDir ? [`src/app/layout.${ext}`, `app/layout.${ext}`] : [`app/layout.${ext}`];
  for (const relativePath of possiblePaths) {
    const fullPath = path4__default.join(cwd, relativePath);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}
async function transformLayoutFonts(input, fonts, config) {
  const project3 = new Project({
    compilerOptions: {}
  });
  const sourceFile = project3.createSourceFile("layout.tsx", input, {
    scriptKind: ScriptKind.TSX
  });
  const googleFonts = fonts.filter((f) => f.font.provider === "google");
  const fontVariableNames = [];
  const fontUtilityClasses = [];
  for (const font of googleFonts) {
    const importName = font.font.import;
    if (!importName) {
      continue;
    }
    const existingImport = sourceFile.getImportDeclaration((decl) => {
      const moduleSpecifier = decl.getModuleSpecifierValue();
      return moduleSpecifier === "next/font/google";
    });
    let hasExistingImport = false;
    if (existingImport) {
      const namedImports = existingImport.getNamedImports();
      hasExistingImport = namedImports.some(
        (imp) => imp.getName() === importName
      );
      if (!hasExistingImport) {
        existingImport.addNamedImport(importName);
      }
    } else {
      sourceFile.addImportDeclaration({
        moduleSpecifier: "next/font/google",
        namedImports: [importName]
      });
    }
    const varName = getFontVariableName(importName, font.font.variable);
    const fontOptions = buildFontOptions(font);
    const existingVarDecl = findFontVariableDeclaration(
      sourceFile,
      font.font.variable
    );
    let resolvedVarName = varName;
    if (hasExistingImport && !existingVarDecl && isRootFontVariable(font.font.variable) && !hasHeadingFontDeclaration(sourceFile, importName)) {
      continue;
    }
    if (existingVarDecl) {
      existingVarDecl.setInitializer(`${importName}(${fontOptions})`);
      if (existingVarDecl.getName() !== varName) {
        existingVarDecl.rename(varName);
      }
      resolvedVarName = varName;
    } else {
      const insertPosition = findInsertPosition(sourceFile);
      const statement = sourceFile.insertVariableStatement(insertPosition, {
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: varName,
            initializer: `${importName}(${fontOptions})`
          }
        ]
      });
      statement.appendWhitespace("\n");
    }
    fontVariableNames.push(resolvedVarName);
    if (shouldApplyFontUtilityToHtml(font)) {
      fontUtilityClasses.push(font.font.variable.replace("--", ""));
    }
  }
  const fontFamilyClasses = /* @__PURE__ */ new Set(["font-sans", "font-serif", "font-mono"]);
  const lastFontFamilyClass = [...fontUtilityClasses].reverse().find((cls) => fontFamilyClasses.has(cls));
  const filteredUtilityClasses = fontUtilityClasses.filter(
    (cls) => !fontFamilyClasses.has(cls)
  );
  if (lastFontFamilyClass) {
    filteredUtilityClasses.unshift(lastFontFamilyClass);
  }
  if (fontVariableNames.length > 0) {
    updateHtmlClassName(
      sourceFile,
      fontVariableNames,
      filteredUtilityClasses,
      config
    );
  }
  return sourceFile.getFullText();
}
function buildFontOptions(font) {
  const options = {};
  if (font.font.subsets?.length) {
    options.subsets = font.font.subsets;
  }
  if (font.font.weight?.length) {
    options.weight = font.font.weight;
  }
  options.variable = font.font.variable;
  return JSON.stringify(options).replace(/"([^"]+)":/g, "$1:").replace(/"/g, "'");
}
function isRootFontVariable(variable) {
  return ROOT_FONT_VARIABLES.has(variable);
}
function getDefaultFontSelector(variable) {
  return isRootFontVariable(variable) ? "html" : null;
}
function shouldApplyFontUtilityToHtml(font) {
  return !font.font.selector && isRootFontVariable(font.font.variable);
}
function getFontVariableName(importName, variable) {
  const baseName = toCamelCase(importName);
  if (isRootFontVariable(variable)) {
    return baseName;
  }
  return `${baseName}${toPascalCase(variable.replace(/^--font-/, ""))}`;
}
function toCamelCase(str) {
  return str.split("_").map(
    (part, index) => index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  ).join("");
}
function toPascalCase(str) {
  return str.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
function findFontVariableDeclaration(sourceFile, variable) {
  const variableStatements = sourceFile.getVariableStatements();
  for (const statement of variableStatements) {
    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer();
      if (!initializer) continue;
      if (initializer.getKind() !== SyntaxKind.CallExpression) continue;
      const callExpr = initializer;
      const args = callExpr.getArguments();
      if (args.length === 0) continue;
      const argText = args[0].getText();
      if (argText.includes(`variable:`) && argText.includes(variable)) {
        return declaration;
      }
    }
  }
  return null;
}
function hasHeadingFontDeclaration(sourceFile, importName) {
  const variableStatements = sourceFile.getVariableStatements();
  for (const statement of variableStatements) {
    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer();
      if (!initializer) continue;
      if (initializer.getKind() !== SyntaxKind.CallExpression) continue;
      const callExpr = initializer;
      if (callExpr.getExpression().getText() !== importName) continue;
      const args = callExpr.getArguments();
      if (!args.length) continue;
      const argText = args[0].getText();
      if (argText.includes(`variable:`) && argText.includes("--font-heading")) {
        return true;
      }
    }
  }
  return false;
}
function findInsertPosition(sourceFile) {
  const imports = sourceFile.getImportDeclarations();
  if (imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    return lastImport.getChildIndex() + 1;
  }
  return 0;
}
function updateHtmlClassName(sourceFile, fontVariableNames, fontUtilityClasses, config) {
  const jsxElements = sourceFile.getDescendantsOfKind(
    SyntaxKind.JsxOpeningElement
  );
  for (const element of jsxElements) {
    const tagName = element.getTagNameNode().getText();
    if (tagName !== "html") continue;
    const newUtilityClasses = fontUtilityClasses.map((cls) => `"${cls}"`);
    const newVarExpressions = fontVariableNames.map(
      (name) => `${name}.variable`
    );
    const allNewArgs = [...newUtilityClasses, ...newVarExpressions];
    const classNameAttr = element.getAttribute("className");
    if (!classNameAttr) {
      ensureCnImport(sourceFile, config);
      element.addAttribute({
        name: "className",
        initializer: `{cn(${allNewArgs.join(", ")})}`
      });
      return;
    }
    if (classNameAttr.getKind() !== SyntaxKind.JsxAttribute) {
      return;
    }
    const jsxAttr = classNameAttr.asKindOrThrow(SyntaxKind.JsxAttribute);
    const initializer = jsxAttr.getInitializer();
    if (!initializer) return;
    if (initializer.getKind() === SyntaxKind.StringLiteral) {
      const currentValue = initializer.getText().slice(1, -1);
      ensureCnImport(sourceFile, config);
      jsxAttr.setInitializer(
        `{cn("${currentValue}", ${allNewArgs.join(", ")})}`
      );
    } else if (initializer.getKind() === SyntaxKind.JsxExpression) {
      const jsxExpr = initializer.asKindOrThrow(SyntaxKind.JsxExpression);
      const expr = jsxExpr.getExpression();
      if (!expr) return;
      const exprText = expr.getText();
      if (exprText.startsWith("cn(")) {
        const hasAllFontVars = newVarExpressions.every(
          (v) => exprText.includes(v)
        );
        const hasAllUtilityClasses = fontUtilityClasses.every(
          (cls) => exprText.includes(`"${cls}"`)
        );
        const staleFontFamilyClasses = ["font-sans", "font-serif", "font-mono"].filter((cls) => !fontUtilityClasses.includes(cls)).some((cls) => exprText.includes(`"${cls}"`));
        if (hasAllFontVars && hasAllUtilityClasses && !staleFontFamilyClasses) {
          continue;
        }
        let cleanedExpr = removeFontVariablesFromCn(exprText, newVarExpressions);
        cleanedExpr = removeFontFamilyClassesFromCn(cleanedExpr);
        const newExpr = insertFontVariablesIntoCn(cleanedExpr, allNewArgs);
        jsxExpr.replaceWithText(`{${newExpr}}`);
      } else if (/^\w+\.variable$/.test(exprText)) {
        if (newVarExpressions.includes(exprText) && fontUtilityClasses.length === 0) {
          continue;
        }
        ensureCnImport(sourceFile, config);
        const existingName = exprText.split(".")[0] ?? "";
        const shouldPreserveExisting = existingName.toLowerCase().includes("heading") || fontUtilityClasses.length === 0;
        jsxExpr.replaceWithText(
          shouldPreserveExisting ? `{cn(${exprText}, ${allNewArgs.join(", ")})}` : `{cn(${allNewArgs.join(", ")})}`
        );
      } else if (exprText.startsWith("`") && exprText.endsWith("`")) {
        const cnArgs = parseTemplateLiteralToCnArgs(exprText);
        ensureCnImport(sourceFile, config);
        const allNewArgsSet = new Set(allNewArgs);
        const fontFamilyLiterals = new Set(
          ["font-sans", "font-serif", "font-mono"].map((c) => `"${c}"`)
        );
        const cleanedCnArgs = cnArgs.filter(
          (arg) => !allNewArgsSet.has(arg) && !fontFamilyLiterals.has(arg)
        );
        jsxExpr.replaceWithText(
          `{cn(${[...cleanedCnArgs, ...allNewArgs].join(", ")})}`
        );
      } else {
        ensureCnImport(sourceFile, config);
        jsxExpr.replaceWithText(`{cn(${exprText}, ${allNewArgs.join(", ")})}`);
      }
    }
  }
}
function ensureCnImport(sourceFile, config) {
  const existingImport = sourceFile.getImportDeclaration((decl) => {
    const namedImports = decl.getNamedImports();
    return namedImports.some((imp) => imp.getName() === "cn");
  });
  if (!existingImport) {
    const utilsImport = sourceFile.getImportDeclaration((decl) => {
      const moduleSpecifier = decl.getModuleSpecifierValue();
      return moduleSpecifier.includes("/lib/utils");
    });
    if (utilsImport) {
      const namedImports = utilsImport.getNamedImports();
      if (!namedImports.some((imp) => imp.getName() === "cn")) {
        utilsImport.addNamedImport("cn");
      }
    } else {
      sourceFile.addImportDeclaration({
        moduleSpecifier: config.aliases.utils,
        namedImports: ["cn"]
      });
    }
  }
}
function parseTemplateLiteralToCnArgs(templateLiteral) {
  const staticArgs = [];
  const variableArgs = [];
  const content = templateLiteral.slice(1, -1);
  const parts = content.split(/(\$\{[^}]+\})/);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith("${") && part.endsWith("}")) {
      const expr = part.slice(2, -1).trim();
      if (expr) {
        variableArgs.push(expr);
      }
    } else {
      const staticParts = part.trim().split(/\s+/).filter(Boolean);
      for (const staticPart of staticParts) {
        staticArgs.push(`"${staticPart}"`);
      }
    }
  }
  return [...staticArgs, ...variableArgs];
}
function removeFontVariablesFromCn(cnExpr, variablesToRemove) {
  let result = cnExpr;
  for (const varExpr of variablesToRemove) {
    result = result.replace(new RegExp(`,?\\s*${varExpr.replace(".", "\\.")}`, "g"), "").replace(/cn\(\s*,/, "cn(");
  }
  return result;
}
function removeFontFamilyClassesFromCn(cnExpr) {
  let result = cnExpr;
  for (const cls of ["font-sans", "font-serif", "font-mono"]) {
    result = result.replace(new RegExp(`,?\\s*"${cls}"`, "g"), "").replace(/cn\(\s*,/, "cn(");
  }
  return result;
}
function insertFontVariablesIntoCn(cnExpr, fontVars) {
  const varsStr = fontVars.join(", ");
  return cnExpr.replace(/\)$/, `, ${varsStr})`);
}
async function addComponents(components, config, options) {
  options = {
    overwrite: false,
    silent: false,
    isNewProject: false,
    ...options
  };
  const workspaceConfig = await getWorkspaceConfig(config);
  if (workspaceConfig && workspaceConfig.ui && workspaceConfig.ui.resolvedPaths.cwd !== config.resolvedPaths.cwd) {
    return await addWorkspaceComponents(components, config, workspaceConfig, {
      ...options,
      isRemote: components?.length === 1 && !!components[0].match(/\/chat\/b\//)
    });
  }
  return await addProjectComponents(components, config, {
    ...options,
    skipFonts: options.skipFonts
  });
}
async function addProjectComponents(components, config, options) {
  if (!components.length) {
    return;
  }
  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent
  })?.start();
  let tree = await resolveRegistryTree(components, configWithDefaults(config));
  if (!tree) {
    registrySpinner?.fail();
    return handleError(new Error("Failed to fetch components from registry."));
  }
  try {
    validateFilesTarget(tree.files ?? [], config.resolvedPaths.cwd);
  } catch (error) {
    registrySpinner?.fail();
    return handleError(error);
  }
  registrySpinner?.succeed();
  const tailwindVersion = await getProjectTailwindVersionFromConfig(config);
  if (!options.skipFonts) {
    tree = await massageTreeForFonts(tree, config);
  }
  const supportedFontMarkers = getSupportedFontMarkers2([tree]);
  await updateDependencies(tree.dependencies, tree.devDependencies, config, {
    silent: options.silent
  });
  await updateTailwindConfig(tree.tailwind?.config, config, {
    silent: options.silent,
    tailwindVersion
  });
  await updateEnvVars(tree.envVars, config, {
    silent: options.silent
  });
  if (!options.skipFonts) {
    await updateFonts(tree.fonts, config, {
      silent: options.silent
    });
  }
  await updateFiles(tree.files, config, {
    overwrite: options.overwrite,
    silent: options.silent,
    path: options.path,
    supportedFontMarkers
  });
  const overwriteCssVars = tree.cssVars ? options.overwriteCssVars ?? await shouldOverwriteCssVars(components, config) : void 0;
  await updateCss(tree.css, config, {
    silent: options.silent,
    cssVars: tree.cssVars,
    cleanupDefaultNextStyles: options.isNewProject,
    overwriteCssVars,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config
  });
  if (tree.docs) {
    logger.info(tree.docs);
  }
}
async function addWorkspaceComponents(components, config, workspaceConfig, options) {
  if (!components.length) {
    return;
  }
  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent
  })?.start();
  let tree = await resolveRegistryTree(components, configWithDefaults(config));
  if (!tree) {
    registrySpinner?.fail();
    return handleError(new Error("Failed to fetch components from registry."));
  }
  try {
    validateFilesTarget(tree.files ?? [], config.resolvedPaths.cwd);
  } catch (error) {
    registrySpinner?.fail();
    return handleError(error);
  }
  registrySpinner?.succeed();
  const filesCreated = [];
  const filesUpdated = [];
  const filesSkipped = [];
  const rootSpinner = spinner(`Installing components.`)?.start();
  const mainTargetConfig = workspaceConfig.ui;
  const tailwindVersion = await getProjectTailwindVersionFromConfig(mainTargetConfig);
  const workspaceRoot = findCommonRoot2(
    config.resolvedPaths.cwd,
    mainTargetConfig.resolvedPaths.ui
  );
  tree = await massageTreeForFonts(tree, config);
  const supportedFontMarkers = getSupportedFontMarkers2([tree]);
  await updateDependencies(
    tree.dependencies,
    tree.devDependencies,
    mainTargetConfig,
    {
      silent: true
    }
  );
  if (tree.tailwind?.config) {
    await updateTailwindConfig(tree.tailwind?.config, mainTargetConfig, {
      silent: true,
      tailwindVersion
    });
    filesUpdated.push(
      path4__default.relative(
        workspaceRoot,
        mainTargetConfig.resolvedPaths.tailwindConfig
      )
    );
  }
  if (tree.envVars) {
    await updateEnvVars(tree.envVars, mainTargetConfig, {
      silent: true
    });
  }
  await updateFonts(tree.fonts, config, {
    silent: true
  });
  const filesByType = /* @__PURE__ */ new Map();
  for (const file of tree.files ?? []) {
    const type = file.type || "registry:ui";
    if (!filesByType.has(type)) {
      filesByType.set(type, []);
    }
    filesByType.get(type).push(file);
  }
  const FILE_TYPE_TO_CONFIG_KEY = {
    "registry:ui": "ui",
    "registry:hook": "hooks",
    "registry:lib": "lib"
  };
  for (const type of Array.from(filesByType.keys())) {
    const typeFiles = filesByType.get(type);
    const configKey = FILE_TYPE_TO_CONFIG_KEY[type];
    const targetConfig = configKey && workspaceConfig[configKey] ? workspaceConfig[configKey] : config;
    const typeWorkspaceRoot = findCommonRoot2(
      config.resolvedPaths.cwd,
      targetConfig.resolvedPaths.ui || targetConfig.resolvedPaths.cwd
    );
    const packageRoot = await findPackageRoot(
      typeWorkspaceRoot,
      targetConfig.resolvedPaths.cwd
    ) ?? targetConfig.resolvedPaths.cwd;
    const files = await updateFiles(typeFiles, targetConfig, {
      overwrite: options.overwrite,
      silent: true,
      rootSpinner,
      isRemote: options.isRemote,
      isWorkspace: true,
      path: options.path,
      supportedFontMarkers
    });
    filesCreated.push(
      ...files.filesCreated.map(
        (file) => path4__default.relative(typeWorkspaceRoot, path4__default.join(packageRoot, file))
      )
    );
    filesUpdated.push(
      ...files.filesUpdated.map(
        (file) => path4__default.relative(typeWorkspaceRoot, path4__default.join(packageRoot, file))
      )
    );
    filesSkipped.push(
      ...files.filesSkipped.map(
        (file) => path4__default.relative(typeWorkspaceRoot, path4__default.join(packageRoot, file))
      )
    );
  }
  const overwriteCssVars = tree.cssVars ? options.overwriteCssVars ?? await shouldOverwriteCssVars(components, config) : void 0;
  await updateCss(tree.css, mainTargetConfig, {
    silent: true,
    cssVars: tree.cssVars,
    overwriteCssVars,
    tailwindVersion,
    tailwindConfig: tree.tailwind?.config
  });
  if (tree.cssVars || tree.css) {
    filesUpdated.push(
      path4__default.relative(workspaceRoot, mainTargetConfig.resolvedPaths.tailwindCss)
    );
  }
  rootSpinner?.succeed();
  const dedupedCreated = Array.from(new Set(filesCreated)).sort();
  const dedupedUpdated = Array.from(
    new Set(filesUpdated.filter((file) => !filesCreated.includes(file)))
  ).sort();
  const dedupedSkipped = Array.from(new Set(filesSkipped)).sort();
  const hasUpdatedFiles = dedupedCreated.length || dedupedUpdated.length;
  if (!hasUpdatedFiles && !dedupedSkipped.length) {
    spinner(`No files updated.`, {
      silent: options.silent
    })?.info();
  }
  if (dedupedCreated.length) {
    spinner(
      `Created ${dedupedCreated.length} ${dedupedCreated.length === 1 ? "file" : "files"}:`,
      {
        silent: options.silent
      }
    )?.succeed();
    for (const file of dedupedCreated) {
      logger.log(`  - ${file}`);
    }
  }
  if (dedupedUpdated.length) {
    spinner(
      `Updated ${dedupedUpdated.length} ${dedupedUpdated.length === 1 ? "file" : "files"}:`,
      {
        silent: options.silent
      }
    )?.info();
    for (const file of dedupedUpdated) {
      logger.log(`  - ${file}`);
    }
  }
  if (dedupedSkipped.length) {
    spinner(
      `Skipped ${dedupedSkipped.length} ${dedupedSkipped.length === 1 ? "file" : "files"}: (use --overwrite to overwrite)`,
      {
        silent: options.silent
      }
    )?.info();
    for (const file of dedupedSkipped) {
      logger.log(`  - ${file}`);
    }
  }
  if (tree.docs) {
    logger.info(tree.docs);
  }
}
async function shouldOverwriteCssVars(components, config) {
  const result = await getRegistryItems(components, { config });
  const payload = z.array(registryItemSchema).parse(result);
  return payload.some(
    (component) => component.type === "registry:theme" || component.type === "registry:style" || component.type === "registry:font" || component.type === "registry:base"
  );
}
function validateFilesTarget(files, cwd) {
  for (const file of files) {
    if (!file?.target) {
      continue;
    }
    if (!isSafeTarget(file.target, cwd)) {
      throw new Error(
        `We found an unsafe file path "${file.target} in the registry item. Installation aborted.`
      );
    }
  }
}
async function fontsourceMonorepoInit(options) {
  const packagesUiPath = path4__default.resolve(options.projectPath, "packages/ui");
  const appsWebPath = path4__default.resolve(options.projectPath, "apps/web");
  const packagesUiConfigPath = path4__default.resolve(packagesUiPath, "components.json");
  let packagesUiConfig = await fs11.readJson(packagesUiConfigPath);
  if (options.registryBaseConfig) {
    packagesUiConfig = deepmerge3(packagesUiConfig, options.registryBaseConfig);
  }
  packagesUiConfig.tailwind.baseColor = "neutral";
  if (options.rtl) {
    packagesUiConfig.rtl = true;
  }
  if (options.menuColor) {
    packagesUiConfig.menuColor = options.menuColor;
  }
  if (options.menuAccent) {
    packagesUiConfig.menuAccent = options.menuAccent;
  }
  if (options.iconLibrary) {
    packagesUiConfig.iconLibrary = options.iconLibrary;
  }
  await fs11.writeJson(packagesUiConfigPath, packagesUiConfig, {
    spaces: 2
  });
  const appsWebConfigPath = path4__default.resolve(appsWebPath, "components.json");
  let appsWebConfig = await fs11.readJson(appsWebConfigPath);
  if (options.registryBaseConfig) {
    appsWebConfig = deepmerge3(appsWebConfig, options.registryBaseConfig);
  }
  appsWebConfig.tailwind.baseColor = "neutral";
  if (options.rtl) {
    appsWebConfig.rtl = true;
  }
  if (options.menuColor) {
    appsWebConfig.menuColor = options.menuColor;
  }
  if (options.menuAccent) {
    appsWebConfig.menuAccent = options.menuAccent;
  }
  if (options.iconLibrary) {
    appsWebConfig.iconLibrary = options.iconLibrary;
  }
  await fs11.writeJson(appsWebConfigPath, appsWebConfig, { spaces: 2 });
  const resolvedPackagesUiConfig = await resolveConfigPaths(
    packagesUiPath,
    rawConfigSchema.parse(packagesUiConfig)
  );
  const { config: packagesUiWithRegistries } = await ensureRegistriesInConfig(
    options.components,
    resolvedPackagesUiConfig,
    { silent: true }
  );
  await addComponents(options.components, packagesUiWithRegistries, {
    overwrite: true,
    silent: options.silent,
    isNewProject: true,
    skipFonts: true
  });
  const resolvedAppsWebConfig = await resolveConfigPaths(
    appsWebPath,
    rawConfigSchema.parse(appsWebConfig)
  );
  const tree = await resolveRegistryTree(
    options.components,
    configWithDefaults(packagesUiWithRegistries)
  );
  if (tree?.fonts?.length) {
    const themeCssVars = {};
    const fontSourceDependencies = /* @__PURE__ */ new Set();
    for (const font of tree.fonts) {
      const fontName = font.name.replace(/^font-heading-/, "").replace("font-", "");
      const fontSourceDependency = font.font.dependency ?? `@fontsource-variable/${fontName}`;
      themeCssVars[font.font.variable] = font.font.family;
      fontSourceDependencies.add(fontSourceDependency);
    }
    await updateDependencies(
      Array.from(fontSourceDependencies),
      [],
      resolvedPackagesUiConfig,
      { silent: true }
    );
    await updateCssVars(
      {
        theme: themeCssVars
      },
      resolvedPackagesUiConfig,
      {
        silent: options.silent,
        overwriteCssVars: false,
        tailwindVersion: "v4"
      }
    );
    await updateCss(
      Object.fromEntries(
        Array.from(fontSourceDependencies).map((dependency) => [
          `@import "${dependency}"`,
          {}
        ])
      ),
      resolvedPackagesUiConfig,
      {
        silent: options.silent
      }
    );
  }
  const iconLibrary = resolvedPackagesUiConfig.iconLibrary;
  if (iconLibrary && iconLibrary in iconLibraries) {
    const iconPackages = [...iconLibraries[iconLibrary].packages];
    await updateDependencies(iconPackages, [], resolvedPackagesUiConfig, {
      silent: true
    });
    await updateDependencies(iconPackages, [], resolvedAppsWebConfig, {
      silent: true
    });
  }
  return resolvedAppsWebConfig;
}

// src/templates/astro.ts
var astro = createTemplate({
  name: "astro",
  title: "Astro",
  defaultProjectName: "astro-app",
  templateDir: "astro-app",
  frameworks: ["astro"],
  create: async () => {
  },
  files: [
    {
      type: "registry:page",
      path: "src/pages/index.astro",
      target: "src/pages/index.astro",
      content: dedent6`---
import Layout from "@/layouts/main.astro"
import { ComponentExample } from "@/components/component-example"
---

<Layout>
  <ComponentExample client:load />
</Layout>
`
    }
  ],
  monorepo: {
    templateDir: "astro-monorepo",
    init: fontsourceMonorepoInit,
    files: [
      {
        type: "registry:page",
        path: "src/pages/index.astro",
        target: "src/pages/index.astro",
        content: dedent6`---
import "@workspace/ui/globals.css"
import { ComponentExample } from "@/components/component-example"
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Astro App</title>
  </head>
  <body>
    <ComponentExample client:load />
  </body>
</html>
`
      }
    ]
  }
});

// src/templates/laravel.ts
var laravel = createTemplate({
  name: "laravel",
  title: "Laravel",
  description: "Requires `laravel new`",
  defaultProjectName: "laravel-app",
  templateDir: "laravel-app",
  frameworks: ["laravel"],
  scaffold: async () => {
    logger.break();
    logger.log(
      `  Please create a new app with ${highlighter.info(
        "laravel new --react"
      )} first then run ${highlighter.info("shadcn init")}.`
    );
    logger.log(
      `  See ${highlighter.info(
        `${SHADCN_URL}/docs/installation/laravel`
      )} for more information.`
    );
    logger.break();
    process.exit(0);
  },
  create: async () => {
  }
});
var next = createTemplate({
  name: "next",
  title: "Next.js",
  defaultProjectName: "next-app",
  templateDir: "next-app",
  frameworks: ["next-app", "next-pages"],
  create: async () => {
  },
  files: [
    {
      type: "registry:page",
      path: "app/page.tsx",
      target: "app/page.tsx",
      content: dedent6`import { ComponentExample } from "@/components/component-example";

export default function Page() {
  return <ComponentExample />;
}
`
    }
  ],
  monorepo: {
    templateDir: "next-monorepo",
    init: async (options) => {
      const packagesUiPath = path4__default.resolve(options.projectPath, "packages/ui");
      const appsWebPath = path4__default.resolve(options.projectPath, "apps/web");
      const packagesUiConfigPath = path4__default.resolve(
        packagesUiPath,
        "components.json"
      );
      let packagesUiConfig = await fs11.readJson(packagesUiConfigPath);
      if (options.registryBaseConfig) {
        packagesUiConfig = deepmerge3(
          packagesUiConfig,
          options.registryBaseConfig
        );
      }
      packagesUiConfig.tailwind.baseColor = "neutral";
      if (options.rtl) {
        packagesUiConfig.rtl = true;
      }
      await fs11.writeJson(packagesUiConfigPath, packagesUiConfig, {
        spaces: 2
      });
      const appsWebConfigPath = path4__default.resolve(appsWebPath, "components.json");
      let appsWebConfig = await fs11.readJson(appsWebConfigPath);
      if (options.registryBaseConfig) {
        appsWebConfig = deepmerge3(appsWebConfig, options.registryBaseConfig);
      }
      appsWebConfig.tailwind.baseColor = "neutral";
      if (options.rtl) {
        appsWebConfig.rtl = true;
      }
      await fs11.writeJson(appsWebConfigPath, appsWebConfig, { spaces: 2 });
      const resolvedPackagesUiConfig = await resolveConfigPaths(
        packagesUiPath,
        rawConfigSchema.parse(packagesUiConfig)
      );
      const { config: packagesUiWithRegistries } = await ensureRegistriesInConfig(
        options.components,
        resolvedPackagesUiConfig,
        { silent: true }
      );
      await addComponents(options.components, packagesUiWithRegistries, {
        overwrite: true,
        silent: options.silent,
        isNewProject: true,
        skipFonts: true
      });
      const resolvedAppsWebConfig = await resolveConfigPaths(
        appsWebPath,
        rawConfigSchema.parse(appsWebConfig)
      );
      const tree = await resolveRegistryTree(
        options.components,
        configWithDefaults(packagesUiWithRegistries)
      );
      if (tree?.fonts?.length) {
        const themeCssVars = {};
        for (const font of tree.fonts) {
          themeCssVars[font.font.variable] = `var(${font.font.variable})`;
        }
        await updateCssVars({ theme: themeCssVars }, resolvedPackagesUiConfig, {
          silent: options.silent,
          overwriteCssVars: false,
          tailwindVersion: "v4"
        });
        await updateFonts(tree.fonts, resolvedAppsWebConfig, {
          silent: options.silent
        });
      }
      const iconLibrary = resolvedPackagesUiConfig.iconLibrary;
      if (iconLibrary && iconLibrary in iconLibraries) {
        const iconPackages = [...iconLibraries[iconLibrary].packages];
        await updateDependencies(iconPackages, [], resolvedPackagesUiConfig, {
          silent: true
        });
        await updateDependencies(iconPackages, [], resolvedAppsWebConfig, {
          silent: true
        });
      }
      return resolvedAppsWebConfig;
    },
    files: [
      {
        type: "registry:page",
        path: "app/page.tsx",
        target: "app/page.tsx",
        content: dedent6`import { ComponentExample } from "@/components/component-example";

export default function Page() {
  return <ComponentExample />;
}
`
      }
    ]
  }
});
var reactRouter = createTemplate({
  name: "react-router",
  title: "React Router",
  defaultProjectName: "react-router-app",
  templateDir: "react-router-app",
  frameworks: ["react-router"],
  create: async () => {
  },
  files: [
    {
      type: "registry:file",
      path: "app/routes/home.tsx",
      target: "app/routes/home.tsx",
      content: dedent6`import { ComponentExample } from "@/components/component-example";

export default function Home() {
  return <ComponentExample />;
}
`
    }
  ],
  monorepo: {
    templateDir: "react-router-monorepo",
    init: fontsourceMonorepoInit,
    files: [
      {
        type: "registry:file",
        path: "app/routes/home.tsx",
        target: "app/routes/home.tsx",
        content: dedent6`import { ComponentExample } from "@/components/component-example";

export default function Home() {
  return <ComponentExample />;
}
`
      }
    ]
  }
});
var start = createTemplate({
  name: "start",
  title: "TanStack Start",
  defaultProjectName: "start-app",
  templateDir: "start-app",
  frameworks: ["tanstack-start"],
  create: async () => {
  },
  files: [
    {
      type: "registry:file",
      path: "src/routes/index.tsx",
      target: "src/routes/index.tsx",
      content: dedent6`import { createFileRoute } from "@tanstack/react-router";
import { ComponentExample } from "@/components/component-example";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <ComponentExample />
  );
}
`
    }
  ],
  monorepo: {
    templateDir: "start-monorepo",
    init: fontsourceMonorepoInit,
    files: [
      {
        type: "registry:file",
        path: "src/routes/index.tsx",
        target: "src/routes/index.tsx",
        content: dedent6`import { createFileRoute } from "@tanstack/react-router";
import { ComponentExample } from "@/components/component-example";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <ComponentExample />
  );
}
`
      }
    ]
  }
});
var vite = createTemplate({
  name: "vite",
  title: "Vite",
  defaultProjectName: "vite-app",
  templateDir: "vite-app",
  frameworks: ["vite"],
  create: async () => {
  },
  files: [
    {
      type: "registry:file",
      path: "src/App.tsx",
      target: "src/App.tsx",
      content: dedent6`import { ComponentExample } from "@/components/component-example";

export function App() {
  return <ComponentExample />;
}

export default App;
`
    }
  ],
  monorepo: {
    templateDir: "vite-monorepo",
    init: fontsourceMonorepoInit,
    files: [
      {
        type: "registry:file",
        path: "src/App.tsx",
        target: "src/App.tsx",
        content: dedent6`import { ComponentExample } from "@/components/component-example";

export function App() {
  return <ComponentExample />;
}

export default App;
`
      }
    ]
  }
});

// src/templates/index.ts
var templates = {
  next,
  vite,
  start,
  "react-router": reactRouter,
  astro,
  laravel
};
function getTemplateForFramework(frameworkName) {
  if (!frameworkName) {
    return void 0;
  }
  for (const [key, template] of Object.entries(templates)) {
    if (template.frameworks.includes(frameworkName)) {
      return key;
    }
  }
  return void 0;
}
async function createProject(options) {
  let template = options.template && options.template in templates ? options.template : "next";
  const resolved = resolveTemplate(templates[template], {
    monorepo: options.monorepo
  });
  let projectName = options.name ?? resolved.defaultProjectName;
  const isRemoteComponent = options.components?.length === 1 && !!options.components[0].match(/\/chat\/b\//);
  if (isRemoteComponent) {
    template = "next";
  }
  if (!options.force) {
    const { type, name } = await prompts5([
      {
        type: options.template || isRemoteComponent ? null : "select",
        name: "type",
        message: `The path ${highlighter.info(
          options.cwd
        )} does not contain a package.json file.
  Would you like to start a new project?`,
        choices: Object.entries(templates).map(([key, t]) => ({
          title: t.title,
          value: key,
          description: t.description
        })),
        initial: 0
      },
      {
        type: options.name ? null : "text",
        name: "name",
        message: "What is your project named?",
        initial: projectName,
        format: (value) => value.trim(),
        validate: (value) => value.length > 128 ? `Name should be less than 128 characters.` : true
      }
    ]);
    template = type ?? template;
    projectName = name ?? projectName;
  }
  const effectiveTemplate = resolveTemplate(templates[template], {
    monorepo: options.monorepo
  });
  const packageManager = await getPackageManager(options.cwd, {
    withFallback: true
  });
  const projectPath = path4__default.join(options.cwd, projectName);
  try {
    await fs11.access(options.cwd, fs11.constants.W_OK);
  } catch (error) {
    logger.break();
    logger.error(`The path ${highlighter.info(options.cwd)} is not writable.`);
    logger.error(
      `It is likely you do not have write permissions for this folder or the path ${highlighter.info(
        options.cwd
      )} does not exist.`
    );
    logger.break();
    process.exit(1);
  }
  if (fs11.existsSync(path4__default.resolve(options.cwd, projectName, "package.json"))) {
    logger.break();
    logger.error(
      `A project with the name ${highlighter.info(projectName)} already exists.`
    );
    logger.error(`Please choose a different name and try again.`);
    logger.break();
    process.exit(1);
  }
  await effectiveTemplate.scaffold({
    projectPath,
    packageManager,
    cwd: options.cwd
  });
  return {
    projectPath,
    projectName,
    template
  };
}
async function loadEnvFiles(cwd = process.cwd()) {
  try {
    const { config } = await import('@dotenvx/dotenvx');
    const envFiles = [
      ".env.local",
      ".env.development.local",
      ".env.development",
      ".env"
    ];
    for (const envFile of envFiles) {
      const envPath = join(cwd, envFile);
      if (existsSync(envPath)) {
        config({
          path: envPath,
          overload: false,
          quiet: true
        });
      }
    }
  } catch (error) {
    logger.warn("Failed to load env files:", error);
  }
}
var FILE_BACKUP_SUFFIX = ".bak";
function createFileBackup(filePath) {
  if (!fs11.existsSync(filePath)) {
    return null;
  }
  const backupPath = `${filePath}${FILE_BACKUP_SUFFIX}`;
  try {
    fs11.renameSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    console.error(`Failed to create backup of ${filePath}: ${error}`);
    return null;
  }
}
function restoreFileBackup(filePath) {
  const backupPath = `${filePath}${FILE_BACKUP_SUFFIX}`;
  if (!fs11.existsSync(backupPath)) {
    return false;
  }
  try {
    fs11.renameSync(backupPath, filePath);
    return true;
  } catch (error) {
    console.error(
      `Warning: Could not restore backup file ${backupPath}: ${error}`
    );
    return false;
  }
}
function deleteFileBackup(filePath) {
  const backupPath = `${filePath}${FILE_BACKUP_SUFFIX}`;
  if (!fs11.existsSync(backupPath)) {
    return false;
  }
  try {
    fs11.unlinkSync(backupPath);
    return true;
  } catch {
    return false;
  }
}
async function withFileBackup(filePath, task, options = {}) {
  if (!fs11.existsSync(filePath)) {
    return task();
  }
  const backupPath = createFileBackup(filePath);
  if (!backupPath) {
    options.onBackupFailure?.(filePath);
    throw new Error(`Could not back up ${filePath}.`);
  }
  const restoreBackupOnExit = () => restoreFileBackup(filePath);
  process.on("exit", restoreBackupOnExit);
  try {
    const result = await task();
    process.removeListener("exit", restoreBackupOnExit);
    deleteFileBackup(filePath);
    return result;
  } catch (error) {
    process.removeListener("exit", restoreBackupOnExit);
    restoreFileBackup(filePath);
    throw error;
  }
}
var initOptionsSchema = z.object({
  cwd: z.string(),
  name: z.string().optional(),
  preset: z.union([z.boolean(), z.string()]).optional(),
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  defaults: z.boolean(),
  force: z.boolean(),
  reinstall: z.boolean().optional(),
  silent: z.boolean(),
  isNewProject: z.boolean().default(false),
  cssVariables: z.boolean().default(true),
  rtl: z.boolean().optional(),
  pointer: z.boolean().optional(),
  base: z.enum(["radix", "base"]).optional(),
  template: z.string().optional(),
  monorepo: z.boolean().optional(),
  existingConfig: z.record(z.unknown()).optional(),
  installStyleIndex: z.boolean().default(true),
  registryBaseConfig: rawConfigSchema.deepPartial().optional(),
  menuColor: z.enum([
    "default",
    "inverted",
    "default-translucent",
    "inverted-translucent"
  ]).optional(),
  menuAccent: z.enum(["subtle", "bold"]).optional(),
  iconLibrary: z.string().optional()
});
function applyInitUrlOptions(url, options) {
  if (options.rtl) {
    url.searchParams.set("rtl", "true");
  } else if (options.rtl === false) {
    url.searchParams.delete("rtl");
  }
  if (options.pointer) {
    url.searchParams.set("pointer", "true");
  } else if (options.pointer === false) {
    url.searchParams.delete("pointer");
  }
  return url;
}
var init = new Command().name("init").alias("create").description("initialize your project and install dependencies").argument("[components...]", "names, url or local path to component").option(
  "-t, --template <template>",
  "the template to use. (next, start, vite, react-router, laravel, astro)"
).option("-b, --base <base>", "the component library to use. (radix, base)").option("--monorepo", "scaffold a monorepo project.").option("--no-monorepo", "skip the monorepo prompt.").option("-p, --preset [name]", "use a preset configuration").option("-y, --yes", "skip confirmation prompt.", true).option(
  "-d, --defaults",
  "use default configuration: --template=next --preset=base-nova",
  false
).option("-f, --force", "force overwrite of existing configuration.", false).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("-n, --name <name>", "the name for the new project.").option("-s, --silent", "mute output.", false).option("--css-variables", "use css variables for theming.", true).option("--no-css-variables", "do not use css variables for theming.").option("--rtl", "enable RTL support.").option("--no-rtl", "disable RTL support.").option("--pointer", "enable pointer cursor for buttons.").option("--no-pointer", "disable pointer cursor for buttons.").option("--reinstall", "re-install existing UI components.").option("--no-reinstall", "do not re-install existing UI components.").action(async (components, opts) => {
  let componentsJsonBackupPath;
  let reinstallComponents = [];
  const restoreBackupOnExit = () => {
    if (componentsJsonBackupPath) {
      restoreFileBackup(
        componentsJsonBackupPath.replace(FILE_BACKUP_SUFFIX, "")
      );
    }
  };
  process.on("exit", restoreBackupOnExit);
  try {
    const options = initOptionsSchema.parse({
      ...opts,
      reinstall: opts.reinstall,
      cwd: path4__default.resolve(opts.cwd)
    });
    const presetsByName = new Map(Object.entries(DEFAULT_PRESETS));
    let presetBase;
    if (options.defaults) {
      options.template = options.template || "next";
      options.base = options.base || "base";
      options.reinstall = options.reinstall ?? false;
    }
    if (options.template && !(options.template in templates)) {
      logger.error(
        `Invalid template: ${highlighter.info(
          options.template
        )}. Available templates: ${Object.keys(templates).map((t) => highlighter.info(t)).join(", ")}.`
      );
      logger.break();
      process.exit(1);
    }
    if (typeof options.preset === "string" && !isUrl(options.preset) && !isPresetCode(options.preset)) {
      const knownPresetNames = Array.from(presetsByName.keys());
      if (!presetsByName.has(options.preset)) {
        logger.error(
          `Invalid preset: ${highlighter.info(
            options.preset
          )}. Available presets: ${knownPresetNames.join(", ")}`
        );
        logger.break();
        process.exit(1);
      }
    }
    const cwd = options.cwd;
    const hasExistingConfig = fs11.existsSync(
      path4__default.resolve(cwd, "components.json")
    );
    if (!options.monorepo && !hasExistingConfig && await isMonorepoRoot(cwd)) {
      const projectInfo = await getProjectInfo(cwd);
      if (!projectInfo || projectInfo.framework.name === "manual") {
        const targets = await getMonorepoTargets(cwd);
        if (targets.length > 0) {
          formatMonorepoMessage("init", targets);
          process.exit(1);
        }
      }
    }
    if (hasExistingConfig && !options.force) {
      const { overwrite } = await prompts5({
        type: "confirm",
        name: "overwrite",
        message: `A ${highlighter.info(
          "components.json"
        )} file already exists. Would you like to overwrite it?`,
        initial: false
      });
      if (!overwrite) {
        logger.info(
          `  To start over, remove the ${highlighter.info(
            "components.json"
          )} file and run ${highlighter.info("init")} again.`
        );
        logger.break();
        process.exit(1);
      }
      options.force = true;
    }
    let existingConfig;
    if (hasExistingConfig) {
      try {
        existingConfig = await fs11.readJson(
          path4__default.resolve(cwd, "components.json")
        );
      } catch {
      }
      if (existingConfig) {
        options.existingConfig = existingConfig;
      }
      let shouldReinstall = options.reinstall;
      if (shouldReinstall === void 0) {
        const { reinstall } = await prompts5({
          type: "confirm",
          name: "reinstall",
          message: `Would you like to re-install existing UI components?`,
          initial: false
        });
        shouldReinstall = reinstall;
      }
      if (shouldReinstall) {
        reinstallComponents = await getProjectComponents(cwd);
        if (reinstallComponents.length) {
          logger.break();
          logger.log(
            "  The following components will be re-installed and overwritten:"
          );
          for (let i = 0; i < reinstallComponents.length; i += 8) {
            logger.log(
              `  - ${reinstallComponents.slice(i, i + 8).join(", ")}`
            );
          }
          logger.break();
        }
      }
    }
    if (options.preset === void 0 && components.length === 0 && !options.defaults) {
      const hasPackageJson = fs11.existsSync(
        path4__default.resolve(cwd, "package.json")
      );
      if (!options.template && !hasPackageJson) {
        const { template } = await prompts5({
          type: "select",
          name: "template",
          message: "Select a template",
          choices: Object.entries(templates).map(([value, t]) => ({
            title: t.title,
            value,
            description: t.description,
            disabled: options.monorepo && value === "laravel"
          }))
        });
        if (!template) {
          process.exit(1);
        }
        options.template = template;
      }
      if (!options.template && hasPackageJson) {
        const projectInfo = await getProjectInfo(cwd);
        const detectedTemplate = getTemplateForFramework(
          projectInfo?.framework.name
        );
        if (detectedTemplate) {
          options.template = detectedTemplate;
        }
      }
      if (options.template === "laravel" && !hasPackageJson) {
        logger.break();
        logger.log(
          `  Please create a new app with ${highlighter.info(
            "laravel new --react"
          )} first then run ${highlighter.info("shadcn init")}.`
        );
        logger.log(
          `  See ${highlighter.info(
            `${SHADCN_URL}/docs/installation/laravel`
          )} for more information.`
        );
        logger.break();
        process.exit(0);
      }
      if (options.monorepo === void 0 && !hasPackageJson && options.template && templates[options.template]?.monorepo) {
        const { monorepo } = await prompts5({
          type: "confirm",
          name: "monorepo",
          message: "Would you like to set up a monorepo?",
          initial: false
        });
        options.monorepo = monorepo;
      }
      if (!options.base) {
        options.base = await promptForBase();
      }
      options.preset = true;
    }
    if (options.preset !== void 0) {
      const presetArg = options.preset === true ? true : options.preset;
      if (presetArg === true) {
        const result = await promptForPreset({
          rtl: options.rtl ?? false,
          template: options.template,
          base: options.base,
          pointer: options.pointer
        });
        components = [result.url, ...components];
        presetBase = result.base;
      }
      if (typeof presetArg === "string") {
        let initUrl;
        if (isUrl(presetArg)) {
          const url = new URL(presetArg);
          applyInitUrlOptions(url, options);
          if (url.pathname === "/init" && presetArg.startsWith(SHADCN_URL)) {
            url.searchParams.set("track", "1");
          }
          initUrl = url.toString();
          presetBase = url.searchParams.get("base") ?? void 0;
        } else if (isPresetCode(presetArg)) {
          const decoded = decodePreset(presetArg);
          if (!decoded) {
            logger.error(
              `Invalid preset code: ${highlighter.info(presetArg)}`
            );
            logger.break();
            process.exit(1);
          }
          initUrl = resolveInitUrl(
            {
              ...decoded,
              base: "radix",
              rtl: options.rtl ?? false
            },
            {
              template: options.template,
              preset: presetArg,
              pointer: options.pointer
            }
          );
          presetBase = void 0;
        } else {
          const preset = presetsByName.get(presetArg);
          if (!preset) {
            throw new Error(`Unknown preset: ${presetArg}`);
          }
          initUrl = resolveInitUrl(
            {
              ...preset,
              base: options.base ?? "radix",
              rtl: options.rtl ?? preset.rtl
            },
            { template: options.template, pointer: options.pointer }
          );
          presetBase = void 0;
        }
        components = [initUrl, ...components];
      }
    }
    let resolvedBase = options.base ?? presetBase ?? (existingConfig?.style ? existingConfig.style.startsWith("base-") ? "base" : "radix" : "");
    if (!resolvedBase) {
      if (components.length > 0) {
        resolvedBase = "radix";
      } else {
        const base = await promptForBase();
        resolvedBase = base;
        options.base = base;
      }
    }
    if (options.defaults && !components.some(isUrl)) {
      const initUrl = resolveInitUrl(
        {
          ...DEFAULT_PRESETS.nova,
          base: resolvedBase,
          rtl: options.rtl ?? false
        },
        { template: options.template, pointer: options.pointer }
      );
      components = [initUrl, ...components];
    }
    if (components.length > 0 && isUrl(components[0])) {
      const url = new URL(components[0]);
      url.searchParams.set("base", resolvedBase);
      components[0] = url.toString();
    }
    if (existingConfig?.style) {
      const confirmedBase = await confirmBaseSwitch(
        existingConfig.style,
        resolvedBase
      );
      if (confirmedBase !== resolvedBase) {
        resolvedBase = confirmedBase;
        if (components.length > 0 && isUrl(components[0])) {
          const url = new URL(components[0]);
          url.searchParams.set("base", confirmedBase);
          components[0] = url.toString();
        }
      }
    }
    if (reinstallComponents.length) {
      components = [...components, ...reinstallComponents];
    }
    options.components = components;
    await loadEnvFiles(options.cwd);
    if (components.length > 0) {
      const componentsJsonPath = path4__default.resolve(cwd, "components.json");
      if (hasExistingConfig) {
        componentsJsonBackupPath = createFileBackup(componentsJsonPath) ?? void 0;
        if (!componentsJsonBackupPath) {
          logger.warn(
            `Could not back up ${highlighter.info("components.json")}.`
          );
        }
      }
      const {
        registryBaseConfig,
        installStyleIndex,
        url: cleanUrl
      } = await resolveRegistryBaseConfig(components[0], cwd, {
        registries: existingConfig?.registries
      });
      components[0] = cleanUrl;
      if (!installStyleIndex) {
        options.installStyleIndex = false;
      }
      if (registryBaseConfig) {
        options.registryBaseConfig = registryBaseConfig;
      }
    }
    await runInit(options);
    logger.break();
    logger.log(
      `Project initialization completed.
You may now add components.`
    );
    process.removeListener("exit", restoreBackupOnExit);
    deleteFileBackup(path4__default.resolve(cwd, "components.json"));
    logger.break();
  } catch (error) {
    process.removeListener("exit", restoreBackupOnExit);
    restoreBackupOnExit();
    logger.break();
    handleError(error);
  } finally {
    clearRegistryContext();
  }
});
async function runInit(options) {
  let projectInfo;
  let newProjectTemplate;
  const explicitTemplate = options.template;
  const resolvedTemplateConfig = explicitTemplate ? resolveTemplate(templates[explicitTemplate], {
    monorepo: options.monorepo
  }) : void 0;
  const hasExplicitMonorepoInit = options.monorepo && resolvedTemplateConfig?.init && fs11.existsSync(path4__default.resolve(options.cwd, "package.json"));
  if (hasExplicitMonorepoInit) {
    projectInfo = await getProjectInfo(options.cwd);
  } else if (!options.skipPreflight) {
    const preflight = await preFlightInit(options);
    if (preflight.errors[MISSING_DIR_OR_EMPTY_PROJECT]) {
      const { projectPath, template } = await createProject(options);
      if (!projectPath) {
        process.exit(1);
      }
      options.cwd = projectPath;
      options.isNewProject = true;
      newProjectTemplate = template;
      projectInfo = await getProjectInfo(options.cwd);
    } else {
      projectInfo = preflight.projectInfo;
    }
  } else {
    projectInfo = await getProjectInfo(options.cwd);
  }
  const didCreateProject = Boolean(newProjectTemplate);
  const templateKey = newProjectTemplate ?? explicitTemplate;
  const selectedTemplate = templateKey ? resolveTemplate(templates[templateKey], { monorepo: options.monorepo }) : void 0;
  const components = [
    ...options.installStyleIndex ? ["index"] : [],
    ...options.components ?? [],
    // Add button component for new template-based projects.
    ...selectedTemplate ? ["button"] : []
  ];
  if (selectedTemplate?.init) {
    const result = await selectedTemplate.init({
      projectPath: options.cwd,
      components,
      registryBaseConfig: options.registryBaseConfig,
      rtl: options.rtl ?? false,
      menuColor: options.menuColor,
      menuAccent: options.menuAccent,
      iconLibrary: options.iconLibrary,
      silent: options.silent
    });
    if (didCreateProject) {
      await selectedTemplate.postInit({ projectPath: options.cwd });
    }
    return result;
  }
  const projectConfig = await getProjectConfig(options.cwd, projectInfo);
  let config = projectConfig ? await promptForMinimalConfig(projectConfig, options) : await promptForConfig(await getConfig(options.cwd));
  if (!options.yes) {
    const { proceed } = await prompts5({
      type: "confirm",
      name: "proceed",
      message: `Write configuration to ${highlighter.info(
        "components.json"
      )}. Proceed?`,
      initial: true
    });
    if (!proceed) {
      process.exit(1);
    }
  }
  const fullConfigForRegistry = await resolveConfigPaths(options.cwd, config);
  const { config: configWithRegistries } = await ensureRegistriesInConfig(
    components,
    fullConfigForRegistry,
    {
      silent: true
    }
  );
  if (configWithRegistries.registries) {
    config.registries = configWithRegistries.registries;
  }
  const componentSpinner = spinner(`Writing components.json.`).start();
  const targetPath = path4__default.resolve(options.cwd, "components.json");
  const backupPath = `${targetPath}${FILE_BACKUP_SUFFIX}`;
  const mergeConfig = (base, override) => {
    const { registries, ...merged } = deepmerge3(base, override);
    return { ...merged, registries };
  };
  if (fs11.existsSync(backupPath)) {
    const existingConfig = await fs11.readJson(backupPath);
    if (options.force) {
      if (existingConfig.registries) {
        config.registries = {
          ...existingConfig.registries,
          ...config.registries || {}
        };
      }
    } else {
      config = mergeConfig(existingConfig, config);
    }
  }
  if (options.registryBaseConfig) {
    config = mergeConfig(config, options.registryBaseConfig);
  }
  if (options.rtl !== void 0) {
    config.rtl = options.rtl;
  }
  config.registries = Object.fromEntries(
    Object.entries(config.registries || {}).filter(
      ([key]) => !Object.keys(BUILTIN_REGISTRIES).includes(key)
    )
  );
  await promises.writeFile(targetPath, `${JSON.stringify(config, null, 2)}
`, "utf8");
  componentSpinner.succeed();
  const fullConfig = await resolveConfigPaths(options.cwd, config);
  const workspaceConfig = await getWorkspaceConfig(fullConfig);
  if (workspaceConfig) {
    const designSettings = {};
    if (config.menuColor) designSettings.menuColor = config.menuColor;
    if (config.menuAccent) designSettings.menuAccent = config.menuAccent;
    if (config.rtl !== void 0) designSettings.rtl = config.rtl;
    if (config.iconLibrary) designSettings.iconLibrary = config.iconLibrary;
    if (Object.keys(designSettings).length > 0) {
      for (const key of Object.keys(workspaceConfig)) {
        const wsConfig = workspaceConfig[key];
        if (wsConfig.resolvedPaths.cwd === fullConfig.resolvedPaths.cwd) {
          continue;
        }
        const wsConfigPath = path4__default.resolve(
          wsConfig.resolvedPaths.cwd,
          "components.json"
        );
        if (fs11.existsSync(wsConfigPath)) {
          const wsRawConfig = await fs11.readJson(wsConfigPath);
          await fs11.writeJson(
            wsConfigPath,
            { ...wsRawConfig, ...designSettings },
            { spaces: 2 }
          );
        }
      }
    }
  }
  explorer.clearCaches();
  await addComponents(components, fullConfig, {
    // Init will always overwrite files.
    overwrite: true,
    // Reinstall should overwrite existing CSS variables.
    overwriteCssVars: options.reinstall || void 0,
    silent: options.silent,
    isNewProject: options.isNewProject || projectInfo?.framework.name === "next-app"
  });
  if (selectedTemplate && didCreateProject) {
    await selectedTemplate.postInit({ projectPath: options.cwd });
  }
  return fullConfig;
}
async function promptForConfig(defaultConfig = null) {
  const [styles, baseColors] = await Promise.all([
    getRegistryStyles(),
    getRegistryBaseColors()
  ]);
  logger.info("");
  const options = await prompts5([
    {
      type: "toggle",
      name: "typescript",
      message: `Would you like to use ${highlighter.info(
        "TypeScript"
      )} (recommended)?`,
      initial: defaultConfig?.tsx ?? true,
      active: "yes",
      inactive: "no"
    },
    {
      type: "select",
      name: "style",
      message: `Which ${highlighter.info("style")} would you like to use?`,
      choices: styles.map((style) => ({
        title: style.label,
        value: style.name
      }))
    },
    {
      type: "select",
      name: "tailwindBaseColor",
      message: `Which color would you like to use as the ${highlighter.info(
        "base color"
      )}?`,
      choices: baseColors.map((color) => ({
        title: color.label,
        value: color.name
      }))
    },
    {
      type: "text",
      name: "tailwindCss",
      message: `Where is your ${highlighter.info("global CSS")} file?`,
      initial: defaultConfig?.tailwind.css ?? DEFAULT_TAILWIND_CSS
    },
    {
      type: "toggle",
      name: "tailwindCssVariables",
      message: `Would you like to use ${highlighter.info(
        "CSS variables"
      )} for theming?`,
      initial: defaultConfig?.tailwind.cssVariables ?? true,
      active: "yes",
      inactive: "no"
    },
    {
      type: "text",
      name: "tailwindPrefix",
      message: `Are you using a custom ${highlighter.info(
        "tailwind prefix eg. tw-"
      )}? (Leave blank if not)`,
      initial: ""
    },
    {
      type: "text",
      name: "tailwindConfig",
      message: `Where is your ${highlighter.info(
        "tailwind.config.js"
      )} located?`,
      initial: defaultConfig?.tailwind.config ?? DEFAULT_TAILWIND_CONFIG
    },
    {
      type: "text",
      name: "components",
      message: `Configure the import alias for ${highlighter.info(
        "components"
      )}:`,
      initial: defaultConfig?.aliases["components"] ?? DEFAULT_COMPONENTS
    },
    {
      type: "text",
      name: "utils",
      message: `Configure the import alias for ${highlighter.info("utils")}:`,
      initial: defaultConfig?.aliases["utils"] ?? DEFAULT_UTILS
    },
    {
      type: "toggle",
      name: "rsc",
      message: `Are you using ${highlighter.info("React Server Components")}?`,
      initial: defaultConfig?.rsc ?? true,
      active: "yes",
      inactive: "no"
    }
  ]);
  if (!options.style) {
    process.exit(1);
  }
  return rawConfigSchema.parse({
    $schema: "https://ui.shadcn.com/schema.json",
    style: options.style,
    tailwind: {
      config: options.tailwindConfig,
      css: options.tailwindCss,
      baseColor: options.tailwindBaseColor,
      cssVariables: options.tailwindCssVariables,
      prefix: options.tailwindPrefix
    },
    rsc: options.rsc,
    tsx: options.typescript,
    aliases: {
      utils: options.utils,
      components: options.components,
      // TODO: fix this.
      lib: options.components.replace(/\/components$/, "lib"),
      hooks: options.components.replace(/\/components$/, "hooks")
    }
  });
}
async function promptForMinimalConfig(defaultConfig, opts) {
  let style = defaultConfig.style;
  let baseColor = "neutral";
  let cssVariables = defaultConfig.tailwind.cssVariables;
  let iconLibrary = defaultConfig.iconLibrary ?? "lucide";
  if (!opts.defaults) {
    const [styles, tailwindVersion] = await Promise.all([
      getRegistryStyles(),
      getProjectTailwindVersionFromConfig(defaultConfig)
    ]);
    const options = await prompts5([
      {
        // Skip style prompt if using Tailwind v4 or style is already set in config.
        type: tailwindVersion === "v4" || style ? null : "select",
        name: "style",
        message: `Which ${highlighter.info("style")} would you like to use?`,
        choices: styles.map((style2) => ({
          title: style2.name === "new-york" ? "New York (Recommended)" : style2.label,
          value: style2.name
        })),
        initial: 0
      }
    ]);
    style = options.style ?? style ?? "new-york";
  }
  cssVariables = opts.cssVariables;
  return rawConfigSchema.parse({
    $schema: defaultConfig?.$schema,
    style,
    tailwind: {
      ...defaultConfig?.tailwind,
      baseColor,
      cssVariables
    },
    rsc: defaultConfig?.rsc,
    tsx: defaultConfig?.tsx,
    iconLibrary,
    rtl: opts.rtl ?? defaultConfig?.rtl ?? false,
    aliases: defaultConfig?.aliases
  });
}
async function confirmBaseSwitch(existingStyle, resolvedBase) {
  const oldBase = existingStyle.startsWith("base-") ? "base" : "radix";
  if (resolvedBase === oldBase) return resolvedBase;
  logger.warn(
    `  You are switching from ${highlighter.info(
      oldBase
    )} to ${highlighter.info(resolvedBase)}.`
  );
  logger.warn(
    `  Components outside the ${highlighter.info(
      "ui"
    )} directory that depend on ${highlighter.info(
      oldBase
    )} primitives may need manual updates.`
  );
  logger.break();
  const { proceed } = await prompts5({
    type: "confirm",
    name: "proceed",
    message: "Would you like to continue?",
    initial: false
  });
  return proceed ? resolvedBase : oldBase;
}
async function preFlightAdd(options) {
  const errors = {};
  if (!fs11.existsSync(options.cwd) || !fs11.existsSync(path4__default.resolve(options.cwd, "package.json"))) {
    errors[MISSING_DIR_OR_EMPTY_PROJECT] = true;
    return {
      errors,
      config: null
    };
  }
  if (!fs11.existsSync(path4__default.resolve(options.cwd, "components.json"))) {
    if (await isMonorepoRoot(options.cwd)) {
      const targets = await getMonorepoTargets(options.cwd);
      if (targets.length > 0) {
        formatMonorepoMessage("add [component]", targets);
        process.exit(1);
      }
    }
    errors[MISSING_CONFIG] = true;
    return {
      errors,
      config: null
    };
  }
  try {
    const config = await getConfig(options.cwd);
    return {
      errors,
      config
    };
  } catch (error) {
    logger.break();
    logger.error(
      `An invalid ${highlighter.info(
        "components.json"
      )} file was found at ${highlighter.info(
        options.cwd
      )}.
Before you can add components, you must create a valid ${highlighter.info(
        "components.json"
      )} file by running the ${highlighter.info("init")} command.`
    );
    logger.error(
      `Learn more at ${highlighter.info(`${SHADCN_URL}/docs/components-json`)}.`
    );
    logger.break();
    process.exit(1);
  }
}
async function dryRunComponents(components, config, options = {}) {
  const result = {
    files: [],
    dependencies: [],
    devDependencies: [],
    css: null,
    envVars: null,
    fonts: [],
    docs: null
  };
  if (!components.length) {
    return result;
  }
  let tree = await resolveRegistryTree(components, configWithDefaults(config));
  if (!tree) {
    throw new Error("Failed to fetch components from registry.");
  }
  if (!options.skipFonts) {
    tree = await massageTreeForFonts(tree, config);
  }
  const supportedFontMarkers = getSupportedFontMarkers2([tree]);
  result.dependencies = Array.from(new Set(tree.dependencies ?? []));
  result.devDependencies = Array.from(new Set(tree.devDependencies ?? []));
  result.docs = tree.docs ?? null;
  await processFiles(tree, config, result, options, supportedFontMarkers);
  await processCss(tree, config, result, options);
  processEnvVars(tree, config, result);
  if (!options.skipFonts) {
    processFonts(tree, result);
  }
  return result;
}
async function processFiles(tree, config, result, options, supportedFontMarkers) {
  const files = tree.files;
  if (!files?.length) {
    return;
  }
  const [projectInfo, baseColor] = await Promise.all([
    getProjectInfo(config.resolvedPaths.cwd),
    config.tailwind.baseColor ? getRegistryBaseColor(config.tailwind.baseColor) : Promise.resolve(void 0)
  ]);
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (!file.content) {
      continue;
    }
    let filePath = resolveFilePath(file, config, {
      isSrcDir: projectInfo?.isSrcDir,
      framework: projectInfo?.framework.name,
      commonRoot: findCommonRoot(
        files.map((f) => f.path),
        file.path
      ),
      fileIndex: index
    });
    if (!filePath) {
      continue;
    }
    if (!config.tsx) {
      filePath = filePath.replace(
        /\.tsx?$/,
        (match) => match === ".tsx" ? ".jsx" : ".js"
      );
    }
    const existingFile = existsSync(filePath);
    const relativePath = path4__default.relative(config.resolvedPaths.cwd, filePath);
    const isUniversalItemFile = file.type === "registry:file" || file.type === "registry:item";
    const content = isEnvFile(filePath) || isUniversalItemFile ? file.content : await transform(
      {
        filename: file.path,
        raw: file.content,
        config,
        baseColor,
        transformJsx: !config.tsx,
        isRemote: false,
        supportedFontMarkers
      },
      [
        transformImport,
        transformRsc,
        transformCssVars,
        transformTwPrefixes,
        transformIcons,
        transformMenu,
        transformAsChild,
        transformRtl,
        transformFont,
        transformCleanup
      ]
    );
    let action = "create";
    let oldContent;
    if (existingFile) {
      oldContent = await promises.readFile(filePath, "utf-8");
      if (isContentSame(oldContent, content)) {
        action = "skip";
      } else {
        action = "overwrite";
      }
    }
    result.files.push({
      path: relativePath,
      action,
      content,
      ...action === "overwrite" && { existingContent: oldContent },
      type: file.type ?? "registry:ui"
    });
  }
}
async function processCss(tree, config, result, options) {
  const hasCss = tree.css && Object.keys(tree.css).length > 0;
  const hasCssVars = Object.keys(tree.cssVars ?? {}).length > 0;
  if (!config.resolvedPaths.tailwindCss || !hasCss && !hasCssVars) {
    return;
  }
  const cssFilepath = config.resolvedPaths.tailwindCss;
  const existingFile = existsSync(cssFilepath);
  const relativePath = path4__default.relative(config.resolvedPaths.cwd, cssFilepath);
  const existingContent = existingFile ? await promises.readFile(cssFilepath, "utf8") : "";
  let output = existingContent;
  if (hasCssVars) {
    output = await transformCssVars2(output, tree.cssVars, config, {
      overwriteCssVars: options.overwriteCssVars
    });
  }
  if (hasCss) {
    output = await transformCss(output, tree.css);
  }
  let cssVarsCount = 0;
  if (tree.cssVars) {
    for (const vars of Object.values(tree.cssVars)) {
      if (vars) {
        cssVarsCount += Object.keys(vars).length;
      }
    }
  }
  result.css = {
    path: relativePath,
    content: output,
    ...existingFile && { existingContent },
    action: existingFile ? "update" : "create",
    cssVarsCount
  };
}
function processEnvVars(tree, config, result) {
  if (!tree.envVars || Object.keys(tree.envVars).length === 0) {
    return;
  }
  const envFilePath = path4__default.join(config.resolvedPaths.cwd, ".env.local");
  const existingFile = existsSync(envFilePath);
  const relativePath = path4__default.relative(config.resolvedPaths.cwd, envFilePath);
  result.envVars = {
    path: relativePath,
    variables: tree.envVars,
    action: existingFile ? "update" : "create"
  };
}
function processFonts(tree, result) {
  if (!tree.fonts?.length) {
    return;
  }
  for (const font of tree.fonts) {
    result.fonts.push({
      name: font.font.family,
      provider: font.font.provider === "google" ? "Google Fonts" : font.font.provider
    });
  }
}
var MAX_OVERVIEW_FILES = 5;
var BOX_TOP = dim("\u250C" + "\u2500".repeat(46));
var BOX_BOTTOM = dim("\u2514" + "\u2500".repeat(46));
var ACTION_GLYPHS = {
  create: "+",
  overwrite: "~",
  skip: "="
};
var ACTION_LABELS = {
  create: "create",
  overwrite: "overwrite",
  skip: "skip (identical)"
};
function colorAction(action) {
  if (action === "create") return green(action);
  if (action === "overwrite" || action === "update") return yellow(action);
  return dim(action);
}
function formatHeader(componentNames) {
  return `${bold("\u250C")} ${bold(`shadcn add ${componentNames.join(", ")}`)} ${dim(
    "(dry run)"
  )}`;
}
function matchesCssPath(cssPath, filterPath) {
  return cssPath === filterPath || cssPath.includes(filterPath) || cssPath.endsWith(filterPath);
}
function pushContentBox(lines, contentLines, formatLine = (l) => l) {
  lines.push(`${dim("\u2502")} ${BOX_TOP}`);
  for (const line of contentLines) {
    lines.push(`${dim("\u2502")} ${dim("\u2502")} ${formatLine(line)}`);
  }
  lines.push(`${dim("\u2502")} ${BOX_BOTTOM}`);
}
function formatDryRunResult(result, componentNames, options = {}) {
  if (options.diff) {
    if (typeof options.diff === "string") {
      return formatDiffOutput(result, componentNames, options.diff);
    }
    return formatDiffOverview(result, componentNames);
  }
  if (options.view) {
    if (typeof options.view === "string") {
      return formatViewOutput(result, componentNames, options.view);
    }
    return formatViewOverview(result, componentNames);
  }
  return formatSummaryOutput(result, componentNames);
}
function formatSummaryOutput(result, componentNames) {
  const lines = [];
  lines.push(formatHeader(componentNames));
  lines.push(dim("\u2502"));
  formatFilesSection(result, lines);
  formatListSection("Dependencies", result.dependencies, lines);
  formatListSection("Dev Dependencies", result.devDependencies, lines);
  formatCssSection(result, lines);
  formatEnvVarsSection(result, lines);
  formatFontsSection(result, lines);
  const overwriteCount = result.files.filter(
    (f) => f.action === "overwrite"
  ).length;
  if (overwriteCount > 0) {
    lines.push(
      yellow(
        `\u26A0 ${overwriteCount} ${overwriteCount === 1 ? "file" : "files"} will be overwritten.`
      )
    );
    lines.push(dim("\u2502"));
  }
  const summaryParts = [];
  if (result.files.length > 0) {
    summaryParts.push(
      `${result.files.length} ${result.files.length === 1 ? "file" : "files"}`
    );
  }
  if (result.dependencies.length > 0) {
    summaryParts.push(
      `${result.dependencies.length} ${result.dependencies.length === 1 ? "dep" : "deps"}`
    );
  }
  if (result.css?.cssVarsCount) {
    summaryParts.push(`${result.css.cssVarsCount} CSS vars`);
  }
  if (summaryParts.length > 0) {
    lines.push(`${dim("\u2502")} ${dim(summaryParts.join(", "))}`);
    lines.push(dim("\u2502"));
  }
  lines.push(`${dim("\u2502")} ${dim("Run with --diff to view changes.")}`);
  lines.push(`${dim("\u2502")} ${dim("Run with --view to view file contents.")}`);
  lines.push(`${dim("\u2514")} ${dim("Run without --dry-run to apply.")}`);
  return lines.join("\n");
}
function formatDiffOutput(result, componentNames, filterPath) {
  const lines = [];
  lines.push(formatHeader(componentNames));
  lines.push(dim("\u2502"));
  const filesToDiff = resolveFilterPath(result.files, filterPath);
  const cssMatch = result.css && matchesCssPath(result.css.path, filterPath);
  if (filesToDiff.length === 0 && !cssMatch) {
    lines.push(
      `${dim("\u2502")} ${yellow(`No file matching "${filterPath}" found.`)}`
    );
    lines.push(dim("\u2502"));
  } else {
    for (const file of filesToDiff) {
      formatFileDiff(file, lines);
    }
    if (cssMatch && result.css) {
      lines.push(
        `${dim("\u251C")} ${bold(result.css.path)} ${dim("(")}${colorAction(
          result.css.action
        )}${dim(")")}`
      );
      if (result.css.action === "create" || !result.css.existingContent) {
        pushContentBox(
          lines,
          result.css.content.split("\n"),
          (l) => green(`+${l}`)
        );
      } else {
        const diffLines2 = computeUnifiedDiff(
          result.css.existingContent,
          result.css.content,
          result.css.path,
          { fullContext: true }
        );
        pushContentBox(lines, diffLines2);
      }
      lines.push(dim("\u2502"));
    }
  }
  lines.push(`${dim("\u2514")} ${dim("Run without --dry-run to apply.")}`);
  return lines.join("\n");
}
function formatDiffOverview(result, componentNames) {
  const lines = [];
  lines.push(formatHeader(componentNames));
  lines.push(dim("\u2502"));
  const filesToDiff = result.files.slice(0, MAX_OVERVIEW_FILES);
  if (filesToDiff.length === 0 && !result.css) {
    lines.push(`${dim("\u2502")} ${dim("No changes.")}`);
    lines.push(dim("\u2502"));
  } else {
    for (const file of filesToDiff) {
      formatFileDiff(file, lines);
    }
    const total2 = result.files.length;
    if (total2 > MAX_OVERVIEW_FILES) {
      lines.push(dim("\u2502"));
    }
  }
  const total = result.files.length;
  if (total > MAX_OVERVIEW_FILES) {
    lines.push(
      `  ${dim(
        `Showing ${MAX_OVERVIEW_FILES} of ${total} files. Use --diff <path> to view a specific file.`
      )}`
    );
  }
  lines.push(`${dim("\u2514")} ${dim("Run without --dry-run to apply.")}`);
  return lines.join("\n");
}
function formatViewOverview(result, componentNames) {
  const lines = [];
  lines.push(formatHeader(componentNames));
  lines.push(dim("\u2502"));
  const filesToView = result.files.slice(0, MAX_OVERVIEW_FILES);
  if (filesToView.length === 0 && !result.css) {
    lines.push(`${dim("\u2502")} ${dim("No files.")}`);
    lines.push(dim("\u2502"));
  } else {
    for (const file of filesToView) {
      const contentLines = file.content.split("\n");
      lines.push(
        `${dim("\u251C")} ${bold(file.path)} ${dim("(")}${colorAction(
          file.action
        )}${dim(")")} ${dim(`${contentLines.length} lines`)}`
      );
      pushContentBox(lines, contentLines);
      lines.push(dim("\u2502"));
    }
    const total2 = result.files.length;
    if (total2 > MAX_OVERVIEW_FILES) {
      lines.push(dim("\u2502"));
    }
  }
  const total = result.files.length;
  if (total > MAX_OVERVIEW_FILES) {
    lines.push(
      `  ${dim(
        `Showing ${MAX_OVERVIEW_FILES} of ${total} files. Use --view <path> to view a specific file.`
      )}`
    );
  }
  lines.push(`${dim("\u2514")} ${dim("Run without --dry-run to apply.")}`);
  return lines.join("\n");
}
function formatFileDiff(file, lines) {
  lines.push(
    `${dim("\u251C")} ${bold(file.path)} ${dim("(")}${colorAction(file.action)}${dim(
      ")"
    )}`
  );
  if (file.action === "skip") {
    lines.push(`${dim("\u2502")} ${dim("No changes.")}`);
  } else if (file.action === "create") {
    pushContentBox(lines, file.content.split("\n"), (l) => green(`+${l}`));
  } else {
    const diffLines2 = computeUnifiedDiff(
      file.existingContent,
      file.content,
      file.path
    );
    pushContentBox(lines, diffLines2);
  }
  lines.push(dim("\u2502"));
}
function formatViewOutput(result, componentNames, filterPath) {
  const lines = [];
  lines.push(formatHeader(componentNames));
  lines.push(dim("\u2502"));
  const filesToView = resolveFilterPath(result.files, filterPath);
  const cssMatch = result.css && matchesCssPath(result.css.path, filterPath);
  if (filesToView.length === 0 && !cssMatch) {
    lines.push(
      `${dim("\u2502")} ${yellow(`No file matching "${filterPath}" found.`)}`
    );
    lines.push(dim("\u2502"));
  } else {
    for (const file of filesToView) {
      const contentLines = file.content.split("\n");
      lines.push(
        `${dim("\u251C")} ${bold(file.path)} ${dim("(")}${colorAction(
          file.action
        )}${dim(")")} ${dim(`${contentLines.length} lines`)}`
      );
      pushContentBox(lines, contentLines);
      lines.push(dim("\u2502"));
    }
    if (cssMatch && result.css) {
      const contentLines = result.css.content.split("\n");
      lines.push(
        `${dim("\u251C")} ${bold(result.css.path)} ${dim("(")}${colorAction(
          result.css.action
        )}${dim(")")} ${dim(`${contentLines.length} lines`)}`
      );
      pushContentBox(lines, contentLines);
      lines.push(dim("\u2502"));
    }
  }
  lines.push(`${dim("\u2514")} ${dim("Run without --dry-run to apply.")}`);
  return lines.join("\n");
}
function formatFilesSection(result, lines) {
  if (result.files.length === 0) {
    return;
  }
  const counts = { create: 0, overwrite: 0, skip: 0 };
  for (const f of result.files) {
    counts[f.action]++;
  }
  const summaryParts = [];
  if (counts.create > 0) {
    summaryParts.push(green(`+${counts.create} new`));
  }
  if (counts.overwrite > 0) {
    summaryParts.push(yellow(`~${counts.overwrite} overwrite`));
  }
  if (counts.skip > 0) {
    summaryParts.push(dim(`=${counts.skip} skip`));
  }
  const summary = summaryParts.length > 0 ? ` ${summaryParts.join(dim(", "))}` : "";
  lines.push(
    `${dim("\u251C")} ${bold("Files")} ${dim(`(${result.files.length})`)}${summary}`
  );
  const maxPathLen = Math.max(...result.files.map((f) => f.path.length));
  for (const file of result.files) {
    const glyph = ACTION_GLYPHS[file.action];
    const label = ACTION_LABELS[file.action];
    const padding = " ".repeat(Math.max(1, maxPathLen - file.path.length + 2));
    const colorFn = file.action === "create" ? green : file.action === "overwrite" ? yellow : dim;
    const pathStr = file.action === "skip" ? dim(file.path) : file.path;
    lines.push(
      `${dim("\u2502")} ${colorFn(glyph)} ${pathStr}${padding}${colorFn(label)}`
    );
  }
  lines.push(dim("\u2502"));
}
function formatListSection(title, items, lines) {
  if (!items.length) {
    return;
  }
  lines.push(`${dim("\u251C")} ${bold(title)} ${dim(`(${items.length})`)}`);
  for (const item of items) {
    lines.push(`${dim("\u2502")} ${green("+")} ${item}`);
  }
  lines.push(dim("\u2502"));
}
function formatCssSection(result, lines) {
  if (!result.css) {
    return;
  }
  lines.push(`${dim("\u251C")} ${bold("CSS")}`);
  if (result.css.cssVarsCount > 0) {
    lines.push(
      `${dim("\u2502")} ${green("+")} ${result.css.cssVarsCount} CSS variables added to ${cyan(result.css.path)}`
    );
  } else {
    lines.push(`${dim("\u2502")} ${green("+")} Updated ${cyan(result.css.path)}`);
  }
  lines.push(dim("\u2502"));
}
function formatEnvVarsSection(result, lines) {
  if (!result.envVars) {
    return;
  }
  const vars = Object.keys(result.envVars.variables);
  lines.push(`${dim("\u251C")} ${bold("Environment Variables")}`);
  for (const key of vars) {
    lines.push(`${dim("\u2502")} ${green("+")} ${key}`);
  }
  lines.push(dim("\u2502"));
}
function formatFontsSection(result, lines) {
  if (!result.fonts.length) {
    return;
  }
  lines.push(`${dim("\u251C")} ${bold("Fonts")}`);
  for (const font of result.fonts) {
    lines.push(
      `${dim("\u2502")} ${green("+")} ${font.name} ${dim(`(${font.provider})`)}`
    );
  }
  lines.push(dim("\u2502"));
}
function resolveFilterPath(files, filterPath) {
  const exact = files.filter((f) => f.path === filterPath);
  if (exact.length > 0) {
    return exact;
  }
  return files.filter(
    (f) => f.path.includes(filterPath) || f.path.replace(/\\/g, "/").includes(filterPath)
  );
}
function computeUnifiedDiff(oldStr, newStr, filePath, options = {}) {
  if (isFormattingOnly(oldStr, newStr)) {
    return [dim("  Formatting-only changes (spacing, quotes, semicolons).")];
  }
  const normalizedOld = normalizeFileForDiff(oldStr);
  const normalizedNew = normalizeFileForDiff(newStr);
  const contextLines = options.fullContext ? Math.max(
    normalizedOld.split("\n").length,
    normalizedNew.split("\n").length
  ) : 3;
  const patch = structuredPatch(
    `a/${filePath}`,
    `b/${filePath}`,
    normalizedOld,
    normalizedNew,
    "",
    "",
    { context: contextLines }
  );
  if (!patch.hunks.length) {
    return [dim("  No changes.")];
  }
  const output = [dim(`--- a/${filePath}`), dim(`+++ b/${filePath}`)];
  const newLines = newStr.split("\n");
  for (const hunk of patch.hunks) {
    const { entries} = processHunk(hunk, newLines);
    if (!entries.some((e) => e.kind !== "context")) {
      continue;
    }
    const contextCount = entries.filter((e) => e.kind === "context").length;
    const removedCount = entries.filter((e) => e.kind === "removed").length;
    const addedCount = entries.filter((e) => e.kind === "added").length;
    output.push(
      cyan(
        `@@ -${hunk.oldStart},${contextCount + removedCount} +${hunk.newStart},${contextCount + addedCount} @@`
      )
    );
    for (const entry of entries) {
      output.push(entry.formatted);
    }
  }
  return output;
}
function processHunk(hunk, newLines) {
  const entries = [];
  let newLineIndex = hunk.newStart - 1;
  let i = 0;
  while (i < hunk.lines.length) {
    const line = hunk.lines[i];
    if (line.startsWith("-")) {
      const removed = [];
      while (i < hunk.lines.length && hunk.lines[i].startsWith("-")) {
        removed.push(hunk.lines[i].slice(1));
        i++;
      }
      while (i < hunk.lines.length && hunk.lines[i].startsWith("\\")) {
        i++;
      }
      const added = [];
      while (i < hunk.lines.length && hunk.lines[i].startsWith("+")) {
        added.push(hunk.lines[i].slice(1));
        i++;
      }
      while (i < hunk.lines.length && hunk.lines[i].startsWith("\\")) {
        i++;
      }
      newLineIndex = processChangeGroup(
        removed,
        added,
        newLines,
        newLineIndex,
        entries
      );
    } else if (line.startsWith("+")) {
      const actual = newLines[newLineIndex] ?? line.slice(1);
      entries.push({ kind: "added", formatted: green(`+${actual}`) });
      newLineIndex++;
      i++;
    } else if (line.startsWith("\\")) {
      i++;
    } else {
      const actual = newLines[newLineIndex] ?? line.slice(1);
      entries.push({ kind: "context", formatted: dim(` ${actual}`) });
      newLineIndex++;
      i++;
    }
  }
  return { entries, newLineIndex };
}
function processChangeGroup(removed, added, newLines, newLineIndex, entries) {
  if (isGroupFormattingOnly(removed, added)) {
    for (let j = 0; j < added.length; j++) {
      const actual = newLines[newLineIndex] ?? added[j];
      entries.push({ kind: "context", formatted: dim(` ${actual}`) });
      newLineIndex++;
    }
    return newLineIndex;
  }
  const collapsedRemoved = collapseContLines(removed);
  const normalizedCollapsed = collapsedRemoved.map(normalizeLine);
  const usedCollapsed = /* @__PURE__ */ new Set();
  for (let j = 0; j < added.length; j++) {
    const actualNewLine = newLines[newLineIndex] ?? added[j];
    const normalizedAdded = normalizeLine(added[j]);
    const matchIdx = normalizedCollapsed.findIndex(
      (nr, idx) => !usedCollapsed.has(idx) && nr === normalizedAdded
    );
    if (matchIdx !== -1) {
      usedCollapsed.add(matchIdx);
      entries.push({ kind: "context", formatted: dim(` ${actualNewLine}`) });
    } else {
      const unmatchedIdx = normalizedCollapsed.findIndex(
        (_, idx) => !usedCollapsed.has(idx)
      );
      if (unmatchedIdx !== -1) {
        usedCollapsed.add(unmatchedIdx);
        const { oldHighlighted, newHighlighted } = highlightInlineChanges(
          collapsedRemoved[unmatchedIdx],
          actualNewLine
        );
        entries.push({ kind: "removed", formatted: oldHighlighted });
        entries.push({ kind: "added", formatted: newHighlighted });
      } else {
        entries.push({
          kind: "added",
          formatted: green(`+${actualNewLine}`)
        });
      }
    }
    newLineIndex++;
  }
  for (let j = 0; j < collapsedRemoved.length; j++) {
    if (!usedCollapsed.has(j)) {
      entries.push({
        kind: "removed",
        formatted: red(`-${collapsedRemoved[j]}`)
      });
    }
  }
  return newLineIndex;
}
function normalizeFileForDiff(str) {
  return str.split("\n").map((line) => {
    const indent = line.match(/^(\s*)/)?.[1] ?? "";
    const content = line.slice(indent.length);
    return indent + content.replace(/['"]/g, '"').replace(/;$/g, "");
  }).join("\n");
}
function collapseContLines(lines) {
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    while (i + 1 < lines.length && line.trimEnd().endsWith(":")) {
      i++;
      line = line.trimEnd() + " " + lines[i].trim();
    }
    result.push(line);
  }
  return result;
}
function highlightInlineChanges(oldLine, newLine) {
  const changes = diffWords(oldLine, newLine);
  let oldHighlighted = "-";
  let newHighlighted = "+";
  for (const change of changes) {
    if (change.added) {
      newHighlighted += bold(green(change.value));
    } else if (change.removed) {
      oldHighlighted += bold(red(change.value));
    } else {
      oldHighlighted += red(change.value);
      newHighlighted += green(change.value);
    }
  }
  return { oldHighlighted, newHighlighted };
}
function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim().replace(/['"]/g, "'").replace(/;/g, "").replace(/,$/, "");
}
function isFormattingOnly(oldStr, newStr) {
  const normalize = (str) => str.split("\n").map(normalizeLine).filter((line) => line.length > 0).join(" ");
  return normalize(oldStr) === normalize(newStr);
}
function isGroupFormattingOnly(removed, added) {
  const normalizeGroup = (lines) => lines.map(normalizeLine).filter((line) => line.length > 0).join(" ");
  return normalizeGroup(removed) === normalizeGroup(added);
}
async function updateAppIndex(component, config) {
  const indexPath = path4__default.join(config.resolvedPaths.cwd, "app/page.tsx");
  if (!(await fs25__default.stat(indexPath)).isFile()) {
    return;
  }
  const [registryItem] = await getRegistryItems([component], { config });
  if (!registryItem?.meta?.importSpecifier || !registryItem?.meta?.moduleSpecifier) {
    return;
  }
  const content = `import { ${registryItem?.meta?.importSpecifier} } from "${registryItem.meta.moduleSpecifier}"

export default function Page() {
  return <${registryItem?.meta?.importSpecifier} />
}`;
  await fs25__default.writeFile(indexPath, content, "utf8");
}
var addOptionsSchema = z.object({
  components: z.array(z.string()).optional(),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  all: z.boolean(),
  path: z.string().optional(),
  silent: z.boolean(),
  dryRun: z.boolean(),
  diff: z.union([z.string(), z.literal(true)]).optional(),
  view: z.union([z.string(), z.literal(true)]).optional()
});
var add = new Command().name("add").description("add a component to your project").argument("[components...]", "names, url or local path to component").option("-y, --yes", "skip confirmation prompt.", false).option("-o, --overwrite", "overwrite existing files.", false).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("-a, --all", "add all available components", false).option("-p, --path <path>", "the path to add the component to.").option("-s, --silent", "mute output.", false).option("--dry-run", "preview changes without writing files.", false).option("--diff [path]", "show diff for a file.").option("--view [path]", "show file contents.").action(async (components, opts) => {
  try {
    const options = addOptionsSchema.parse({
      components,
      ...opts,
      cwd: path4__default.resolve(opts.cwd)
    });
    await loadEnvFiles(options.cwd);
    const isDryRun = options.dryRun || options.diff || options.view;
    let initialConfig = await getConfig(options.cwd);
    if (!initialConfig) {
      initialConfig = createConfig({
        style: "new-york",
        resolvedPaths: {
          cwd: options.cwd
        }
      });
    }
    let hasNewRegistries = false;
    if (components.length > 0) {
      const { config: updatedConfig2, newRegistries } = await ensureRegistriesInConfig(components, initialConfig, {
        silent: options.silent,
        writeFile: false
      });
      initialConfig = updatedConfig2;
      hasNewRegistries = newRegistries.length > 0;
    }
    let itemType;
    let shouldInstallStyleIndex = true;
    if (components.length > 0) {
      const [registryItem] = await getRegistryItems([components[0]], {
        config: initialConfig
      });
      itemType = registryItem?.type;
      shouldInstallStyleIndex = itemType !== "registry:theme" && itemType !== "registry:style" && itemType !== "registry:base";
      if (isUniversalRegistryItem(registryItem) && !isDryRun) {
        await addComponents(components, initialConfig, options);
        return;
      }
      if (!options.yes && !isDryRun && (itemType === "registry:style" || itemType === "registry:theme")) {
        logger.break();
        const { confirm } = await prompts5({
          type: "confirm",
          name: "confirm",
          message: highlighter.warn(
            `You are about to install a new ${itemType.replace(
              "registry:",
              ""
            )}. 
Existing CSS variables and components will be overwritten. Continue?`
          )
        });
        if (!confirm) {
          logger.break();
          logger.log(`Installation cancelled.`);
          logger.break();
          process.exit(1);
        }
      }
    }
    if (!options.components?.length) {
      options.components = await promptForRegistryComponents(options);
    }
    const projectInfo = await getProjectInfo(options.cwd);
    if (projectInfo?.tailwindVersion === "v4") {
      const deprecatedComponents = DEPRECATED_COMPONENTS.filter(
        (component) => options.components?.includes(component.name)
      );
      if (deprecatedComponents?.length) {
        logger.break();
        deprecatedComponents.forEach((component) => {
          logger.warn(highlighter.warn(component.message));
        });
        logger.break();
        process.exit(1);
      }
    }
    let { errors, config } = await preFlightAdd(options);
    let initHasRun = false;
    if (errors[MISSING_CONFIG]) {
      const { proceed } = await prompts5({
        type: "confirm",
        name: "proceed",
        message: `You need to create a ${highlighter.info(
          "components.json"
        )} file to add components. Proceed?`,
        initial: true
      });
      if (!proceed) {
        logger.break();
        process.exit(1);
      }
      const inferredTemplate = getTemplateForFramework(
        projectInfo?.framework.name
      );
      const base = await promptForBase();
      const { url: initUrl } = await promptForPreset({
        rtl: false,
        base,
        template: inferredTemplate
      });
      const {
        registryBaseConfig,
        installStyleIndex,
        url: cleanInitUrl
      } = await resolveRegistryBaseConfig(initUrl, options.cwd);
      config = await runInit({
        cwd: options.cwd,
        yes: true,
        force: true,
        defaults: false,
        skipPreflight: false,
        silent: options.silent && !hasNewRegistries,
        isNewProject: false,
        cssVariables: true,
        rtl: false,
        installStyleIndex,
        components: [cleanInitUrl, ...options.components ?? []],
        registryBaseConfig
      });
      initHasRun = true;
    }
    let shouldUpdateAppIndex = false;
    if (errors[MISSING_DIR_OR_EMPTY_PROJECT]) {
      const { projectPath, template } = await createProject({
        cwd: options.cwd,
        force: options.overwrite,
        components: options.components
      });
      if (!projectPath) {
        logger.break();
        process.exit(1);
      }
      options.cwd = projectPath;
      const selectedBase = await promptForBase();
      const { url: initUrl } = await promptForPreset({
        rtl: false,
        base: selectedBase,
        template
      });
      const {
        registryBaseConfig,
        installStyleIndex,
        url: cleanInitUrl
      } = await resolveRegistryBaseConfig(initUrl, options.cwd);
      config = await runInit({
        cwd: options.cwd,
        yes: true,
        force: true,
        defaults: false,
        skipPreflight: true,
        silent: !hasNewRegistries && options.silent,
        isNewProject: true,
        cssVariables: true,
        rtl: false,
        installStyleIndex,
        components: [cleanInitUrl, ...options.components ?? []],
        registryBaseConfig
      });
      initHasRun = true;
      shouldUpdateAppIndex = options.components?.length === 1 && !!options.components[0].match(/\/chat\/b\//);
    }
    if (!config) {
      throw new Error(
        `Failed to read config at ${highlighter.info(options.cwd)}.`
      );
    }
    const { config: updatedConfig } = await ensureRegistriesInConfig(
      options.components,
      config,
      {
        silent: options.silent || hasNewRegistries,
        writeFile: !isDryRun
      }
    );
    config = updatedConfig;
    if (isDryRun) {
      const dryRunSpinner = spinner("Resolving items.", {
        silent: options.silent
      }).start();
      const dryRunResult = await dryRunComponents(
        options.components,
        config,
        {
          overwrite: options.overwrite
        }
      );
      dryRunSpinner.stop();
      logger.log(
        formatDryRunResult(dryRunResult, options.components, {
          diff: options.diff,
          view: options.view
        })
      );
      return;
    }
    if (!initHasRun) {
      await addComponents(options.components, config, options);
    }
    if (shouldUpdateAppIndex) {
      await updateAppIndex(options.components[0], config);
    }
  } catch (error) {
    logger.break();
    handleError(error);
  } finally {
    clearRegistryContext();
  }
});
async function promptForRegistryComponents(options) {
  const registryIndex = await getShadcnRegistryIndex();
  if (!registryIndex) {
    logger.break();
    handleError(new Error("Failed to fetch registry index."));
    return [];
  }
  if (options.all) {
    return registryIndex.map((entry) => entry.name).filter(
      (component) => !DEPRECATED_COMPONENTS.some((c) => c.name === component)
    );
  }
  if (options.components?.length) {
    return options.components;
  }
  const { components } = await prompts5({
    type: "multiselect",
    name: "components",
    message: "Which components would you like to add?",
    hint: "Space to select. A to toggle all. Enter to submit.",
    instructions: false,
    choices: registryIndex.filter(
      (entry) => entry.type === "registry:ui" && !DEPRECATED_COMPONENTS.some(
        (component) => component.name === entry.name
      )
    ).map((entry) => ({
      title: entry.name,
      value: entry.name,
      selected: options.all ? true : options.components?.includes(entry.name)
    }))
  });
  if (!components?.length) {
    logger.warn("No components selected. Exiting.");
    logger.info("");
    process.exit(1);
  }
  const result = z.array(z.string()).safeParse(components);
  if (!result.success) {
    logger.error("");
    handleError(new Error("Something went wrong. Please try again."));
    return [];
  }
  return result.data;
}
async function preFlightApply(options) {
  const errors = {};
  if (!fs11.existsSync(options.cwd) || !fs11.existsSync(path4__default.resolve(options.cwd, "package.json"))) {
    errors[MISSING_DIR_OR_EMPTY_PROJECT] = true;
    return {
      errors,
      config: null
    };
  }
  if (!fs11.existsSync(path4__default.resolve(options.cwd, "components.json"))) {
    if (await isMonorepoRoot(options.cwd)) {
      const targets = await getMonorepoTargets(options.cwd);
      if (targets.length > 0) {
        formatMonorepoMessage("apply --preset <preset>", targets, {
          cwdFlag: "-c"
        });
        process.exit(1);
      }
    }
    errors[MISSING_CONFIG] = true;
    return {
      errors,
      config: null
    };
  }
  try {
    const config = await getConfig(options.cwd);
    return {
      errors,
      config
    };
  } catch {
    logger.break();
    logger.error(
      `An invalid ${highlighter.info(
        "components.json"
      )} file was found at ${highlighter.info(
        options.cwd
      )}.
Before you can apply a preset, you must create a valid ${highlighter.info(
        "components.json"
      )} file by running the ${highlighter.info("init")} command.`
    );
    logger.error(
      `Learn more at ${highlighter.info(`${SHADCN_URL}/docs/components-json`)}.`
    );
    logger.break();
    process.exit(1);
  }
}
var applyOptionsSchema = z.object({
  cwd: z.string(),
  positionalPreset: z.string().optional(),
  preset: z.string().optional(),
  only: z.union([z.boolean(), z.string()]).optional(),
  yes: z.boolean(),
  silent: z.boolean()
});
var APPLY_ONLY_VALUES = ["theme", "font"];
var ApplyOnlyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ApplyOnlyError";
  }
};
var apply = new Command().name("apply").description("apply a preset to an existing project").argument("[preset]", "the preset to apply").option("--preset <preset>", "preset configuration to apply").option("--only [parts]", "apply only parts of a preset: theme, font").option("-y, --yes", "skip confirmation prompt.", false).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("-s, --silent", "mute output.", false).action(async (positionalPreset, opts) => {
  try {
    const options = applyOptionsSchema.parse({
      ...opts,
      cwd: path4__default.resolve(opts.cwd),
      positionalPreset
    });
    const preset = resolveApplyPreset(options);
    const explicitOnly = resolveApplyOnly(options.only);
    validateApplyOnlyPreset({ preset, only: explicitOnly });
    const preflight = await preFlightApply(options);
    if (preflight.errors[MISSING_DIR_OR_EMPTY_PROJECT]) {
      logger.break();
      logger.error(
        `The ${highlighter.info(
          "apply"
        )} command only works in an existing project.`
      );
      logger.error(`Run ${highlighter.info(getInitCommand(preset))} first.`);
      logger.break();
      process.exit(1);
    }
    if (preflight.errors[MISSING_CONFIG]) {
      logger.break();
      logger.error(
        `No ${highlighter.info("components.json")} found at ${highlighter.info(
          options.cwd
        )}.`
      );
      logger.error(`Run ${highlighter.info(getInitCommand(preset))} first.`);
      logger.break();
      process.exit(1);
    }
    const existingConfig = preflight.config;
    if (!existingConfig) {
      process.exit(1);
    }
    const rtl = existingConfig.rtl ?? false;
    const template = await resolveApplyTemplate(options.cwd);
    if (!preset) {
      const createUrl = resolveCreateUrl({
        command: "init",
        template,
        base: getBase(existingConfig.style),
        rtl
      });
      await promptToOpenPresetBuilder({
        createUrl,
        followUp: `Then run ${highlighter.info(
          "shadcn apply --preset <preset>"
        )} with the preset code or preset URL from ui.shadcn.com.`,
        prompt: !options.yes
      });
      process.exit(0);
    }
    validatePreset(preset);
    const only = explicitOnly ?? resolveApplyOnly(getPresetUrlOnly(preset));
    const shouldReinstallComponents = !only;
    const reinstallComponents = shouldReinstallComponents ? await getProjectComponents(options.cwd) : [];
    if (!options.yes) {
      logger.break();
      if (!only) {
        logger.warn(
          highlighter.warn(
            `Applying a new preset will overwrite existing UI components, fonts, and CSS variables.`
          )
        );
      } else {
        logger.warn(
          highlighter.warn(
            `Applying the selected preset parts will update your project configuration and styles.`
          )
        );
      }
      logger.warn(
        `Commit or stash your changes before continuing so you can easily go back.`
      );
      if (shouldReinstallComponents) {
        logger.break();
        logger.log("  The following components will be re-installed:");
        if (reinstallComponents.length) {
          for (let i = 0; i < reinstallComponents.length; i += 8) {
            logger.log(
              `  - ${reinstallComponents.slice(i, i + 8).join(", ")}`
            );
          }
        } else {
          logger.log("  - No installed UI components were detected.");
        }
      }
      logger.break();
      const { proceed } = await prompts5({
        type: "confirm",
        name: "proceed",
        message: "Would you like to continue?",
        initial: false
      });
      if (!proceed) {
        logger.break();
        process.exit(1);
      }
    }
    await loadEnvFiles(options.cwd);
    const currentBase = getBase(existingConfig.style);
    const initUrl = resolveApplyInitUrl(preset, currentBase, {
      template,
      rtl,
      only: only?.join(",")
    });
    await withFileBackup(
      path4__default.resolve(options.cwd, "components.json"),
      async () => {
        const {
          registryBaseConfig,
          installStyleIndex,
          url: cleanUrl
        } = await resolveRegistryBaseConfig(initUrl, options.cwd, {
          registries: existingConfig.registries
        });
        const applyRegistryBaseConfig = resolveApplyRegistryBaseConfig({
          registryBaseConfig,
          existingConfig,
          only
        });
        await runInit({
          cwd: options.cwd,
          yes: true,
          force: false,
          reinstall: shouldReinstallComponents,
          defaults: false,
          silent: options.silent,
          isNewProject: false,
          cssVariables: true,
          installStyleIndex,
          registryBaseConfig: applyRegistryBaseConfig,
          existingConfig,
          components: [cleanUrl, ...reinstallComponents]
        });
      },
      {
        onBackupFailure: () => {
          logger.error(
            `Could not back up ${highlighter.info(
              "components.json"
            )}. Aborting.`
          );
        }
      }
    );
    logger.break();
    logger.log("Preset applied successfully.");
    logger.break();
  } catch (error) {
    if (error instanceof ApplyOnlyError) {
      for (const line of error.message.split("\n")) {
        logger.error(line);
      }
      logger.break();
      process.exit(1);
    }
    logger.break();
    handleError(error);
  } finally {
    clearRegistryContext();
  }
});
function resolveApplyPreset(options) {
  const positionalPreset = options.positionalPreset?.trim();
  const flagPreset = options.preset?.trim();
  if (positionalPreset && flagPreset && positionalPreset !== flagPreset) {
    logger.error(
      `Received two different preset values. Use either the positional preset or ${highlighter.info(
        "--preset"
      )}, or pass the same value to both.`
    );
    logger.break();
    process.exit(1);
  }
  return flagPreset ?? positionalPreset;
}
function getPresetUrlOnly(preset) {
  if (!isUrl(preset)) {
    return void 0;
  }
  const url = new URL(preset);
  if (url.pathname !== "/init") {
    return void 0;
  }
  return url.searchParams.get("only") ?? void 0;
}
function resolveApplyOnly(value) {
  if (value === void 0 || value === false) {
    return void 0;
  }
  if (value === true) {
    throw new ApplyOnlyError(
      [
        "Missing value for --only.",
        `Use one or more of: ${APPLY_ONLY_VALUES.join(", ")}.`,
        "Example: shadcn apply <preset> --only theme,font."
      ].join("\n")
    );
  }
  return parseApplyOnlyParts(value);
}
function parseApplyOnlyParts(value) {
  const aliases = {
    theme: "theme",
    font: "font",
    fonts: "font"
  };
  const parts = value.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
  const invalid = parts.filter((part) => !aliases[part]);
  if (!parts.length || invalid.length) {
    throw new ApplyOnlyError(
      [
        `Invalid value for --only: ${value}.`,
        `Use one or more of: ${APPLY_ONLY_VALUES.join(", ")}.`,
        "Example: shadcn apply <preset> --only theme,font."
      ].join("\n")
    );
  }
  return Array.from(new Set(parts.map((part) => aliases[part])));
}
function validateApplyOnlyPreset(options) {
  if (!options.only || options.preset) {
    return;
  }
  throw new ApplyOnlyError(
    [
      "Missing preset for --only.",
      "Use: shadcn apply <preset> --only theme,font."
    ].join("\n")
  );
}
function resolveApplyRegistryBaseConfig(options) {
  if (!options.only || options.only.includes("theme")) {
    return options.registryBaseConfig;
  }
  const existingTailwind = typeof options.existingConfig.tailwind === "object" && options.existingConfig.tailwind !== null ? options.existingConfig.tailwind : {};
  const registryTailwind = typeof options.registryBaseConfig?.tailwind === "object" && options.registryBaseConfig.tailwind !== null ? options.registryBaseConfig.tailwind : {};
  const config = {
    ...options.registryBaseConfig,
    tailwind: {
      ...existingTailwind,
      ...registryTailwind
    }
  };
  if (options.existingConfig.menuColor) {
    config.menuColor = options.existingConfig.menuColor;
  }
  if (options.existingConfig.menuAccent) {
    config.menuAccent = options.existingConfig.menuAccent;
  }
  return config;
}
function validatePreset(preset) {
  if (isUrl(preset) || isPresetCode(preset)) {
    return;
  }
  const knownPresetNames = Object.keys(DEFAULT_PRESETS);
  if (!knownPresetNames.includes(preset)) {
    logger.error(
      `Invalid preset: ${highlighter.info(
        preset
      )}.
Use one of the available presets: ${knownPresetNames.join(", ")} 
or build your own at ${highlighter.info(`${SHADCN_URL}/create`)}`
    );
    logger.break();
    process.exit(1);
  }
}
async function resolveApplyTemplate(cwd) {
  const projectInfo = await getProjectInfo(cwd);
  return getTemplateForFramework(projectInfo?.framework.name);
}
function resolveApplyInitUrl(preset, currentBase, options = {}) {
  if (isUrl(preset)) {
    const url = new URL(preset);
    if (url.pathname === "/init" && preset.startsWith(SHADCN_URL)) {
      url.searchParams.set("track", "1");
    }
    url.searchParams.set("base", currentBase);
    url.searchParams.set("rtl", String(options.rtl ?? false));
    if (options.only) {
      url.searchParams.set("only", options.only);
    }
    return url.toString();
  }
  if (isPresetCode(preset)) {
    const decoded = decodePreset(preset);
    if (!decoded) {
      logger.error(`Invalid preset code: ${highlighter.info(preset)}`);
      logger.break();
      process.exit(1);
    }
    return resolveInitUrl(
      {
        ...decoded,
        base: currentBase,
        rtl: options.rtl ?? false
      },
      { preset, template: options.template, only: options.only }
    );
  }
  const resolvedPreset = DEFAULT_PRESETS[preset];
  return resolveInitUrl(
    {
      ...resolvedPreset,
      base: currentBase,
      rtl: options.rtl ?? resolvedPreset.rtl
    },
    { template: options.template, only: options.only }
  );
}
function quoteShellArg(value) {
  return /[^A-Za-z0-9_./:-]/.test(value) ? JSON.stringify(value) : value;
}
function getInitCommand(preset) {
  if (!preset) {
    return "shadcn init";
  }
  return `shadcn init --preset ${quoteShellArg(preset)}`;
}
async function preFlightBuild(options) {
  const errors = {};
  const resolvePaths = {
    cwd: options.cwd,
    registryFile: path4__default.resolve(options.cwd, options.registryFile),
    outputDir: path4__default.resolve(options.cwd, options.outputDir)
  };
  if (!fs11.existsSync(resolvePaths.registryFile)) {
    errors[BUILD_MISSING_REGISTRY_FILE] = true;
  }
  await fs11.mkdir(resolvePaths.outputDir, { recursive: true });
  if (Object.keys(errors).length > 0) {
    if (errors[BUILD_MISSING_REGISTRY_FILE]) {
      logger.break();
      logger.error(
        `The path ${highlighter.info(
          resolvePaths.registryFile
        )} does not exist.`
      );
    }
    logger.break();
    process.exit(1);
  }
  return {
    errors,
    resolvePaths
  };
}
var buildOptionsSchema = z.object({
  cwd: z.string(),
  registryFile: z.string(),
  outputDir: z.string()
});
var build = new Command().name("build").description("build components for a shadcn registry").argument("[registry]", "path to registry.json file", "./registry.json").option(
  "-o, --output <path>",
  "destination directory for json files",
  "./public/r"
).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).action(async (registry2, opts) => {
  try {
    const options = buildOptionsSchema.parse({
      cwd: path4.resolve(opts.cwd),
      registryFile: registry2,
      outputDir: opts.output
    });
    const { resolvePaths } = await preFlightBuild(options);
    const content = await fs25.readFile(resolvePaths.registryFile, "utf-8");
    const result = registrySchema.safeParse(JSON.parse(content));
    if (!result.success) {
      logger.error(
        `Invalid registry file found at ${highlighter.info(
          resolvePaths.registryFile
        )}.`
      );
      process.exit(1);
    }
    const buildSpinner = spinner("Building registry...");
    for (const registryItem of result.data.items) {
      buildSpinner.start(`Building ${registryItem.name}...`);
      registryItem["$schema"] = "https://ui.shadcn.com/schema/registry-item.json";
      for (const file of registryItem.files ?? []) {
        file["content"] = await fs25.readFile(
          path4.resolve(resolvePaths.cwd, file.path),
          "utf-8"
        );
      }
      const result2 = registryItemSchema.safeParse(registryItem);
      if (!result2.success) {
        logger.error(
          `Invalid registry item found for ${highlighter.info(
            registryItem.name
          )}.`
        );
        continue;
      }
      await fs25.writeFile(
        path4.resolve(resolvePaths.outputDir, `${result2.data.name}.json`),
        JSON.stringify(result2.data, null, 2)
      );
    }
    await fs25.copyFile(
      resolvePaths.registryFile,
      path4.resolve(resolvePaths.outputDir, "registry.json")
    );
    buildSpinner.succeed("Building registry.");
  } catch (error) {
    logger.break();
    handleError(error);
  }
});
var updateOptionsSchema = z.object({
  component: z.string().optional(),
  yes: z.boolean(),
  cwd: z.string(),
  path: z.string().optional()
});
var diff = new Command().name("diff").description("[DEPRECATED] Use `add [component] --diff` instead.").argument("[component]", "the component name").option("-y, --yes", "skip confirmation prompt.", false).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).action(async (name, opts) => {
  try {
    const options = updateOptionsSchema.parse({
      component: name,
      ...opts
    });
    const cwd = path4__default.resolve(options.cwd);
    if (!existsSync(cwd)) {
      logger.error(`The path ${cwd} does not exist. Please try again.`);
      process.exit(1);
    }
    const config = await getConfig(cwd);
    if (!config) {
      if (await isMonorepoRoot(cwd)) {
        const targets = await getMonorepoTargets(cwd);
        if (targets.length > 0) {
          formatMonorepoMessage("diff [component]", targets);
          process.exit(1);
        }
      }
      logger.warn(
        `Configuration is missing. Please run ${highlighter.success(
          `init`
        )} to create a components.json file.`
      );
      process.exit(1);
    }
    const registryIndex = await getShadcnRegistryIndex();
    if (!registryIndex) {
      handleError(new Error("Failed to fetch registry index."));
      process.exit(1);
    }
    if (!options.component) {
      const targetDir = config.resolvedPaths.components;
      const projectComponents = registryIndex.filter((item) => {
        for (const file of item.files ?? []) {
          const filePath = path4__default.resolve(
            targetDir,
            typeof file === "string" ? file : file.path
          );
          if (existsSync(filePath)) {
            return true;
          }
        }
        return false;
      });
      const componentsWithUpdates = [];
      for (const component2 of projectComponents) {
        const changes2 = await diffComponent(component2, config);
        if (changes2.length) {
          componentsWithUpdates.push({
            name: component2.name,
            changes: changes2
          });
        }
      }
      if (!componentsWithUpdates.length) {
        logger.info("No updates found.");
        process.exit(0);
      }
      logger.info("The following components have updates available:");
      for (const component2 of componentsWithUpdates) {
        logger.info(`- ${component2.name}`);
        for (const change of component2.changes) {
          logger.info(`  - ${change.filePath}`);
        }
      }
      logger.break();
      logger.info(
        `Run ${highlighter.success(`diff <component>`)} to see the changes.`
      );
      process.exit(0);
    }
    const component = registryIndex.find(
      (item) => item.name === options.component
    );
    if (!component) {
      logger.error(
        `The component ${highlighter.success(
          options.component
        )} does not exist.`
      );
      process.exit(1);
    }
    const changes = await diffComponent(component, config);
    if (!changes.length) {
      logger.info(`No updates found for ${options.component}.`);
      process.exit(0);
    }
    for (const change of changes) {
      logger.info(`- ${change.filePath}`);
      await printDiff(change.patch);
      logger.info("");
    }
  } catch (error) {
    handleError(error);
  }
});
async function diffComponent(component, config) {
  const payload = await fetchTree(config.style, [component]);
  const baseColor = await getRegistryBaseColor(config.tailwind.baseColor);
  const supportedFontMarkers = getSupportedFontMarkers2(payload);
  if (!payload) {
    return [];
  }
  const changes = [];
  for (const item of payload) {
    const targetDir = await getItemTargetPath(config, item);
    if (!targetDir) {
      continue;
    }
    for (const file of item.files ?? []) {
      const filePath = path4__default.resolve(
        targetDir,
        typeof file === "string" ? file : file.path
      );
      if (!existsSync(filePath)) {
        continue;
      }
      const fileContent = await promises.readFile(filePath, "utf8");
      if (typeof file === "string" || !file.content) {
        continue;
      }
      const registryContent = await transform(
        {
          filename: file.path,
          raw: file.content,
          config,
          baseColor,
          supportedFontMarkers
        },
        [
          transformImport,
          transformRsc,
          transformCssVars,
          transformTwPrefixes,
          transformIcons,
          transformMenu,
          transformRtl,
          transformFont,
          transformCleanup
        ]
      );
      const patch = diffLines(registryContent, fileContent);
      if (patch.length > 1) {
        changes.push({
          filePath,
          patch
        });
      }
    }
  }
  return changes;
}
async function printDiff(diff2) {
  diff2.forEach((part) => {
    if (part) {
      if (part.added) {
        return process.stdout.write(highlighter.success(part.value));
      }
      if (part.removed) {
        return process.stdout.write(highlighter.error(part.value));
      }
      return process.stdout.write(part.value);
    }
  });
}
var docs = new Command().name("docs").description("get docs, api references and usage examples for components").argument("<components...>", "component names").option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option(
  "-b, --base <base>",
  "the base to use either 'base' or 'radix'. defaults to project base."
).option("--json", "output as JSON.", false).action(async (components, opts) => {
  try {
    const cwd = path4__default.resolve(opts.cwd);
    const config = await getConfig(cwd);
    const base = opts.base ?? getBase(config?.style);
    const index = await getShadcnRegistryIndex();
    if (!index) {
      logger.error("Failed to fetch the registry index.");
      process.exit(1);
    }
    const results = [];
    for (const component of components) {
      const item = index.find((entry) => entry.name === component);
      if (!item) {
        logger.error(
          `Component ${highlighter.info(
            component
          )} not found in the shadcn registry.`
        );
        process.exit(1);
      }
      const links = item.meta?.links?.[base];
      if (!links || Object.keys(links).length === 0) {
        logger.warn(
          `No documentation links available for ${highlighter.info(
            component
          )}.`
        );
        continue;
      }
      results.push({ component, base, links });
    }
    if (opts.json) {
      console.log(JSON.stringify({ base, results }, null, 2));
      return;
    }
    const maxKeyLength = Math.max(
      ...results.flatMap((r) => Object.keys(r.links).map((k) => k.length))
    );
    for (const { component, links } of results) {
      logger.log(highlighter.info(component));
      for (const [key, value] of Object.entries(links)) {
        logger.log(`  - ${key.padEnd(maxKeyLength + 2)}${value}`);
      }
      logger.break();
    }
  } catch (error) {
    handleError(error);
  }
});
var GITHUB_RAW_BASE = "https://raw.githubusercontent.com/shadcn-ui/ui/refs/heads/main/apps/v4/registry/bases";
var info = new Command().name("info").description("get information about your project").option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("--json", "output as JSON.", false).action(async (opts) => {
  try {
    const cwd = path4__default.resolve(opts.cwd);
    if (!existsSync(path4__default.resolve(cwd, "components.json")) && await isMonorepoRoot(cwd)) {
      const targets = await getMonorepoTargets(cwd);
      if (targets.length > 0) {
        if (opts.json) {
          console.log(
            JSON.stringify(
              {
                error: "monorepo_root",
                message: "You are running info from a monorepo root. Use the -c flag to specify a workspace.",
                targets: targets.map((t) => t.name)
              },
              null,
              2
            )
          );
        } else {
          formatMonorepoMessage("info", targets);
        }
        process.exit(1);
      }
    }
    const projectInfo = await getProjectInfo(cwd);
    const config = await getConfig(cwd);
    const components = await getProjectComponents(cwd);
    const base = getBase(config?.style);
    const data = collectInfo(projectInfo, config, components, base);
    if (opts.json) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }
    printInfo(data);
  } catch (error) {
    handleError(error);
  }
});
function getRegistries2(registries) {
  if (!registries) {
    return {};
  }
  const result = {};
  for (const [name, value] of Object.entries(registries)) {
    result[name] = typeof value === "string" ? value : value.url;
  }
  return result;
}
function collectInfo(projectInfo, config, components, base) {
  return {
    project: projectInfo ? {
      framework: projectInfo.framework.label,
      frameworkName: projectInfo.framework.name,
      frameworkVersion: projectInfo.frameworkVersion ?? null,
      srcDirectory: projectInfo.isSrcDir,
      rsc: projectInfo.isRSC,
      typescript: projectInfo.isTsx,
      tailwindVersion: projectInfo.tailwindVersion ?? null,
      tailwindConfig: projectInfo.tailwindConfigFile ?? null,
      tailwindCss: projectInfo.tailwindCssFile ?? null,
      importAlias: projectInfo.aliasPrefix ?? null
    } : null,
    config: config ? {
      style: config.style,
      base,
      rsc: config.rsc,
      typescript: config.tsx,
      iconLibrary: config.iconLibrary ?? null,
      rtl: config.rtl ?? false,
      menuColor: config.menuColor ?? null,
      menuAccent: config.menuAccent ?? null,
      aliases: {
        components: config.aliases.components,
        utils: config.aliases.utils,
        ui: config.aliases.ui ?? null,
        lib: config.aliases.lib ?? null,
        hooks: config.aliases.hooks ?? null
      },
      resolvedPaths: {
        cwd: config.resolvedPaths.cwd,
        tailwindConfig: config.resolvedPaths.tailwindConfig || null,
        tailwindCss: config.resolvedPaths.tailwindCss || null,
        utils: config.resolvedPaths.utils,
        components: config.resolvedPaths.components,
        lib: config.resolvedPaths.lib,
        hooks: config.resolvedPaths.hooks,
        ui: config.resolvedPaths.ui
      },
      registries: getRegistries2(config.registries)
    } : null,
    components,
    links: {
      docs: `${SHADCN_URL}/docs`,
      components: `${SHADCN_URL}/docs/components/${base}/[component].md`,
      ui: `${GITHUB_RAW_BASE}/${base}/ui/[component].tsx`,
      examples: `${GITHUB_RAW_BASE}/${base}/examples/[component]-example.tsx`,
      schema: "https://ui.shadcn.com/schema.json"
    }
  };
}
function printInfo(data) {
  logger.log(highlighter.info("Project"));
  if (data.project) {
    printEntries({
      framework: `${data.project.framework} (${data.project.frameworkName})`,
      frameworkVersion: data.project.frameworkVersion ?? "-",
      srcDirectory: data.project.srcDirectory ? "Yes" : "No",
      rsc: data.project.rsc ? "Yes" : "No",
      typescript: data.project.typescript ? "Yes" : "No",
      tailwindVersion: data.project.tailwindVersion ?? "-",
      tailwindConfig: data.project.tailwindConfig ?? "-",
      tailwindCss: data.project.tailwindCss ?? "-",
      importAlias: data.project.importAlias ?? "-"
    });
  } else {
    logger.log("  No project info detected.");
  }
  logger.break();
  logger.log(highlighter.info("Configuration"));
  if (data.config) {
    printEntries({
      style: data.config.style,
      base: data.config.base,
      rsc: data.config.rsc ? "Yes" : "No",
      typescript: data.config.typescript ? "Yes" : "No",
      iconLibrary: data.config.iconLibrary ?? "-",
      rtl: data.config.rtl ? "Yes" : "No",
      menuColor: data.config.menuColor ?? "-",
      menuAccent: data.config.menuAccent ?? "-"
    });
    logger.break();
    logger.log(highlighter.info("Aliases"));
    printEntries({
      components: data.config.aliases.components,
      utils: data.config.aliases.utils,
      ui: data.config.aliases.ui ?? "-",
      lib: data.config.aliases.lib ?? "-",
      hooks: data.config.aliases.hooks ?? "-"
    });
    logger.break();
    logger.log(highlighter.info("Resolved Paths"));
    printEntries({
      cwd: data.config.resolvedPaths.cwd,
      tailwindConfig: data.config.resolvedPaths.tailwindConfig ?? "-",
      tailwindCss: data.config.resolvedPaths.tailwindCss ?? "-",
      utils: data.config.resolvedPaths.utils,
      components: data.config.resolvedPaths.components,
      lib: data.config.resolvedPaths.lib,
      hooks: data.config.resolvedPaths.hooks,
      ui: data.config.resolvedPaths.ui
    });
    if (Object.keys(data.config.registries).length > 0) {
      logger.break();
      logger.log("registries:");
      printEntries(data.config.registries);
    }
  } else {
    logger.log("  No components.json found.");
  }
  logger.break();
  logger.log(highlighter.info("Installed Components"));
  if (data.components.length > 0) {
    logger.log(`  ${data.components.join(", ")}`);
  } else {
    logger.log("  No components installed.");
  }
  logger.break();
  logger.log(highlighter.info("Links"));
  printEntries(data.links);
  logger.break();
}
function printEntries(entries) {
  const maxKeyLength = Math.max(...Object.keys(entries).map((k) => k.length));
  for (const [key, value] of Object.entries(entries)) {
    logger.log(`  ${key.padEnd(maxKeyLength + 2)}${value}`);
  }
}
async function searchRegistries(registries, options) {
  const { query, limit, offset, config, useCache } = options || {};
  let allItems = [];
  for (const registry2 of registries) {
    const registryData = await getRegistry(registry2, { config, useCache });
    const itemsWithRegistry = (registryData.items || []).map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description,
      registry: registry2,
      addCommandArgument: buildRegistryItemNameFromRegistry(
        item.name,
        registry2
      )
    }));
    allItems = allItems.concat(itemsWithRegistry);
  }
  if (query) {
    allItems = searchItems(allItems, {
      query,
      limit: allItems.length,
      keys: ["name", "description"]
    });
  }
  const paginationOffset = offset || 0;
  const paginationLimit = limit || allItems.length;
  const totalItems = allItems.length;
  const result = {
    pagination: {
      total: totalItems,
      offset: paginationOffset,
      limit: paginationLimit,
      hasMore: paginationOffset + paginationLimit < totalItems
    },
    items: allItems.slice(paginationOffset, paginationOffset + paginationLimit)
  };
  return searchResultsSchema.parse(result);
}
var searchableItemSchema = z.object({
  name: z.string(),
  type: z.string().optional(),
  description: z.string().optional(),
  registry: z.string().optional(),
  addCommandArgument: z.string().optional()
}).passthrough();
function searchItems(items, options) {
  options = {
    limit: 100,
    threshold: -1e4,
    ...options
  };
  const searchResults = fuzzysort.go(options.query, items, {
    keys: options.keys,
    threshold: options.threshold,
    limit: options.limit
  });
  const results = searchResults.map((result) => result.obj);
  return z.array(searchableItemSchema).parse(results);
}
function isUrl2(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
function buildRegistryItemNameFromRegistry(name, registry2) {
  if (!isUrl2(registry2)) {
    return `${registry2}/${name}`;
  }
  const protocolEnd = registry2.indexOf("://") + 3;
  const hostEnd = registry2.indexOf("/", protocolEnd);
  if (hostEnd === -1) {
    const queryStart = registry2.indexOf("?", protocolEnd);
    if (queryStart !== -1) {
      const beforeQuery = registry2.substring(0, queryStart);
      const queryAndAfter2 = registry2.substring(queryStart);
      const updatedQuery2 = queryAndAfter2.replace(/\bregistry\b/g, name);
      return beforeQuery + updatedQuery2;
    }
    return registry2;
  }
  const hostPart = registry2.substring(0, hostEnd);
  const pathAndQuery = registry2.substring(hostEnd);
  const pathEnd = pathAndQuery.indexOf("?") !== -1 ? pathAndQuery.indexOf("?") : pathAndQuery.length;
  const pathOnly = pathAndQuery.substring(0, pathEnd);
  const queryAndAfter = pathAndQuery.substring(pathEnd);
  const lastIndex = pathOnly.lastIndexOf("registry");
  let updatedPath = pathOnly;
  if (lastIndex !== -1) {
    updatedPath = pathOnly.substring(0, lastIndex) + name + pathOnly.substring(lastIndex + "registry".length);
  }
  const updatedQuery = queryAndAfter.replace(/\bregistry\b/g, name);
  return hostPart + updatedPath + updatedQuery;
}

// src/mcp/utils.ts
var SHADCN_CLI_COMMAND = "@yyc3/cli";
async function npxShadcn(command) {
  const packageRunner = await getPackageRunner(process.cwd());
  return `${packageRunner} ${SHADCN_CLI_COMMAND} ${command}`;
}
async function getMcpConfig(cwd = process.cwd()) {
  const config = await getRegistriesConfig(cwd, {
    useCache: false
  });
  return {
    registries: config.registries
  };
}
function formatSearchResultsWithPagination(results, options) {
  const { query, registries } = options || {};
  const formattedItems = results.items.map((item) => {
    const parts = [`- ${item.name}`];
    if (item.type) {
      parts.push(`(${item.type})`);
    }
    if (item.description) {
      parts.push(`- ${item.description}`);
    }
    if (item.registry) {
      parts.push(`[${item.registry}]`);
    }
    parts.push(
      `
  Add command: \`${npxShadcn(`add ${item.addCommandArgument}`)}\``
    );
    return parts.join(" ");
  });
  let header = `Found ${results.pagination.total} items`;
  if (query) {
    header += ` matching "${query}"`;
  }
  if (registries && registries.length > 0) {
    header += ` in registries ${registries.join(", ")}`;
  }
  header += ":";
  const showingRange = `Showing items ${results.pagination.offset + 1}-${Math.min(
    results.pagination.offset + results.pagination.limit,
    results.pagination.total
  )} of ${results.pagination.total}:`;
  let output = `${header}

${showingRange}

${formattedItems.join("\n\n")}`;
  if (results.pagination.hasMore) {
    output += `

More items available. Use offset: ${results.pagination.offset + results.pagination.limit} to see the next page.`;
  }
  return output;
}
function formatRegistryItems(items) {
  return items.map((item) => {
    const parts = [
      `## ${item.name}`,
      item.description ? `
${item.description}
` : "",
      item.type ? `**Type:** ${item.type}` : "",
      item.files && item.files.length > 0 ? `**Files:** ${item.files.length} file(s)` : "",
      item.dependencies && item.dependencies.length > 0 ? `**Dependencies:** ${item.dependencies.join(", ")}` : "",
      item.devDependencies && item.devDependencies.length > 0 ? `**Dev Dependencies:** ${item.devDependencies.join(", ")}` : ""
    ];
    return parts.filter(Boolean).join("\n");
  });
}
function formatItemExamples(items, query) {
  const sections = items.map((item) => {
    const parts = [
      `## Example: ${item.name}`,
      item.description ? `
${item.description}
` : ""
    ];
    if (item.files?.length) {
      item.files.forEach((file) => {
        if (file.content) {
          parts.push(`### Code (${file.path}):
`);
          parts.push("```tsx");
          parts.push(file.content);
          parts.push("```");
        }
      });
    }
    return parts.filter(Boolean).join("\n");
  });
  const header = `# Usage Examples

Found ${items.length} example${items.length > 1 ? "s" : ""} matching "${query}":
`;
  return header + sections.join("\n\n---\n\n");
}

// src/mcp/index.ts
var server = new Server(
  {
    name: "yyc3",
    version: "1.0.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_project_registries",
        description: "Get configured registry names from components.json - Returns error if no components.json exists (use init_project to create one)",
        inputSchema: zodToJsonSchema(z.object({}))
      },
      {
        name: "list_items_in_registries",
        description: "List items from registries (requires components.json - use init_project if missing)",
        inputSchema: zodToJsonSchema(
          z.object({
            registries: z.array(z.string()).describe(
              "Array of registry names to search (e.g., ['@shadcn', '@acme'])"
            ),
            limit: z.number().optional().describe("Maximum number of items to return"),
            offset: z.number().optional().describe("Number of items to skip for pagination")
          })
        )
      },
      {
        name: "search_items_in_registries",
        description: "Search for components in registries using fuzzy matching (requires components.json). After finding an item, use get_item_examples_from_registries to see usage examples.",
        inputSchema: zodToJsonSchema(
          z.object({
            registries: z.array(z.string()).describe(
              "Array of registry names to search (e.g., ['@shadcn', '@acme'])"
            ),
            query: z.string().describe(
              "Search query string for fuzzy matching against item names and descriptions"
            ),
            limit: z.number().optional().describe("Maximum number of items to return"),
            offset: z.number().optional().describe("Number of items to skip for pagination")
          })
        )
      },
      {
        name: "view_items_in_registries",
        description: "View detailed information about specific registry items including the name, description, type and files content. For usage examples, use get_item_examples_from_registries instead.",
        inputSchema: zodToJsonSchema(
          z.object({
            items: z.array(z.string()).describe(
              "Array of item names with registry prefix (e.g., ['@shadcn/button', '@shadcn/card'])"
            )
          })
        )
      },
      {
        name: "get_item_examples_from_registries",
        description: "Find usage examples and demos with their complete code. Search for patterns like 'accordion-demo', 'button example', 'card-demo', etc. Returns full implementation code with dependencies.",
        inputSchema: zodToJsonSchema(
          z.object({
            registries: z.array(z.string()).describe(
              "Array of registry names to search (e.g., ['@shadcn', '@acme'])"
            ),
            query: z.string().describe(
              "Search query for examples (e.g., 'accordion-demo', 'button demo', 'card example', 'tooltip-demo', 'example-booking-form', 'example-hero'). Common patterns: '{item-name}-demo', '{item-name} example', 'example {item-name}'"
            )
          })
        )
      },
      {
        name: "get_add_command_for_items",
        description: "Get the shadcn CLI add command for specific items in a registry. This is useful for adding one or more components to your project.",
        inputSchema: zodToJsonSchema(
          z.object({
            items: z.array(z.string()).describe(
              "Array of items to get the add command for prefixed with the registry name (e.g., ['@shadcn/button', '@shadcn/card'])"
            )
          })
        )
      },
      {
        name: "get_audit_checklist",
        description: "After creating new components or generating new code files, use this tool for a quick checklist to verify that everything is working as expected. Make sure to run the tool after all required steps have been completed.",
        inputSchema: zodToJsonSchema(z.object({}))
      }
    ]
  };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("No tool arguments provided.");
    }
    switch (request.params.name) {
      case "get_project_registries": {
        const config = await getMcpConfig(process.cwd());
        if (!config?.registries) {
          return {
            content: [
              {
                type: "text",
                text: dedent6`No components.json found or no registries configured.

                To fix this:
                1. Use the \`init\` command to create a components.json file
                2. Or manually create components.json with a registries section`
              }
            ]
          };
        }
        return {
          content: [
            {
              type: "text",
              text: dedent6`The following registries are configured in the current project:

                ${Object.keys(config.registries).map((registry2) => `- ${registry2}`).join("\n")}

                You can view the items in a registry by running:
                \`${await npxShadcn("view @name-of-registry")}\`

                For example: \`${await npxShadcn(
                "view @shadcn"
              )}\` or \`${await npxShadcn(
                "view @shadcn @acme"
              )}\` to view multiple registries.
                `
            }
          ]
        };
      }
      case "search_items_in_registries": {
        const inputSchema = z.object({
          registries: z.array(z.string()),
          query: z.string(),
          limit: z.number().optional(),
          offset: z.number().optional()
        });
        const args = inputSchema.parse(request.params.arguments);
        const results = await searchRegistries(args.registries, {
          query: args.query,
          limit: args.limit,
          offset: args.offset,
          config: await getMcpConfig(process.cwd()),
          useCache: false
        });
        if (results.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: dedent6`No items found matching "${args.query}" in registries ${args.registries.join(
                  ", "
                )}, Try searching with a different query or registry.`
              }
            ]
          };
        }
        return {
          content: [
            {
              type: "text",
              text: formatSearchResultsWithPagination(results, {
                query: args.query,
                registries: args.registries
              })
            }
          ]
        };
      }
      case "list_items_in_registries": {
        const inputSchema = z.object({
          registries: z.array(z.string()),
          limit: z.number().optional(),
          offset: z.number().optional(),
          cwd: z.string().optional()
        });
        const args = inputSchema.parse(request.params.arguments);
        const results = await searchRegistries(args.registries, {
          limit: args.limit,
          offset: args.offset,
          config: await getMcpConfig(process.cwd()),
          useCache: false
        });
        if (results.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: dedent6`No items found in registries ${args.registries.join(
                  ", "
                )}.`
              }
            ]
          };
        }
        return {
          content: [
            {
              type: "text",
              text: formatSearchResultsWithPagination(results, {
                registries: args.registries
              })
            }
          ]
        };
      }
      case "view_items_in_registries": {
        const inputSchema = z.object({
          items: z.array(z.string())
        });
        const args = inputSchema.parse(request.params.arguments);
        const registryItems = await getRegistryItems(args.items, {
          config: await getMcpConfig(process.cwd()),
          useCache: false
        });
        if (registryItems?.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: dedent6`No items found for: ${args.items.join(", ")}

                Make sure the item names are correct and include the registry prefix (e.g., @shadcn/button).`
              }
            ]
          };
        }
        const formattedItems = formatRegistryItems(registryItems);
        return {
          content: [
            {
              type: "text",
              text: dedent6`Item Details:

              ${formattedItems.join("\n\n---\n\n")}`
            }
          ]
        };
      }
      case "get_item_examples_from_registries": {
        const inputSchema = z.object({
          query: z.string(),
          registries: z.array(z.string())
        });
        const args = inputSchema.parse(request.params.arguments);
        const config = await getMcpConfig();
        const results = await searchRegistries(args.registries, {
          query: args.query,
          config,
          useCache: false
        });
        if (results.items.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: dedent6`No examples found for query "${args.query}".

                Try searching with patterns like:
                - "accordion-demo" for accordion examples
                - "button demo" or "button example"
                - Component name followed by "-demo" or "example"

                You can also:
                1. Use search_items_in_registries to find all items matching your query
                2. View the main component with view_items_in_registries for inline usage documentation`
              }
            ]
          };
        }
        const itemNames = results.items.map((item) => item.addCommandArgument);
        const fullItems = await getRegistryItems(itemNames, {
          config,
          useCache: false
        });
        return {
          content: [
            {
              type: "text",
              text: formatItemExamples(fullItems, args.query)
            }
          ]
        };
      }
      case "get_add_command_for_items": {
        const args = z.object({
          items: z.array(z.string())
        }).parse(request.params.arguments);
        return {
          content: [
            {
              type: "text",
              text: await npxShadcn(`add ${args.items.join(" ")}`)
            }
          ]
        };
      }
      case "get_audit_checklist": {
        return {
          content: [
            {
              type: "text",
              text: dedent6`## Component Audit Checklist

              After adding or generating components, check the following common issues:

              - [ ] Ensure imports are correct i.e named vs default imports
              - [ ] If using next/image, ensure images.remotePatterns next.config.js is configured correctly.
              - [ ] Ensure all dependencies are installed.
              - [ ] Check for linting errors or warnings
              - [ ] Check for TypeScript errors
              - [ ] Use the Playwright MCP if available.
              `
            }
          ]
        };
      }
      default:
        throw new Error(`Tool ${request.params.name} not found`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: "text",
            text: dedent6`Invalid input parameters:
              ${error.errors.map((e) => `- ${e.path.join(".")}: ${e.message}`).join("\n")}
              `
          }
        ],
        isError: true
      };
    }
    if (error instanceof RegistryError) {
      let errorMessage2 = error.message;
      if (error.suggestion) {
        errorMessage2 += `

\u{1F4A1} ${error.suggestion}`;
      }
      if (error.context) {
        errorMessage2 += `

Context: ${JSON.stringify(error.context, null, 2)}`;
      }
      return {
        content: [
          {
            type: "text",
            text: dedent6`Error (${error.code}): ${errorMessage2}`
          }
        ],
        isError: true
      };
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: dedent6`Error: ${errorMessage}`
        }
      ],
      isError: true
    };
  }
});

// src/commands/mcp.ts
var YYC3_CLI_PACKAGE = "@yyc3/cli";
var CLIENTS = [
  {
    name: "claude",
    label: "Claude Code",
    configPath: ".mcp.json",
    config: {
      mcpServers: {
        yyc3: {
          command: "npx",
          args: [YYC3_CLI_PACKAGE, "mcp"]
        }
      }
    }
  },
  {
    name: "cursor",
    label: "Cursor",
    configPath: ".cursor/mcp.json",
    config: {
      mcpServers: {
        yyc3: {
          command: "npx",
          args: [YYC3_CLI_PACKAGE, "mcp"]
        }
      }
    }
  },
  {
    name: "vscode",
    label: "VS Code",
    configPath: ".vscode/mcp.json",
    config: {
      servers: {
        yyc3: {
          command: "npx",
          args: [YYC3_CLI_PACKAGE, "mcp"]
        }
      }
    }
  },
  {
    name: "codex",
    label: "Codex",
    configPath: ".codex/config.toml",
    config: `[mcp_servers.yyc3]
command = "npx"
args = ["${YYC3_CLI_PACKAGE}", "mcp"]
`
  },
  {
    name: "opencode",
    label: "OpenCode",
    configPath: "opencode.json",
    config: {
      $schema: "https://opencode.ai/config.json",
      mcp: {
        yyc3: {
          type: "local",
          command: ["npx", YYC3_CLI_PACKAGE, "mcp"],
          enabled: true
        }
      }
    }
  }
];
var DEPENDENCIES = [YYC3_CLI_PACKAGE];
var mcp = new Command().name("mcp").description("MCP server and configuration commands").option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).action(async (options) => {
  try {
    await loadEnvFiles(options.cwd);
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    logger.break();
    handleError(error);
  }
});
var mcpInitOptionsSchema = z18.object({
  client: z18.enum(["claude", "cursor", "vscode", "codex", "opencode"]),
  cwd: z18.string()
});
mcp.command("init").description("Initialize MCP configuration for your client").option(
  "--client <client>",
  `MCP client (${CLIENTS.map((c) => c.name).join(", ")})`
).action(async (opts, command) => {
  try {
    const parentOpts = command.parent?.opts() || {};
    const cwd = parentOpts.cwd || process.cwd();
    let client = opts.client;
    if (!client) {
      const response = await prompts5({
        type: "select",
        name: "client",
        message: "Which MCP client are you using?",
        choices: CLIENTS.map((c) => ({
          title: c.label,
          value: c.name
        }))
      });
      if (!response.client) {
        logger.break();
        process.exit(1);
      }
      client = response.client;
    }
    const options = mcpInitOptionsSchema.parse({
      client,
      cwd
    });
    const config = await getConfig(options.cwd);
    if (options.client === "codex") {
      if (config) {
        await updateDependencies([], DEPENDENCIES, config, {
          silent: false
        });
      } else {
        const packageManager = await getPackageManager(options.cwd);
        const installCommand = packageManager === "npm" ? "install" : "add";
        const devFlag = packageManager === "npm" ? "--save-dev" : "-D";
        const installSpinner = spinner("Installing dependencies...").start();
        await execa(
          packageManager,
          [installCommand, devFlag, ...DEPENDENCIES],
          {
            cwd: options.cwd
          }
        );
        installSpinner.succeed("Installing dependencies.");
      }
      logger.break();
      logger.log("To configure the YYC\xB3 MCP server in Codex:");
      logger.break();
      logger.log(
        `1. Open or create the file ${highlighter.info(
          "~/.codex/config.toml"
        )}`
      );
      logger.log("2. Add the following configuration:");
      logger.log();
      logger.info(`[mcp_servers.yyc3]
command = "npx"
args = ["${YYC3_CLI_PACKAGE}", "mcp"]`);
      logger.break();
      logger.info("3. Restart Codex to load the MCP server");
      logger.break();
      process.exit(0);
    }
    const configSpinner = spinner("Configuring MCP server...").start();
    const configPath = await runMcpInit(options);
    configSpinner.succeed("Configuring MCP server.");
    if (config) {
      await updateDependencies([], DEPENDENCIES, config, {
        silent: false
      });
    } else {
      const packageManager = await getPackageManager(options.cwd);
      const installCommand = packageManager === "npm" ? "install" : "add";
      const devFlag = packageManager === "npm" ? "--save-dev" : "-D";
      const installSpinner = spinner("Installing dependencies...").start();
      await execa(
        packageManager,
        [installCommand, devFlag, ...DEPENDENCIES],
        {
          cwd: options.cwd
        }
      );
      installSpinner.succeed("Installing dependencies.");
    }
    logger.break();
    logger.success(`Configuration saved to ${configPath}.`);
    logger.break();
  } catch (error) {
    handleError(error);
  }
});
var overwriteMerge = (_, sourceArray) => sourceArray;
async function runMcpInit(options) {
  const { client, cwd } = options;
  const clientInfo = CLIENTS.find((c) => c.name === client);
  if (!clientInfo) {
    throw new Error(
      `Unknown client: ${client}. Available clients: ${CLIENTS.map(
        (c) => c.name
      ).join(", ")}`
    );
  }
  const configPath = path4__default.join(cwd, clientInfo.configPath);
  const dir = path4__default.dirname(configPath);
  await fs11.ensureDir(dir);
  let existingConfig = {};
  try {
    const content = await promises.readFile(configPath, "utf-8");
    existingConfig = JSON.parse(content);
  } catch {
  }
  const mergedConfig = deepmerge3(
    existingConfig,
    clientInfo.config,
    { arrayMerge: overwriteMerge }
  );
  await promises.writeFile(
    configPath,
    JSON.stringify(mergedConfig, null, 2) + "\n",
    "utf-8"
  );
  return clientInfo.configPath;
}

// src/utils/legacy-icon-libraries.ts
var LEGACY_ICON_LIBRARIES = {
  lucide: {
    name: "lucide-react",
    package: "lucide-react",
    import: "lucide-react"
  },
  radix: {
    name: "@radix-ui/react-icons",
    package: "@radix-ui/react-icons",
    import: "@radix-ui/react-icons"
  }
};
async function migrateIcons(config) {
  if (!config.resolvedPaths.ui) {
    throw new Error(
      "We could not find a valid `ui` path in your `components.json` file. Please ensure you have a valid `ui` path in your `components.json` file."
    );
  }
  const uiPath = config.resolvedPaths.ui;
  const [files, registryIcons] = await Promise.all([
    fg3("**/*.{js,ts,jsx,tsx}", {
      cwd: uiPath
    }),
    getRegistryIcons()
  ]);
  if (Object.keys(registryIcons).length === 0) {
    throw new Error("Something went wrong fetching the registry icons.");
  }
  const libraryChoices = Object.entries(LEGACY_ICON_LIBRARIES).map(
    ([name, iconLibrary]) => ({
      title: iconLibrary.name,
      value: name
    })
  );
  const migrateOptions = await prompts5([
    {
      type: "select",
      name: "sourceLibrary",
      message: `Which icon library would you like to ${highlighter.info(
        "migrate from"
      )}?`,
      choices: libraryChoices
    },
    {
      type: "select",
      name: "targetLibrary",
      message: `Which icon library would you like to ${highlighter.info(
        "migrate to"
      )}?`,
      choices: libraryChoices
    }
  ]);
  if (migrateOptions.sourceLibrary === migrateOptions.targetLibrary) {
    throw new Error(
      "You cannot migrate to the same icon library. Please choose a different icon library."
    );
  }
  if (!(migrateOptions.sourceLibrary in LEGACY_ICON_LIBRARIES && migrateOptions.targetLibrary in LEGACY_ICON_LIBRARIES)) {
    throw new Error("Invalid icon library. Please choose a valid icon library.");
  }
  const sourceLibrary = LEGACY_ICON_LIBRARIES[migrateOptions.sourceLibrary];
  const targetLibrary = LEGACY_ICON_LIBRARIES[migrateOptions.targetLibrary];
  const { confirm } = await prompts5({
    type: "confirm",
    name: "confirm",
    initial: true,
    message: `We will migrate ${highlighter.info(
      files.length
    )} files in ${highlighter.info(
      `./${path4__default.relative(config.resolvedPaths.cwd, uiPath)}`
    )} from ${highlighter.info(sourceLibrary.name)} to ${highlighter.info(
      targetLibrary.name
    )}. Continue?`
  });
  if (!confirm) {
    logger.info("Migration cancelled.");
    process.exit(0);
  }
  if (targetLibrary.package) {
    await updateDependencies([targetLibrary.package], [], config, {
      silent: false
    });
  }
  const migrationSpinner = spinner(`Migrating icons...`)?.start();
  await Promise.all(
    files.map(async (file) => {
      migrationSpinner.text = `Migrating ${file}...`;
      const filePath = path4__default.join(uiPath, file);
      const fileContent = await promises.readFile(filePath, "utf-8");
      const content = await migrateIconsFile(
        fileContent,
        migrateOptions.sourceLibrary,
        migrateOptions.targetLibrary,
        registryIcons
      );
      await promises.writeFile(filePath, content);
    })
  );
  migrationSpinner.succeed("Migration complete.");
}
async function migrateIconsFile(content, sourceLibrary, targetLibrary, iconsMapping) {
  const sourceLibraryImport = LEGACY_ICON_LIBRARIES[sourceLibrary]?.import;
  const targetLibraryImport = LEGACY_ICON_LIBRARIES[targetLibrary]?.import;
  const dir = await promises.mkdtemp(path4__default.join(tmpdir(), "shadcn-"));
  const project3 = new Project({
    compilerOptions: {}
  });
  const tempFile = path4__default.join(
    dir,
    `shadcn-icons-${randomBytes(4).toString("hex")}.tsx`
  );
  const sourceFile = project3.createSourceFile(tempFile, content, {
    scriptKind: ScriptKind.TSX
  });
  let targetedIcons = [];
  for (const importDeclaration of sourceFile.getImportDeclarations() ?? []) {
    if (importDeclaration.getModuleSpecifier()?.getText() !== `"${sourceLibraryImport}"`) {
      continue;
    }
    for (const specifier of importDeclaration.getNamedImports() ?? []) {
      const iconName = specifier.getName();
      const targetedIcon = Object.values(iconsMapping).find(
        (icon) => icon[sourceLibrary] === iconName
      )?.[targetLibrary];
      if (!targetedIcon || targetedIcons.includes(targetedIcon)) {
        continue;
      }
      targetedIcons.push(targetedIcon);
      specifier.remove();
      sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).filter((node) => node.getTagNameNode()?.getText() === iconName).forEach((node) => node.getTagNameNode()?.replaceWithText(targetedIcon));
    }
    if (importDeclaration.getNamedImports()?.length === 0) {
      importDeclaration.remove();
    }
  }
  if (targetedIcons.length > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: targetLibraryImport,
      namedImports: targetedIcons.map((icon) => ({
        name: icon
      }))
    });
  }
  return await sourceFile.getText();
}
function toPascalCase2(str) {
  return str.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
function processNamedImports(namedImports, isTypeOnly, imports, packageName) {
  const cleanedImports = namedImports.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
  const namedImportList = cleanedImports.split(",").map((importItem) => importItem.trim()).filter(Boolean);
  for (const importItem of namedImportList) {
    const inlineTypeMatch = importItem.match(/^type\s+(\w+)(?:\s+as\s+(\w+))?$/);
    const aliasMatch = importItem.match(/^(\w+)\s+as\s+(\w+)$/);
    if (inlineTypeMatch) {
      const importName = inlineTypeMatch[1];
      const importAlias = inlineTypeMatch[2];
      if (packageName === "slot" && importName === "Slot" && !importAlias) {
        imports.push({
          name: "Slot",
          alias: "SlotPrimitive",
          isType: true
        });
      } else {
        imports.push({
          name: importName,
          alias: importAlias,
          isType: true
        });
      }
    } else if (aliasMatch) {
      const importName = aliasMatch[1];
      const importAlias = aliasMatch[2];
      if (packageName === "slot" && importName === "Slot" && importAlias === "Slot") {
        imports.push({
          name: "Slot",
          alias: "SlotPrimitive",
          isType: isTypeOnly
        });
      } else {
        imports.push({
          name: importName,
          alias: importAlias,
          isType: isTypeOnly
        });
      }
    } else {
      if (packageName === "slot" && importItem === "Slot") {
        imports.push({
          name: "Slot",
          alias: "SlotPrimitive",
          isType: isTypeOnly
        });
      } else {
        imports.push({
          name: importItem,
          isType: isTypeOnly
        });
      }
    }
  }
}
async function migrateRadix(config, options = {}) {
  let files;
  let basePath;
  if (options.path) {
    basePath = config.resolvedPaths.cwd;
    const isGlob = options.path.includes("*");
    if (isGlob) {
      files = await fg3(options.path, {
        cwd: basePath,
        onlyFiles: true,
        ignore: ["**/node_modules/**"]
      });
    } else {
      const fullPath = path4__default.resolve(basePath, options.path);
      const stat = await promises.stat(fullPath).catch(() => null);
      if (!stat) {
        throw new Error(`File not found: ${options.path}`);
      }
      if (stat.isDirectory()) {
        basePath = fullPath;
        files = await fg3("**/*.{js,ts,jsx,tsx}", {
          cwd: basePath,
          onlyFiles: true,
          ignore: ["**/node_modules/**"]
        });
      } else if (stat.isFile()) {
        files = [options.path];
      } else {
        throw new Error(`Unsupported path type: ${options.path}`);
      }
    }
    if (files.length === 0) {
      throw new Error(`No files found matching: ${options.path}`);
    }
  } else {
    if (!config.resolvedPaths.ui) {
      throw new Error(
        "We could not find a valid `ui` path in your `components.json` file. Please ensure you have a valid `ui` path in your `components.json` file."
      );
    }
    basePath = config.resolvedPaths.ui;
    files = await fg3("**/*.{js,ts,jsx,tsx}", {
      cwd: basePath,
      onlyFiles: true
    });
  }
  if (!options.yes) {
    const relativePath = options.path ? options.path : `./${path4__default.relative(config.resolvedPaths.cwd, basePath)}`;
    const { confirm } = await prompts5({
      type: "confirm",
      name: "confirm",
      initial: true,
      message: `We will migrate ${highlighter.info(
        files.length
      )} file(s) in ${highlighter.info(relativePath)} to ${highlighter.info(
        "radix-ui"
      )}. Continue?`
    });
    if (!confirm) {
      logger.info("Migration cancelled.");
      process.exit(0);
    }
  }
  const migrationSpinner = spinner(`Migrating imports...`)?.start();
  const foundPackages = /* @__PURE__ */ new Set();
  await Promise.all(
    files.map(async (file) => {
      migrationSpinner.text = `Migrating ${file}...`;
      const filePath = path4__default.join(basePath, file);
      const fileContent = await promises.readFile(filePath, "utf-8");
      const { content, replacedPackages } = await migrateRadixFile(fileContent);
      replacedPackages.forEach((pkg) => foundPackages.add(pkg));
      await promises.writeFile(filePath, content);
    })
  );
  migrationSpinner.succeed("Migrating imports.");
  const packageSpinner = spinner(`Updating package.json...`)?.start();
  try {
    const packageJson = getPackageInfo(config.resolvedPaths.cwd, false);
    if (!packageJson) {
      packageSpinner.fail("Could not read package.json");
      logger.warn(
        "Could not update package.json. You may need to manually replace @radix-ui/react-* packages with radix-ui"
      );
      return;
    }
    const foundPackagesArray = Array.from(foundPackages);
    if (foundPackagesArray.length > 0) {
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      const hasRadixUi = packageJson.dependencies?.["radix-ui"] || packageJson.devDependencies?.["radix-ui"];
      if (!hasRadixUi) {
        packageJson.dependencies["radix-ui"] = "latest";
        const packageJsonPath = path4__default.join(
          config.resolvedPaths.cwd,
          "package.json"
        );
        await promises.writeFile(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + "\n"
        );
        packageSpinner.succeed(`Updated package.json.`);
        await updateDependencies(["radix-ui"], [], config, { silent: false });
      } else {
        packageSpinner.succeed(`radix-ui already in package.json.`);
      }
      logger.info("");
      logger.info(
        `Migration complete. The following packages may be removed if no longer in use:`
      );
      logger.info(highlighter.info(foundPackagesArray.join(", ")));
      logger.info(`Please review your codebase before removing.`);
    } else {
      packageSpinner.succeed("No packages found in source files.");
    }
  } catch (error) {
    packageSpinner.fail("Failed to update package.json");
    logger.warn(
      "You may need to manually replace @radix-ui/react-* packages with radix-ui"
    );
  }
}
async function migrateRadixFile(content) {
  const radixImportPattern = /import\s+(?:(type)\s+)?(?:\*\s+as\s+(\w+)|{([^}]+)})\s+from\s+(["'])@radix-ui\/react-([^"']+)\4(;?)/g;
  const imports = [];
  const linesToRemove = [];
  const replacedPackages = [];
  let quoteStyle = '"';
  let hasSemicolon = false;
  let result = content;
  let match;
  while ((match = radixImportPattern.exec(content)) !== null) {
    const [
      fullMatch,
      typeKeyword,
      namespaceAlias,
      namedImports,
      quote,
      packageName,
      semicolon
    ] = match;
    if (packageName === "icons" || packageName.startsWith("icons/")) {
      continue;
    }
    linesToRemove.push(fullMatch);
    if (linesToRemove.length === 1) {
      quoteStyle = quote;
      hasSemicolon = semicolon === ";";
    }
    replacedPackages.push(`@radix-ui/react-${packageName}`);
    const isTypeOnly = Boolean(typeKeyword);
    if (namespaceAlias) {
      const componentName = toPascalCase2(packageName);
      imports.push({
        name: componentName,
        alias: namespaceAlias,
        isType: isTypeOnly
      });
    } else if (namedImports) {
      processNamedImports(namedImports, isTypeOnly, imports, packageName);
    }
  }
  if (imports.length === 0) {
    return {
      content,
      replacedPackages: []
    };
  }
  const uniqueImports = imports.filter(
    (importName, index, self) => index === self.findIndex(
      (i) => i.name === importName.name && i.alias === importName.alias && i.isType === importName.isType
    )
  );
  const importList = uniqueImports.map((imp) => {
    const typePrefix = imp.isType ? "type " : "";
    return imp.alias ? `${typePrefix}${imp.name} as ${imp.alias}` : `${typePrefix}${imp.name}`;
  }).join(", ");
  const unifiedImport = `import { ${importList} } from ${quoteStyle}radix-ui${quoteStyle}${hasSemicolon ? ";" : ""}`;
  result = linesToRemove.reduce((acc, line, index) => {
    return acc.replace(line, index === 0 ? unifiedImport : "");
  }, result);
  result = result.replace(/\n\s*\n\s*\n/g, "\n\n");
  const hasSlotImport = uniqueImports.some(
    (imp) => imp.name === "Slot" && imp.alias === "SlotPrimitive"
  );
  if (hasSlotImport) {
    const lines = result.split("\n");
    const transformedLines = lines.map((line) => {
      if (line.trim().startsWith("import ")) {
        return line;
      }
      let transformedLine = line;
      transformedLine = transformedLine.replace(
        /\b(asChild\s*\?\s*)Slot(\s*:)/g,
        "$1__SLOT_PLACEHOLDER__$2"
      );
      transformedLine = transformedLine.replace(
        /\bReact\.ComponentProps<typeof\s+Slot>/g,
        "React.ComponentProps<typeof __SLOT_PLACEHOLDER__>"
      );
      transformedLine = transformedLine.replace(
        /\bComponentProps<typeof\s+Slot>/g,
        "ComponentProps<typeof __SLOT_PLACEHOLDER__>"
      );
      transformedLine = transformedLine.replace(
        /(<\/?)Slot(\s*\/?>)/g,
        "$1__SLOT_PLACEHOLDER__$2"
      );
      transformedLine = transformedLine.replace(
        /\bSlot\b/g,
        (match2, offset, string) => {
          const beforeMatch = string.substring(0, offset);
          const openQuotes = (beforeMatch.match(/"/g) || []).length;
          const openSingleQuotes = (beforeMatch.match(/'/g) || []).length;
          if (openQuotes % 2 !== 0 || openSingleQuotes % 2 !== 0) {
            return match2;
          }
          return "__SLOT_PLACEHOLDER__";
        }
      );
      transformedLine = transformedLine.replace(
        /__SLOT_PLACEHOLDER__/g,
        "SlotPrimitive.Slot"
      );
      return transformedLine;
    });
    result = transformedLines.join("\n");
  }
  const uniqueReplacedPackages = Array.from(new Set(replacedPackages));
  return {
    content: result,
    replacedPackages: uniqueReplacedPackages
  };
}
var FILES_NEEDING_MANUAL_REVIEW = [
  "sidebar.tsx",
  "pagination.tsx",
  "calendar.tsx"
];
var RTL_DOCS_URL = `${SHADCN_URL}/docs/rtl#manual-migration-optional`;
async function migrateRtl(config, options = {}) {
  let files;
  let basePath;
  if (options.path) {
    basePath = config.resolvedPaths.cwd;
    const isGlob = options.path.includes("*");
    if (isGlob) {
      files = await fg3(options.path, {
        cwd: basePath,
        onlyFiles: true,
        ignore: ["**/node_modules/**"]
      });
    } else {
      const fullPath = path4__default.resolve(basePath, options.path);
      const stat = await promises.stat(fullPath).catch(() => null);
      if (!stat) {
        throw new Error(`File not found: ${options.path}`);
      }
      if (stat.isDirectory()) {
        basePath = fullPath;
        files = await fg3("**/*.{js,ts,jsx,tsx}", {
          cwd: basePath,
          onlyFiles: true,
          ignore: ["**/node_modules/**"]
        });
      } else if (stat.isFile()) {
        files = [options.path];
      } else {
        throw new Error(`Unsupported path type: ${options.path}`);
      }
    }
    if (files.length === 0) {
      throw new Error(`No files found matching: ${options.path}`);
    }
  } else {
    if (!config.resolvedPaths.ui) {
      throw new Error(
        "Could not find a valid `ui` path in your `components.json`. Please provide a path or glob pattern."
      );
    }
    basePath = config.resolvedPaths.ui;
    files = await fg3("**/*.{js,ts,jsx,tsx}", {
      cwd: basePath,
      onlyFiles: true
    });
  }
  if (!options.yes) {
    const relativePath = options.path ? options.path : `./${path4__default.relative(config.resolvedPaths.cwd, basePath)}`;
    const { confirm } = await prompts5({
      type: "confirm",
      name: "confirm",
      initial: true,
      message: `We will migrate ${highlighter.info(
        files.length
      )} file(s) in ${highlighter.info(relativePath)} to RTL. Continue?`
    });
    if (!confirm) {
      logger.info("Migration cancelled.");
      process.exit(0);
    }
  }
  const configSpinner = spinner("Updating components.json...").start();
  try {
    const configPath = path4__default.resolve(config.resolvedPaths.cwd, "components.json");
    const existingConfig = JSON.parse(await promises.readFile(configPath, "utf-8"));
    existingConfig.rtl = true;
    await promises.writeFile(
      configPath,
      JSON.stringify(existingConfig, null, 2) + "\n"
    );
    configSpinner.succeed("Updated components.json.");
  } catch {
    configSpinner.fail("Failed to update components.json.");
    throw new Error(
      "Could not update components.json. Please manually set `rtl: true`."
    );
  }
  const migrationSpinner = spinner("Migrating files to RTL...").start();
  let transformedCount = 0;
  const filesNeedingReview = [];
  await Promise.all(
    files.map(async (file) => {
      migrationSpinner.text = `Migrating ${file}...`;
      const filePath = path4__default.join(basePath, file);
      const content = await promises.readFile(filePath, "utf-8");
      const transformed = await transformDirection(content);
      if (transformed !== content) {
        await promises.writeFile(filePath, transformed);
        transformedCount++;
      }
      const fileName = path4__default.basename(file);
      if (FILES_NEEDING_MANUAL_REVIEW.includes(fileName)) {
        filesNeedingReview.push(file);
      }
    })
  );
  migrationSpinner.succeed(
    `Migration complete. ${transformedCount} file(s) transformed.`
  );
  if (filesNeedingReview.length > 0) {
    logger.break();
    logger.warn("The following components may need manual RTL adjustments:");
    for (const file of filesNeedingReview) {
      logger.info(`  - ${file}`);
    }
    logger.break();
    logger.info(`See ${highlighter.info(RTL_DOCS_URL)} for more information.`);
  }
}
async function preFlightMigrate(options) {
  const errors = {};
  if (!fs11.existsSync(options.cwd) || !fs11.existsSync(path4__default.resolve(options.cwd, "package.json"))) {
    errors[MISSING_DIR_OR_EMPTY_PROJECT] = true;
    return {
      errors,
      config: null
    };
  }
  if (!fs11.existsSync(path4__default.resolve(options.cwd, "components.json"))) {
    errors[MISSING_CONFIG] = true;
    return {
      errors,
      config: null
    };
  }
  try {
    const config = await getConfig(options.cwd);
    return {
      errors,
      config
    };
  } catch (error) {
    logger.break();
    logger.error(
      `An invalid ${highlighter.info(
        "components.json"
      )} file was found at ${highlighter.info(
        options.cwd
      )}.
Before you can run a migration, you must create a valid ${highlighter.info(
        "components.json"
      )} file by running the ${highlighter.info("init")} command.`
    );
    logger.error(
      `Learn more at ${highlighter.info(`${SHADCN_URL}/docs/components-json`)}.`
    );
    logger.break();
    process.exit(1);
  }
}
var migrations = [
  {
    name: "icons",
    description: "migrate your ui components to a different icon library."
  },
  {
    name: "radix",
    description: "migrate to radix-ui."
  },
  {
    name: "rtl",
    description: "migrate your components to support RTL (right-to-left)."
  }
];
var migrateOptionsSchema = z.object({
  cwd: z.string(),
  list: z.boolean(),
  yes: z.boolean(),
  migration: z.string().refine(
    (value) => value && migrations.some((migration) => migration.name === value),
    {
      message: "You must specify a valid migration. Run `shadcn migrate --list` to see available migrations."
    }
  ).optional(),
  path: z.string().optional()
});
var migrate = new Command().name("migrate").description("run a migration.").argument("[migration]", "the migration to run.").argument("[path]", "optional path or glob pattern to migrate.").option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("-l, --list", "list all migrations.", false).option("-y, --yes", "skip confirmation prompt.", false).action(async (migration, migratePath, opts) => {
  try {
    const options = migrateOptionsSchema.parse({
      cwd: path4__default.resolve(opts.cwd),
      migration,
      path: migratePath,
      list: opts.list,
      yes: opts.yes
    });
    if (options.list || !options.migration) {
      logger.info("Available migrations:");
      for (const migration2 of migrations) {
        logger.info(`- ${migration2.name}: ${migration2.description}`);
      }
      return;
    }
    if (!options.migration) {
      throw new Error(
        "You must specify a migration. Run `shadcn migrate --list` to see available migrations."
      );
    }
    let { errors, config } = await preFlightMigrate(options);
    if (errors[MISSING_DIR_OR_EMPTY_PROJECT] || errors[MISSING_CONFIG]) {
      throw new Error(
        "No `components.json` file found. Ensure you are at the root of your project."
      );
    }
    if (!config) {
      throw new Error(
        "Something went wrong reading your `components.json` file. Please ensure you have a valid `components.json` file."
      );
    }
    if (options.migration === "icons") {
      await migrateIcons(config);
    }
    if (options.migration === "radix") {
      await migrateRadix(config, { yes: options.yes, path: options.path });
    }
    if (options.migration === "rtl") {
      await migrateRtl(config, { yes: options.yes, path: options.path });
    }
  } catch (error) {
    logger.break();
    handleError(error);
  }
});
var addOptionsSchema2 = z.object({
  cwd: z.string(),
  silent: z.boolean()
});
var add2 = new Command().name("add").description("add registries to your project").argument(
  "[registries...]",
  "registries (@namespace) or registry URLs (@namespace=url)"
).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("-s, --silent", "mute output.", false).action(async (registries, opts) => {
  try {
    const options = addOptionsSchema2.parse({
      cwd: path4__default.resolve(opts.cwd),
      silent: opts.silent
    });
    const registryArgs = registries.length > 0 ? registries : await promptForRegistries({ silent: options.silent });
    await addRegistriesToConfig(registryArgs, options.cwd, {
      silent: options.silent
    });
  } catch (error) {
    logger.break();
    handleError(error);
  }
});
function parseRegistryArg(arg) {
  const [namespace, ...rest] = arg.split("=");
  const url = rest.length > 0 ? rest.join("=") : void 0;
  if (!namespace.startsWith("@")) {
    throw new Error(
      `Invalid registry namespace: ${highlighter.info(namespace)}. Registry names must start with @ (e.g., @acme).`
    );
  }
  return { namespace, url };
}
function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}
async function addRegistriesToConfig(registryArgs, cwd, options) {
  const configPath = path4__default.resolve(cwd, "components.json");
  if (!fs11.existsSync(configPath)) {
    throw new Error(
      `No ${highlighter.info("components.json")} found. Run ${highlighter.info(
        "shadcn init"
      )} first.`
    );
  }
  const parsed = registryArgs.map(parseRegistryArg);
  const needsLookup = parsed.filter((p) => !p.url);
  let registriesIndex = [];
  if (needsLookup.length > 0) {
    const fetchSpinner = spinner("Fetching registries.", {
      silent: options.silent
    }).start();
    const registries = await getRegistries();
    if (!registries) {
      fetchSpinner.fail();
      throw new Error("Failed to fetch registries.");
    }
    fetchSpinner.succeed();
    registriesIndex = registries;
  }
  const registriesToAdd = {};
  for (const { namespace, url } of parsed) {
    if (namespace in BUILTIN_REGISTRIES) {
      logger.warn(
        `${highlighter.info(
          namespace
        )} is a built-in registry and cannot be added.`
      );
      continue;
    }
    if (url) {
      if (!url.includes("{name}")) {
        throw new Error(
          `Invalid registry URL for ${highlighter.info(
            namespace
          )}. URL must include {name} placeholder. Example: ${highlighter.info(
            `${namespace}=https://example.com/r/{name}.json`
          )}`
        );
      }
      registriesToAdd[namespace] = url;
    } else {
      const registry2 = registriesIndex.find((r) => r.name === namespace);
      if (!registry2) {
        throw new Error(
          `Registry ${highlighter.info(namespace)} not found. Provide a URL: ${highlighter.info(
            `${namespace}=https://.../{name}.json`
          )}`
        );
      }
      registriesToAdd[namespace] = registry2.url;
    }
  }
  if (Object.keys(registriesToAdd).length === 0) {
    return { addedRegistries: [] };
  }
  const existingConfig = await fs11.readJson(configPath);
  const existingRegistries = existingConfig.registries || {};
  const newRegistries = {};
  const skipped = [];
  for (const [ns, url] of Object.entries(registriesToAdd)) {
    if (existingRegistries[ns]) {
      skipped.push(ns);
    } else {
      newRegistries[ns] = url;
    }
  }
  if (Object.keys(newRegistries).length === 0) {
    if (skipped.length > 0 && !options.silent) {
      spinner(
        `Skipped ${pluralize(
          skipped.length,
          "registry",
          "registries"
        )}: (already configured)`,
        { silent: options.silent }
      )?.info();
      for (const name of skipped) {
        logger.log(`  - ${name}`);
      }
    } else if (!options.silent) {
      logger.info("No new registries to add.");
    }
    return;
  }
  const updatedConfig = {
    ...existingConfig,
    registries: {
      ...existingRegistries,
      ...newRegistries
    }
  };
  const writeSpinner = spinner("Updating components.json.", {
    silent: options.silent
  }).start();
  await fs11.writeJson(configPath, updatedConfig, { spaces: 2 });
  writeSpinner.succeed();
  if (!options.silent) {
    const newRegistryNames = Object.keys(newRegistries);
    spinner(
      `Added ${pluralize(newRegistryNames.length, "registry", "registries")}:`,
      { silent: options.silent }
    )?.succeed();
    for (const name of newRegistryNames) {
      logger.log(`  - ${name}`);
    }
    if (skipped.length > 0) {
      spinner(
        `Skipped ${pluralize(
          skipped.length,
          "registry",
          "registries"
        )}: (already configured)`,
        { silent: options.silent }
      )?.info();
      for (const name of skipped) {
        logger.log(`  - ${name}`);
      }
    }
  }
}
async function promptForRegistries(options) {
  const fetchSpinner = spinner("Fetching registries.", {
    silent: options.silent
  }).start();
  const registries = await getRegistries();
  if (!registries) {
    fetchSpinner.fail();
    throw new Error("Failed to fetch registries.");
  }
  fetchSpinner.succeed();
  const sorted = [...registries].sort((a, b) => a.name.localeCompare(b.name));
  const { selected } = await prompts5({
    type: "autocompleteMultiselect",
    name: "selected",
    message: "Which registries would you like to add?",
    hint: "Space to select. A to toggle all. Enter to submit.",
    instructions: false,
    choices: sorted.map((r) => ({
      title: r.name,
      description: r.description,
      value: r.name
    }))
  });
  if (!selected?.length) {
    logger.warn("No registries selected. Exiting.");
    logger.info("");
    process.exit(1);
  }
  return selected;
}
var registry = new Command().name("registry").description("manage registries").addCommand(add2);
var searchOptionsSchema = z.object({
  cwd: z.string(),
  query: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
});
var search = new Command().name("search").alias("list").description("search items from registries").argument(
  "<registries...>",
  "the registry names or urls to search items from. Names must be prefixed with @."
).option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).option("-q, --query <query>", "query string").option(
  "-l, --limit <number>",
  "maximum number of items to display per registry",
  "100"
).option("-o, --offset <number>", "number of items to skip", "0").action(async (registries, opts) => {
  try {
    const options = searchOptionsSchema.parse({
      cwd: path4__default.resolve(opts.cwd),
      query: opts.query,
      limit: opts.limit ? parseInt(opts.limit, 10) : void 0,
      offset: opts.offset ? parseInt(opts.offset, 10) : void 0
    });
    await loadEnvFiles(options.cwd);
    const defaultConfig = createConfig({
      style: "new-york",
      resolvedPaths: {
        cwd: options.cwd
      }
    });
    let shadowConfig = configWithDefaults(defaultConfig);
    const componentsJsonPath = path4__default.resolve(options.cwd, "components.json");
    if (fs11.existsSync(componentsJsonPath)) {
      const existingConfig = await fs11.readJson(componentsJsonPath);
      const partialConfig = rawConfigSchema.partial().parse(existingConfig);
      shadowConfig = configWithDefaults({
        ...defaultConfig,
        ...partialConfig
      });
    }
    let config = shadowConfig;
    try {
      const fullConfig = await getConfig(options.cwd);
      if (fullConfig) {
        config = configWithDefaults(fullConfig);
      }
    } catch {
    }
    const { config: updatedConfig, newRegistries } = await ensureRegistriesInConfig(
      registries.map((registry2) => `${registry2}/registry`),
      config,
      {
        silent: true,
        writeFile: false
      }
    );
    if (newRegistries.length > 0) {
      config.registries = updatedConfig.registries;
    }
    validateRegistryConfigForItems(registries, config);
    const results = await searchRegistries(registries, {
      query: options.query,
      limit: options.limit,
      offset: options.offset,
      config
    });
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (error) {
    handleError(error);
  } finally {
    clearRegistryContext();
  }
});
var viewOptionsSchema = z.object({
  cwd: z.string()
});
var view = new Command().name("view").description("view items from the registry").argument("<items...>", "the item names or URLs to view").option(
  "-c, --cwd <cwd>",
  "the working directory. defaults to the current directory.",
  process.cwd()
).action(async (items, opts) => {
  try {
    const options = viewOptionsSchema.parse({
      cwd: path4__default.resolve(opts.cwd)
    });
    await loadEnvFiles(options.cwd);
    let shadowConfig = configWithDefaults({});
    const componentsJsonPath = path4__default.resolve(options.cwd, "components.json");
    if (fs11.existsSync(componentsJsonPath)) {
      const existingConfig = await fs11.readJson(componentsJsonPath);
      const partialConfig = rawConfigSchema.partial().parse(existingConfig);
      shadowConfig = configWithDefaults(partialConfig);
    }
    let config = shadowConfig;
    try {
      const fullConfig = await getConfig(options.cwd);
      if (fullConfig) {
        config = configWithDefaults(fullConfig);
      }
    } catch {
    }
    const { config: updatedConfig, newRegistries } = await ensureRegistriesInConfig(items, config, {
      silent: true,
      writeFile: false
    });
    if (newRegistries.length > 0) {
      config.registries = updatedConfig.registries;
    }
    validateRegistryConfigForItems(items, config);
    const payload = await getRegistryItems(items, { config });
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  } catch (error) {
    handleError(error);
  } finally {
    clearRegistryContext();
  }
});

// package.json
var package_default = {
  version: "1.0.0"};

// src/index.ts
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
async function main() {
  const program2 = new Command().name("yyc3").description("YYC\xB3 UI \u667A\u80FD\u7F16\u7A0B\u5E93 \u2014 \u8A00\u542F\u8C61\u9650 | \u8BED\u67A2\u672A\u6765").version(
    package_default.version,
    "-v, --version",
    "display the version number"
  );
  program2.addCommand(init).addCommand(apply).addCommand(add).addCommand(diff).addCommand(docs).addCommand(view).addCommand(search).addCommand(migrate).addCommand(info).addCommand(build).addCommand(mcp).addCommand(registry);
  return program2;
}
var program = await main();

export { fetchTree, getItemTargetPath, getPreset, getPresets, getRegistries, getRegistriesConfig, getRegistriesIndex, getRegistry, getRegistryBaseColor, getRegistryBaseColors, getRegistryIcons, getRegistryItems, getRegistryStyles, getShadcnRegistryIndex, program, resolveRegistryItems, resolveTree };
//# sourceMappingURL=chunk-LBZLHZB6.js.map
//# sourceMappingURL=chunk-LBZLHZB6.js.map