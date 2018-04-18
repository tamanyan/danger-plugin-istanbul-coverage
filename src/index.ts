// Provides dev-time type structures for  `danger` - doesn't affect runtime.
import { DangerDSLType } from "../node_modules/danger/distribution/dsl/DangerDSL"
import { Config, CoverageThreshold, makeCompleteConfiguration, ReportFileSet, ReportMode } from "./config.model"
import {
  combineEntries,
  combineItems,
  CoverageEntry,
  CoverageItem,
  CoverageModel,
  createEmptyCoverageEntry,
  meetsThreshold,
  parseCoverageModel,
  reduceEntries,
} from "./coverage.model"

declare var danger: DangerDSLType
import * as _ from "lodash"
import * as path from "path"
import { escapeMarkdownCharacters, getPrettyPathName } from "./filename-utils"
import { GitService } from "./git.service"

export declare function message(message: string): void
export declare function warn(message: string): void
export declare function fail(message: string): void
export declare function markdown(message: string): void

function filterForCoveredFiles(basePath: string, files: string[], coverage: CoverageModel): string[] {
  return files.map(filename => path.resolve(basePath, filename)).filter(filename => coverage[filename] !== undefined)
}

function getFileSet(reportChangeType: ReportFileSet, all: string[], modified: string[], created: string[]): string[] {
  if (reportChangeType === "all") {
    return all
  }
  if (reportChangeType === "modified") {
    return modified
  }
  if (reportChangeType === "created") {
    return created
  }
  return _.union(created, modified)
}

function getReportFunc(reportMode: ReportMode) {
  if (reportMode === "warn") {
    return warn
  }
  if (reportMode === "fail") {
    return fail
  }
  return message
}

function getFileGroupLongDescription(reportChangeType: ReportFileSet) {
  if (reportChangeType === "all") {
    return "the whole codebase"
  }
  if (reportChangeType === "created") {
    return "the new files in this PR"
  }
  if (reportChangeType === "modified") {
    return "the modified files in this PR"
  }
  return "the modified or changed files in this PR"
}

function getFileGroupShortDescription(reportChangeType: ReportFileSet) {
  if (reportChangeType === "all") {
    return "All Files"
  }
  if (reportChangeType === "created") {
    return "New Files"
  }
  if (reportChangeType === "modified") {
    return "Modified Files"
  }
  return "Created or Modified Files"
}

function sendPRComment(config: Config, results: CoverageEntry) {
  const reportFunc = getReportFunc(config.reportMode)
  const messageType = getFileGroupLongDescription(config.reportFileSet)
  if (!meetsThreshold(results, config.threshold)) {
    const defaultMessage = `🤔 Hmmm, code coverage is looking low for ${messageType}.`
    reportFunc(config.customFailureMessage !== undefined ? config.customFailureMessage : defaultMessage)
  } else {
    const defaultMessage = `🎉 Test coverage is looking good for ${messageType}`
    message(config.customSuccessMessage !== undefined ? config.customSuccessMessage : defaultMessage)
  }
}

function formatItem(item: CoverageItem) {
  return `(${item.covered}/${item.total}) ${item.pct.toFixed(0)}%`
}

function formatSourceName(source: string): string {
  return escapeMarkdownCharacters(getPrettyPathName(source, 30))
}

function formatLinkName(source: string, branchName: string): string {
  return escapeMarkdownCharacters(`../blob/${branchName}/${source}`)
}

function generateReport(basePath: string, branch: string, coverage: CoverageModel, reportChangeType: ReportFileSet) {
  const header = `## Coverage in ${getFileGroupShortDescription(reportChangeType)}
File | Line Coverage | Statement Coverage | Function Coverage | Branch Coverage
---- | ------------: | -----------------: | ----------------: | --------------:`

  const lines = Object.keys(coverage.displayed).map(filename => {
    const e = coverage.displayed[filename]
    const shortFilename = formatSourceName(path.relative(basePath, filename))
    const linkFilename = formatLinkName(path.relative(basePath, filename), branch)
    return [
      `[${shortFilename}](${linkFilename})`,
      formatItem(e.lines),
      formatItem(e.statements),
      formatItem(e.functions),
      formatItem(e.branches),
    ].join(" | ")
  })

  const ellided =
    coverage.ellidedCount === 0
      ? undefined
      : [
          `Other (${coverage.ellidedCount} more)`,
          formatItem(coverage.ellided.lines),
          formatItem(coverage.ellided.statements),
          formatItem(coverage.ellided.functions),
          formatItem(coverage.ellided.branches),
        ].join(" | ")

  const total = [
    "Total",
    formatItem(coverage.total.lines),
    formatItem(coverage.total.statements),
    formatItem(coverage.total.functions),
    formatItem(coverage.total.branches),
  ].join(" | ")
  return [header, ...lines, ellided, total, ""].filter(part => part !== undefined).join("\n")
}

/**
 * Danger.js plugin for monitoring code coverage on changed files.
 */
export function istanbulCoverage(config?: Partial<Config>): Promise<void> {
  const combinedConfig = makeCompleteConfiguration(config)

  let coveragePath = combinedConfig.coveragePath
  if (process.mainModule) {
    const appDir = `${process.mainModule.paths[0].split("node_modules")[0].slice(0, -1)}/`

    coveragePath = path.resolve(appDir, combinedConfig.coveragePath)
  }
  let coverage: CoverageModel
  try {
    const parsedCoverage = parseCoverageModel(coveragePath)
    if (!parsedCoverage) {
      return Promise.resolve()
    }
    coverage = parsedCoverage
  } catch (error) {
    warn(error.message)
    return Promise.resolve()
  }
  const gitService = new GitService()

  const promise = Promise.all([gitService.getRootDirectory(), gitService.getCurrentCommit()])

  return promise.then(values => {
    const gitRoot = values[0]
    const gitBranch = values[1]
    const modifiedFiles = filterForCoveredFiles(gitRoot, danger.git.modified_files, coverage)
    const createdFiles = filterForCoveredFiles(gitRoot, danger.git.created_files, coverage)
    const allFiles = Object.keys(coverage).filter(filename => filename !== "total")

    const files = getFileSet(combinedConfig.reportFileSet, allFiles, modifiedFiles, createdFiles).sort((a, b) =>
      a.localeCompare(b, "en-US")
    )

    if (files.length === 0) {
      return
    }
    const displayedFiles = files.slice(0, Math.min(files.length, combinedConfig.numberOfEntries))
    const displayedEntries = displayedFiles.map(file => coverage[file])
    const ellidedEntries = files.slice(combinedConfig.numberOfEntries).map(file => coverage[file])

    const ellidedSummary = reduceEntries(ellidedEntries)
    const totalSummary = reduceEntries([...displayedEntries, ellidedSummary])

    const coverageEntries = displayedFiles.reduce((current, file) => {
      const copy = { ...current }
      copy[file] = coverage[file]
      return copy
    }, {})

    sendPRComment(combinedConfig, totalSummary)
    const coverageModel: CoverageModel = {
      displayed: coverageEntries,
      total: totalSummary,
      ellided: ellidedSummary,
      ellidedCount: ellidedEntries.length,
    }

    const report = generateReport(gitRoot, gitBranch, coverageModel, combinedConfig.reportFileSet)
    markdown(report)
  })
}
