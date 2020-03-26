export declare class GitService {
    /**
     * Finds the path of the local git directory.
     * @returns A promise with the directory path
     */
    getRootDirectory(): Promise<string>;
    /**
     * Finds the current git commit.
     * @returns A promise with the current git commit
     */
    getCurrentCommit(): Promise<string>;
}
