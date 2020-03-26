"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function combineItems(first, second) {
    const percentage = second.covered + first.covered > 0 ? 100 * (first.covered + second.covered) / (second.total + first.total) : 100;
    return {
        total: first.total + second.total,
        covered: first.covered + second.covered,
        skipped: first.skipped + second.skipped,
        pct: percentage,
    };
}
function reduceEntries(entries) {
    return entries.reduce((cumulativeEntry, entry) => combineEntries(cumulativeEntry, entry), createEmptyCoverageEntry());
}
function createEmptyCoverageEntry() {
    return {
        lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
        statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
        functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
        branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
    };
}
function combineEntries(first, second) {
    return {
        lines: combineItems(first.lines, second.lines),
        statements: combineItems(first.statements, second.statements),
        branches: combineItems(first.branches, second.branches),
        functions: combineItems(first.functions, second.functions),
    };
}
exports.combineEntries = combineEntries;
function sortFileByCoverageKey(files, coverageCollection, ascending, key) {
    return files
        .map(file => {
        return { file, entry: coverageCollection[file] };
    })
        .sort((a, b) => (ascending ? a.entry.lines[key] - b.entry.lines[key] : b.entry.lines[key] - a.entry.lines[key]))
        .map(entry => entry.file);
}
function sortFilesAlphabetically(files) {
    return files.sort((a, b) => a.localeCompare(b, "en-US"));
}
/**
 * Sorts a list of files by their total line coverage.
 * @param files The files list
 * @param coverageCollection The collection of file coverages.
 * @param method The method to use while sorting
 * @returns The sorted list of file names.
 */
function sortFiles(files, coverageCollection, method) {
    switch (method) {
        case "alphabetically":
            return sortFilesAlphabetically(files);
        case "least-coverage":
            return sortFileByCoverageKey(files, coverageCollection, true, "pct");
        case "most-coverage":
            return sortFileByCoverageKey(files, coverageCollection, false, "pct");
        case "largest-file-size":
            return sortFileByCoverageKey(files, coverageCollection, false, "total");
        case "smallest-file-size":
            return sortFileByCoverageKey(files, coverageCollection, true, "total");
        case "uncovered-lines":
            return sortFileByCoverageKey(files, coverageCollection, false, "skipped");
    }
}
exports.sortFiles = sortFiles;
function makeCoverageModel(numberOfEntries, files, coverageCollection, sortMethod = "alphabetically") {
    const sortedFiles = sortFiles(files, coverageCollection, sortMethod);
    const displayedFiles = sortedFiles.slice(0, Math.min(sortedFiles.length, numberOfEntries));
    const displayedEntries = displayedFiles.map(file => coverageCollection[file]);
    const ellidedEntries = sortedFiles.slice(numberOfEntries).map(file => coverageCollection[file]);
    const ellidedSummary = reduceEntries(ellidedEntries);
    const totalSummary = reduceEntries([...displayedEntries, ellidedSummary]);
    const coverageEntries = displayedFiles.reduce((current, file) => {
        const copy = Object.assign({}, current);
        copy[file] = coverageCollection[file];
        return copy;
    }, {});
    return {
        displayed: coverageEntries,
        total: totalSummary,
        elided: ellidedSummary,
        elidedCount: ellidedEntries.length,
    };
}
exports.makeCoverageModel = makeCoverageModel;
function meetsThreshold(entry, threshold) {
    return (entry.lines.pct >= threshold.lines &&
        entry.functions.pct >= threshold.functions &&
        entry.branches.pct >= threshold.branches &&
        entry.statements.pct >= threshold.statements);
}
exports.meetsThreshold = meetsThreshold;
