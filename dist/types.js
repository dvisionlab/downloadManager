"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strategies = void 0;
/**
 * The strategy to use to create the download queue
 * @enum {string}
 * @readonly
 * @property {string} CONCAT - Concatenate the adding queue to the download queue
 * @property {string} ALTERNATE - Create a new queue alternating series
 */
var strategies;
(function (strategies) {
    strategies["CONCAT"] = "CONCAT";
    strategies["ALTERNATE"] = "ALTERNATE";
})(strategies = exports.strategies || (exports.strategies = {}));
//# sourceMappingURL=types.js.map