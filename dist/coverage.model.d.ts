import { CoverageThreshold, SortMethod } from "./config.model";
export interface CoverageItem {
    total: number;
    covered: number;
    skipped: number;
    pct: number;
}
export interface CoverageEntry {
    lines: CoverageItem;
    functions: CoverageItem;
    statements: CoverageItem;
    branches: CoverageItem;
}
export interface CoverageCollection {
    [key: string]: CoverageEntry;
}
export interface CoverageModel {
    total: CoverageEntry;
    elided: CoverageEntry;
    elidedCount: number;
    displayed: CoverageCollection;
}
export declare function combineEntries(first: CoverageEntry, second: CoverageEntry): CoverageEntry;
/**
 * Sorts a list of files by their total line coverage.
 * @param files The files list
 * @param coverageCollection The collection of file coverages.
 * @param method The method to use while sorting
 * @returns The sorted list of file names.
 */
export declare function sortFiles(files: string[], coverageCollection: CoverageCollection, method: SortMethod): string[];
export declare function makeCoverageModel(numberOfEntries: number, files: string[], coverageCollection: CoverageCollection, sortMethod?: SortMethod): {
    displayed: {};
    total: CoverageEntry;
    elided: CoverageEntry;
    elidedCount: number;
};
export declare function meetsThreshold(entry: CoverageEntry, threshold: CoverageThreshold): boolean;
