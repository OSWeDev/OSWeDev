/* istanbul ignore file: no usefull tests to build */

import EnvParam from './EnvParam';
import IEnvParam from './IEnvParam';


// ATTENTION subtilité sur ConfigurationService et STATIC_ENV_PARAMS, on
//  a besoin de ces fichiers en JS également pour la conf de webpack, donc il faut
//  recopier le JS à chaque compilation d'une nouvelle version de ces 2 fichiers.

export default class ConfigurationService {

    public static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }
    private static instance: ConfigurationService = null;

    /**
     * Local thread cache -----
     */

    public nodeInstall: boolean;

    /**
     * Just an helper for webpack conf
     */
    public shared_params: any;

    private nodeEnv: string;
    private STATIC_ENV_PARAMS: { [env: string]: IEnvParam };
    /**
     * ----- Local thread cache
     */

    private constructor() {
        this.nodeEnv = process.env.NODE_ENV || 'DEV';
        this.nodeInstall = (process.env.NODE_INSTALL == 'true');
        ConfigurationService.instance = this;
    }

    public setEnvParams(STATIC_ENV_PARAMS: { [env: string]: IEnvParam }) {
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
    }

    public getNodeConfiguration<T extends IEnvParam>(): T {
        return Object.assign(new EnvParam(), this.STATIC_ENV_PARAMS[this.nodeEnv]) as T;
    }
}