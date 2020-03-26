"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filesystem_service_1 = require("../filesystem.service");
var LcovToken;
(function (LcovToken) {
    LcovToken["TEST_NAME"] = "TN";
    LcovToken["SOURCE_FILE"] = "SF";
    LcovToken["FUNCTION"] = "FN";
    LcovToken["FUNCTION_HITS"] = "FNDA";
    LcovToken["FUNCTIONS_FOUND"] = "FNF";
    LcovToken["FUNCTIONS_HIT"] = "FNH";
    LcovToken["BRANCH"] = "BRDA";
    LcovToken["BRANCHES_FOUND"] = "BRF";
    LcovToken["BRANCHES_HIT"] = "BRH";
    LcovToken["LINE"] = "DA";
    LcovToken["LINES_HIT"] = "LH";
    LcovToken["LINES_FOUND"] = "LF";
    LcovToken["END_OF_RECORD"] = "end_of_record";
})(LcovToken || (LcovToken = {}));
const reverseTokenLookup = new Map();
Object.keys(LcovToken).forEach((token) => {
    const tokenValue = LcovToken[token];
    reverseTokenLookup.set(tokenValue, token);
});
Object.freeze(reverseTokenLookup);
function getTokenFromValue(tokenValue) {
    return LcovToken[reverseTokenLookup.get(tokenValue)];
}
function partsExpected(token) {
    switch (token) {
        case LcovToken.TEST_NAME:
            return 1;
        case LcovToken.SOURCE_FILE:
            return 1;
        case LcovToken.FUNCTION:
            return 2;
        case LcovToken.FUNCTION_HITS:
            return 2;
        case LcovToken.FUNCTIONS_FOUND:
            return 1;
        case LcovToken.FUNCTIONS_HIT:
            return 1;
        case LcovToken.BRANCH:
            return 4;
        case LcovToken.BRANCHES_FOUND:
            return 1;
        case LcovToken.BRANCHES_HIT:
            return 1;
        case LcovToken.LINE:
            return 3;
        case LcovToken.LINES_HIT:
            return 1;
        case LcovToken.LINES_FOUND:
            return 1;
        case LcovToken.END_OF_RECORD:
            return 0;
    }
}
function splitWithTail(str, delim, count) {
    const parts = str.split(delim);
    const tail = parts.slice(count).join(delim);
    const result = parts.slice(0, count);
    result.push(tail);
    return result;
}
function splitLine(line) {
    const splitIndex = line.indexOf(":");
    if (line === LcovToken.END_OF_RECORD) {
        return { token: LcovToken.END_OF_RECORD, parts: [] };
    }
    const key = line.substring(0, splitIndex);
    const token = getTokenFromValue(key);
    if (token === undefined) {
        return undefined;
    }
    const expectedParts = partsExpected(token);
    const remainder = line.slice(splitIndex + 1);
    if (remainder.length === 0) {
        return { token, parts: [] };
    }
    let parts = expectedParts > 1 ? remainder.split(",") : [remainder];
    parts = parts.map(part => part.trim());
    return { token, parts };
}
function makeCoverageItem(total, covered) {
    return { total, covered, skipped: total - covered, pct: covered / total * 100 };
}
function convertToCollection(lines) {
    let file;
    let numFunctions;
    let numFunctionsHit;
    let numBranches;
    let numBranchesHit;
    let numLines;
    let numLinesHit;
    const collection = {};
    lines.forEach(line => {
        switch (line.token) {
            case LcovToken.SOURCE_FILE:
                file = line.parts[0];
                break;
            case LcovToken.FUNCTIONS_FOUND:
                numFunctions = Number(line.parts[0]);
                break;
            case LcovToken.FUNCTIONS_HIT:
                numFunctionsHit = Number(line.parts[0]);
                break;
            case LcovToken.BRANCHES_HIT:
                numBranchesHit = Number(line.parts[0]);
                break;
            case LcovToken.BRANCHES_FOUND:
                numBranches = Number(line.parts[0]);
                break;
            case LcovToken.LINES_HIT:
                numLinesHit = Number(line.parts[0]);
                break;
            case LcovToken.LINES_FOUND:
                numLines = Number(line.parts[0]);
                break;
            case LcovToken.END_OF_RECORD:
                if (file === undefined ||
                    numFunctions === undefined ||
                    numFunctionsHit === undefined ||
                    numBranches === undefined ||
                    numBranchesHit === undefined ||
                    numLines === undefined ||
                    numLinesHit === undefined) {
                    throw Error();
                }
                collection[file] = {
                    lines: makeCoverageItem(numLines, numLinesHit),
                    functions: makeCoverageItem(numFunctions, numFunctionsHit),
                    branches: makeCoverageItem(numBranches, numBranchesHit),
                    statements: makeCoverageItem(numLines, numLinesHit),
                };
                file = undefined;
                numFunctions = undefined;
                numFunctionsHit = undefined;
                numBranches = undefined;
                numBranchesHit = undefined;
                numLines = undefined;
                numLinesHit = undefined;
                break;
        }
    });
    return collection;
}
function parseLcov(coveragePath) {
    const filesystem = new filesystem_service_1.default();
    if (!filesystem.exists(coveragePath)) {
        throw Error(`Couldn't find instanbul coverage json file at path '${coveragePath}'.`);
    }
    let content;
    try {
        content = filesystem.read(coveragePath);
        const lines = content
            .split("\n")
            .map(splitLine)
            .filter(line => line !== undefined);
        return convertToCollection(lines);
    }
    catch (error) {
        throw Error(`Coverage data had invalid formatting at path '${coveragePath}'`);
    }
}
exports.parseLcov = parseLcov;
