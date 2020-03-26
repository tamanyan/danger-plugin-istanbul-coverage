"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
class FilesystemService {
    exists(path) {
        return fs.existsSync(path);
    }
    read(path) {
        return fs.readFileSync(path, "utf8");
    }
}
exports.default = FilesystemService;
