"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const STATIC_ENV_PARAMS = require("./STATIC_ENV_PARAMS.js");
// ATTENTION subtilité sur ConfigurationService et STATIC_ENV_PARAMS, on
//  a besoin de ces fichiers en JS également pour la conf de webpack, donc il faut
//  recopier le JS à chaque compilation d'une nouvelle version de ces 2 fichiers.
class ConfigurationService {
    constructor() {
        this.nodeEnv = process.env.NODE_ENV || 'DEV';
        ConfigurationService.instance = this;
    }
    static getInstance() {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }
    getNodeConfiguration() {
        console.log("NODE_ENV:" + process.env.NODE_ENV);
        console.log("STATIC_ENV_PARAMS:" + STATIC_ENV_PARAMS.STATIC_ENV_PARAMS);
        return STATIC_ENV_PARAMS.STATIC_ENV_PARAMS[this.nodeEnv];
    }
}
ConfigurationService.instance = null;
exports.default = ConfigurationService;
//# sourceMappingURL=ConfigurationService.js.map