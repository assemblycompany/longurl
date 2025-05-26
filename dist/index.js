"use strict";
/**
 * LongURL - Programmable URL Shortener
 *
 * Infrastructure-as-code for URLs. Built for developers who need control.
 *
 * Main entry point for the longurl package.
 * Exports the LongURL class with built-in Supabase support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchemaHelp = exports.isTemporaryError = exports.logSupabaseError = exports.parseSupabaseError = exports.SupabaseAdapterError = exports.SupabaseAdapter = exports.StorageAdapter = exports.isValidUrlId = exports.generateBase62Id = exports.LongURL = void 0;
// Main export - most users only need this
var src_1 = require("./src");
Object.defineProperty(exports, "LongURL", { enumerable: true, get: function () { return src_1.LongURL; } });
// Export utilities for advanced usage
var utils_1 = require("./utils");
Object.defineProperty(exports, "generateBase62Id", { enumerable: true, get: function () { return utils_1.generateBase62Id; } });
Object.defineProperty(exports, "isValidUrlId", { enumerable: true, get: function () { return utils_1.isValidUrlId; } });
// Advanced exports (for custom adapters and error handling)
// Most users won't need these
var StorageAdapter_1 = require("./src/core/storage/StorageAdapter");
Object.defineProperty(exports, "StorageAdapter", { enumerable: true, get: function () { return StorageAdapter_1.StorageAdapter; } });
var supabase_1 = require("./src/adapters/supabase");
Object.defineProperty(exports, "SupabaseAdapter", { enumerable: true, get: function () { return supabase_1.SupabaseAdapter; } });
Object.defineProperty(exports, "SupabaseAdapterError", { enumerable: true, get: function () { return supabase_1.SupabaseAdapterError; } });
Object.defineProperty(exports, "parseSupabaseError", { enumerable: true, get: function () { return supabase_1.parseSupabaseError; } });
Object.defineProperty(exports, "logSupabaseError", { enumerable: true, get: function () { return supabase_1.logSupabaseError; } });
Object.defineProperty(exports, "isTemporaryError", { enumerable: true, get: function () { return supabase_1.isTemporaryError; } });
Object.defineProperty(exports, "getSchemaHelp", { enumerable: true, get: function () { return supabase_1.getSchemaHelp; } });
