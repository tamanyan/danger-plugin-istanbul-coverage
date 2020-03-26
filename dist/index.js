"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_model_1 = require("./config.model");
const coverage_model_1 = require("./coverage.model");
const parse_json_summary_1 = require("./parser/parse-json-summary");
const _ = require("lodash");
const path = require("path");
const filename_utils_1 = require("./filename-utils");
const git_service_1 = require("./git.service");
const parse_lcov_1 = require("./parser/parse-lcov");
function filterForCoveredFiles(basePath, files, coverage) {
    return files.map(filename => path.resolve(basePath, filename)).filter(filename => coverage[filename] !== undefined);
}
function getFileSet(reportChangeType, all, modified, created) {
    if (reportChangeType === "all") {
        return all;
    }
    if (reportChangeType === "modified") {
        return modified;
    }
    if (reportChangeType === "created") {
        return created;
    }
    return _.union(created, modified);
}
function getReportFunc(reportMode) {
    if (reportMode === "warn") {
        return warn;
    }
    if (reportMode === "fail") {
        return fail;
    }
    return message;
}
function getFileGroupLongDescription(reportChangeType) {
    if (reportChangeType === "all") {
        return "the whole codebase";
    }
    if (reportChangeType === "created") {
        return "the new files in this PR";
    }
    if (reportChangeType === "modified") {
        return "the modified files in this PR";
    }
    return "the modified or changed files in this PR";
}
function getFileGroupShortDescription(reportChangeType) {
    if (reportChangeType === "all") {
        return "All Files";
    }
    if (reportChangeType === "created") {
        return "New Files";
    }
    if (reportChangeType === "modified") {
        return "Modified Files";
    }
    return "Created or Modified Files";
}
function sendPRComment(config, results) {
    const reportFunc = getReportFunc(config.reportMode);
    const messageType = getFileGroupLongDescription(config.reportFileSet);
    if (!coverage_model_1.meetsThreshold(results, config.threshold)) {
        const defaultMessage = `🤔 Hmmm, code coverage is looking low for ${messageType}.`;
        reportFunc(config.customFailureMessage !== undefined ? config.customFailureMessage : defaultMessage);
    }
    else {
        const defaultMessage = `🎉 Test coverage is looking good for ${messageType}`;
        message(config.customSuccessMessage !== undefined ? config.customSuccessMessage : defaultMessage);
    }
}
function formatItem(item) {
    return `(${item.covered}/${item.total}) ${item.pct.toFixed(0)}%`;
}
function formatSourceName(source) {
    return filename_utils_1.escapeMarkdownCharacters(filename_utils_1.getPrettyPathName(source, 30));
}
function formatLinkName(source, branchName) {
    return filename_utils_1.escapeMarkdownCharacters(`../blob/${branchName}/${source}`);
}
function generateReport(basePath, branch, coverage, reportChangeType) {
    const header = `## Coverage in ${getFileGroupShortDescription(reportChangeType)}
File | Line Coverage | Statement Coverage | Function Coverage | Branch Coverage
---- | ------------: | -----------------: | ----------------: | --------------:`;
    const lines = Object.keys(coverage.displayed).map(filename => {
        const e = coverage.displayed[filename];
        const shortFilename = formatSourceName(path.relative(basePath, filename));
        const linkFilename = formatLinkName(path.relative(basePath, filename), branch);
        return [
            `[${shortFilename}](${linkFilename})`,
            formatItem(e.lines),
            formatItem(e.statements),
            formatItem(e.functions),
            formatItem(e.branches),
        ].join(" | ");
    });
    const ellided = coverage.elidedCount === 0
        ? undefined
        : [
            `Other (${coverage.elidedCount} more)`,
            formatItem(coverage.elided.lines),
            formatItem(coverage.elided.statements),
            formatItem(coverage.elided.functions),
            formatItem(coverage.elided.branches),
        ].join(" | ");
    const total = [
        "Total",
        formatItem(coverage.total.lines),
        formatItem(coverage.total.statements),
        formatItem(coverage.total.functions),
        formatItem(coverage.total.branches),
    ].join(" | ");
    return [header, ...lines, ellided, total, ""].filter(part => part !== undefined).join("\n");
}
function getCoveragePaths(coveragePaths) {
    return coveragePaths.map(singleCoveragePath => {
        let originalPath;
        let type;
        if (typeof singleCoveragePath === "string") {
            originalPath = singleCoveragePath;
            type = singleCoveragePath.match(/(lcov\.info)$/) ? "lcov" : "json-summary";
        }
        else {
            originalPath = singleCoveragePath.path;
            type = singleCoveragePath.type;
        }
        if (!process.mainModule) {
            return { path: originalPath, type };
        }
        const appDir = `${process.mainModule.paths[0].split("node_modules")[0].slice(0, -1)}/`;
        originalPath = path.resolve(appDir, originalPath);
        const output = { path: originalPath, type };
        return output;
    });
}
function parseSourcePath(sourcePath) {
    if (sourcePath.type === "json-summary") {
        return parse_json_summary_1.parseJsonSummary(sourcePath.path);
    }
    else {
        return parse_lcov_1.parseLcov(sourcePath.path);
    }
}
function getCombinedCoverageCollection(coveragePaths) {
    return coveragePaths
        .map(coveragePath => parseSourcePath(coveragePath))
        .reduce((previous, current) => (Object.assign({}, previous, current)), {});
}
/**
 * Danger.js plugin for monitoring code coverage on changed files.
 */
function istanbulCoverage(config) {
    const combinedConfig = config_model_1.makeCompleteConfiguration(config);
    const coveragePaths = getCoveragePaths(combinedConfig.coveragePaths);
    let coverage;
    try {
        const parsedCoverage = getCombinedCoverageCollection(coveragePaths);
        if (!parsedCoverage) {
            return Promise.resolve();
        }
        coverage = parsedCoverage;
    }
    catch (error) {
        warn(error.message);
        return Promise.resolve();
    }
    const gitService = new git_service_1.GitService();
    const gitProperties = Promise.all([gitService.getRootDirectory(), gitService.getCurrentCommit()]);
    return gitProperties.then(values => {
        const gitRoot = values[0];
        const gitBranch = values[1];
        const modifiedFiles = filterForCoveredFiles(gitRoot, danger.git.modified_files, coverage);
        const createdFiles = filterForCoveredFiles(gitRoot, danger.git.created_files, coverage);
        const allFiles = Object.keys(coverage).filter(filename => filename !== "total");
        const files = getFileSet(combinedConfig.reportFileSet, allFiles, modifiedFiles, createdFiles);
        if (files.length === 0) {
            return;
        }
        const coverageModel = coverage_model_1.makeCoverageModel(combinedConfig.numberOfEntries, files, coverage, combinedConfig.entrySortMethod);
        sendPRComment(combinedConfig, coverageModel.total);
        const report = generateReport(gitRoot, gitBranch, coverageModel, combinedConfig.reportFileSet);
        markdown("\n" + report);
    });
}
exports.istanbulCoverage = istanbulCoverage;
