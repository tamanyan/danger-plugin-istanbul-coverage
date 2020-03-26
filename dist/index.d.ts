import { Config } from "./config.model";
export declare function message(message: string): void;
export declare function warn(message: string): void;
export declare function fail(message: string): void;
export declare function markdown(message: string): void;
/**
 * Danger.js plugin for monitoring code coverage on changed files.
 */
export declare function istanbulCoverage(config?: Partial<Config>): Promise<void>;
