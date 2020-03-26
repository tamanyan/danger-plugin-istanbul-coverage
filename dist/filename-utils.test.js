"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const filename_utils_1 = require("./filename-utils");
describe("getPrettyPathName", () => {
    it("doesn't change strings equal to the limit", () => {
        const input = "/exactly/17/chars";
        const output = filename_utils_1.getPrettyPathName(input, 17);
        expect(output).toEqual(input);
    });
    it("elides the middle directories first", () => {
        const input = "/just/over/the/limit";
        const output = filename_utils_1.getPrettyPathName(input, 17);
        expect(output).toEqual("/just/../limit");
    });
    it("elides the middle directories from right to left, excluding the root directory", () => {
        const input = "/just/over/the/limit";
        const output = filename_utils_1.getPrettyPathName(input, 18);
        expect(output).toEqual("/just/../the/limit");
    });
    it("elides the root directory second", () => {
        const input = "/quite-a-lot-actually/over/the/limit";
        const output = filename_utils_1.getPrettyPathName(input, 17);
        expect(output).toEqual("../limit");
    });
    it("truncates the the basename third", () => {
        const input = "/quite-a-lot-actually/over/the/limit-and-this-is-long-as-well";
        const output = filename_utils_1.getPrettyPathName(input, 17);
        expect(output).toEqual("../limit-and-th..");
    });
    it("treats the tilde as the root directory", () => {
        const input = "~/just/over/the/limit";
        const output = filename_utils_1.getPrettyPathName(input, 18);
        expect(output).toEqual("~/../the/limit");
    });
});
describe("escapeMarkdownCharacters", () => {
    it("escapes filenames with '|,(,),[,],#,*,{,},-,+,_,!,\\,`>' characters", () => {
        const filename = `src/file-with-characters{[(|#*-+_!\`)]}.ts`;
        const expectedFilename = `src/file\\-with\\-characters\\{\\[\\(\\|\\#\\*\\-\\+\\_\\!\\\`\\)\\]\\}.ts`;
        const output = filename_utils_1.escapeMarkdownCharacters(filename);
        expect(output).toEqual(expectedFilename);
    });
});
describe("normalizeGitRootOutput", () => {
    it("removes newlines at end of string", () => {
        const output = filename_utils_1.parseGitRootPathOutput("/some/root/directory\n", "/");
        expect(output).toEqual("/some/root/directory/");
    });
    it("removes windows style newlines at end of string", () => {
        const output = filename_utils_1.parseGitRootPathOutput("\\some\\root\\directory \r\n", "\\");
        expect(output).toEqual("\\some\\root\\directory \\");
    });
    it("preserves whitespace before newline", () => {
        const output = filename_utils_1.parseGitRootPathOutput("/some/root/directory \n", "/");
        expect(output).toEqual("/some/root/directory /");
    });
    it("won't concatenate a second path seperator ", () => {
        const output = filename_utils_1.parseGitRootPathOutput("/some/root/directory/\n", "/");
        expect(output).toEqual("/some/root/directory/");
    });
    it("uses the platform native separator by default", () => {
        const output = filename_utils_1.parseGitRootPathOutput("a\n");
        expect(output).toEqual(`a${path.sep}`);
    });
});
describe("trimLineEdings", () => {
    it("removes newlines at end of string", () => {
        const output = filename_utils_1.trimLineEnding("some random string \n");
        expect(output).toEqual("some random string ");
    });
    it("removes windows style newlines at end of string", () => {
        const output = filename_utils_1.trimLineEnding("another random string \r\n");
        expect(output).toEqual("another random string ");
    });
});
