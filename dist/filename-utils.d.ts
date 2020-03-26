/**
 * Shortens the length of a directory in a pretty way.
 * @param pathName The path to shorten
 * @param maxLength The maximum length of the path. Must be at least 4.
 * @returns The shortened directory name.
 */
export declare function getPrettyPathName(pathName: string, maxLength: number): string;
/**
 * Escapes the characters |()[]#*{}-+_!\,`> from a string.
 * @param source The source to escape
 * @returns An escaped version of the string
 */
export declare function escapeMarkdownCharacters(source: string): string;
/**
 * Parses the output from the git root directory command, removing newlines and adding a platform
 * native separator.
 * @param stdout The output to cleanup
 * @param seperator The separator the path should end in. Defaults to platform native.
 * @returns A cleaned up git root directory.
 */
export declare function parseGitRootPathOutput(stdout: string, seperator?: string): string;
/**
 * Trims the line endings from the end of a string
 * @param input The string to cleanup
 * @returns The string without line endings
 */
export declare function trimLineEnding(input: string): string;
