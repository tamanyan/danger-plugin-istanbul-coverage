"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_model_1 = require("./config.model");
describe("makeCompleteConfiguration", () => {
    const base = {
        coveragePaths: ["./coverage/coverage-summary.json"],
        reportFileSet: "all",
        reportMode: "message",
        entrySortMethod: "alphabetically",
        numberOfEntries: 10,
        threshold: {
            statements: 100,
            branches: 100,
            functions: 100,
            lines: 100,
        },
    };
    it("returns a default configuration when sent undefined", () => {
        const output = config_model_1.makeCompleteConfiguration();
        expect(output).toEqual(base);
    });
    it("overrides coveragePaths with the value from coveragePath", () => {
        const output = config_model_1.makeCompleteConfiguration({
            coveragePath: "some-other-path",
        });
        expect(output).toEqual(Object.assign({}, base, { coveragePaths: ["some-other-path"] }));
    });
    it("overrides a specific value from the default", () => {
        const output = config_model_1.makeCompleteConfiguration({
            reportMode: "warn",
        });
        expect(output).toEqual(Object.assign({}, base, { reportMode: "warn" }));
    });
});
