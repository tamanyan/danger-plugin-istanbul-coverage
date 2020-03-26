"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Completes a partial configuration with default values.
 * @param config The configuration to complete
 * @returns A complete configuration
 */
function makeCompleteConfiguration(config) {
    const defaults = {
        coveragePaths: [],
        reportFileSet: "all",
        reportMode: "message",
        entrySortMethod: "alphabetically",
        numberOfEntries: 10,
        threshold: {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
        },
    };
    const combined = config ? Object.assign({}, defaults, config) : defaults;
    const coveragePath = combined.coveragePath ? combined.coveragePath : "./coverage/coverage-summary.json";
    const coveragePaths = combined.coveragePaths.length === 0 ? [coveragePath] : combined.coveragePaths;
    delete combined.coveragePath;
    return Object.assign({}, combined, { coveragePaths });
}
exports.makeCompleteConfiguration = makeCompleteConfiguration;
