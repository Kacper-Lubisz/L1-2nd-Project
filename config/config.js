const _ = require("lodash");

const config = require("./config.json");

// module variables
const defaultConfig = config.development;
const environmentConfig = config[process.env.NODE_ENV || "development"];
const finalConfig = _.merge(defaultConfig, environmentConfig);

module.exports = finalConfig;