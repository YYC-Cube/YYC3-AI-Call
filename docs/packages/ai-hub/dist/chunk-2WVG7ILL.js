/**
 * @preserve YYC³ AI Family Hub
 * @version 1.4.0
 * @license MIT
 * @copyright YYC³ AI Team
 * @see https://github.com/yyc3/YYC3-CloudPivot-Intelli-Matrix
 */


// src/logger.ts
var DEBUG = typeof process !== "undefined" && process.env?.["YYC3_DEBUG"] === "true";
var logger = {
  debug: (...args) => {
    if (DEBUG) console.debug("[YYC3:DEBUG]", ...args);
  },
  info: (...args) => {
    if (DEBUG) console.info("[YYC3]", ...args);
  },
  warn: (...args) => {
    if (DEBUG) console.warn("[YYC3]", ...args);
  },
  error: (...args) => console.error("[YYC3]", ...args),
  init: (msg) => {
    if (DEBUG) console.log(`\u{1F680} ${msg}`);
  },
  step: (num, msg) => {
    if (DEBUG) console.log(`${num}\uFE0F\u20E3 ${msg}`);
  },
  done: (msg) => {
    if (DEBUG) console.log(`\u2705 ${msg}`);
  },
  stat: (key, val) => {
    if (DEBUG) console.log(`   - ${key}: ${val}`);
  }
};

export { logger };
//# sourceMappingURL=chunk-2WVG7ILL.js.map
//# sourceMappingURL=chunk-2WVG7ILL.js.map