import { CoverageCollection } from "../coverage.model";
/**
 * Parses a json-summary formatted output from istanbul
 * @param coveragePath The path of the coverage file
 * @returns A coverage collection
 * @throws Throws an error if formatting is invalid.
 */
export declare function parseJsonSummary(coveragePath: string): CoverageCollection;
