"use strict";
/**
 * LongURL - Programmable URL Shortener
 *
 * Main entry point for the longurl package.
 * Exports the LongURL class and all related types and adapters.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUrlId = exports.generateBase62Id = exports.SupabaseAdapter = exports.StorageAdapter = exports.LongURL = void 0;
// Export the main LongURL class and adapters
var src_1 = require("./src");
Object.defineProperty(exports, "LongURL", { enumerable: true, get: function () { return src_1.LongURL; } });
Object.defineProperty(exports, "StorageAdapter", { enumerable: true, get: function () { return src_1.StorageAdapter; } });
Object.defineProperty(exports, "SupabaseAdapter", { enumerable: true, get: function () { return src_1.SupabaseAdapter; } });
// Export utilities for advanced usage
var utils_1 = require("./utils");
Object.defineProperty(exports, "generateBase62Id", { enumerable: true, get: function () { return utils_1.generateBase62Id; } });
Object.defineProperty(exports, "isValidUrlId", { enumerable: true, get: function () { return utils_1.isValidUrlId; } });
