"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const filename_utils_1 = require("./filename-utils");
class GitService {
    /**
     * Finds the path of the local git directory.
     * @returns A promise with the directory path
     */
    getRootDirectory() {
        return new Promise((resolve, reject) => {
            child_process_1.exec("git rev-parse --show-toplevel", (error, stdout, stderr) => {
                const failed = error || stderr !== "";
                resolve(failed ? __dirname : filename_utils_1.parseGitRootPathOutput(stdout));
            });
        });
    }
    /**
     * Finds the current git commit.
     * @returns A promise with the current git commit
     */
    getCurrentCommit() {
        return new Promise((resolve, reject) => {
            child_process_1.exec("git rev-list --no-merges --abbrev-commit -n 1 HEAD", (error, stdout, stderr) => {
                const failed = error || stderr !== "";
                resolve(failed ? "HEAD" : filename_utils_1.trimLineEnding(stdout));
            });
        });
    }
}
exports.GitService = GitService;
