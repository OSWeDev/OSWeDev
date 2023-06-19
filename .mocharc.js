"use strict";

module.exports = {
    recursive: true,
    timeout: 10000,
    files: "dist/test/**/*.js",
    require: "source-map-support/register",
    nodePath: "./node_modules/.bin/node.cmd",
};
