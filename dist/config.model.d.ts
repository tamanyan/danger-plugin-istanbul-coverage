export declare type ReportFileSet = "created" | "modified" | "createdOrModified" | "all";
export declare type ReportMode = "fail" | "warn" | "message";
export declare type SortMethod = "alphabetically" | "least-coverage" | "most-coverage" | "largest-file-size" | "smallest-file-size" | "uncovered-lines";
export declare type SourceType = "json-summary" | "lcov";
export interface SourcePathExplicit {
    path: string;
    type: SourceType;
}
export declare type SourcePath = string | SourcePathExplicit;
export interface CoverageThreshold {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
}
export interface Config {
    customSuccessMessage?: string;
    customFailureMessage?: string;
    numberOfEntries: number;
    entrySortMethod: SortMethod;
    coveragePath?: SourcePath;
    coveragePaths: SourcePath[];
    reportFileSet: ReportFileSet;
    threshold: CoverageThreshold;
    reportMode: ReportMode;
}
/**
 * Completes a partial configuration with default values.
 * @param config The configuration to complete
 * @returns A complete configuration
 */
export declare function makeCompleteConfiguration(config?: Partial<Config>): Config;
