/* istanbul ignore file: no usefull tests to build */

import EnvParam from './EnvParam';
import IEnvParam from './IEnvParam';


// ATTENTION subtilité sur ConfigurationService et STATIC_ENV_PARAMS, on
//  a besoin de ces fichiers en JS également pour la conf de webpack, donc il faut
//  recopier le JS à chaque compilation d'une nouvelle version de ces 2 fichiers.

export default class ConfigurationService {

    /**
     * Local thread cache -----
     */
    public static nodeInstall: boolean;
    public static nodeInstallFullSegments: boolean;

    /**
     * Just an helper for webpack conf
     */
    public static shared_params: any;
    public static node_configuration: EnvParam = null;
    /**
     * ----- Local thread cache
     */

    public static setEnvParams(STATIC_ENV_PARAMS: { [env: string]: IEnvParam }, force_init: boolean = true) {
        if (force_init) {
            ConfigurationService.init();
        }

        ConfigurationService.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.node_configuration = Object.assign(new EnvParam(), ConfigurationService.STATIC_ENV_PARAMS[ConfigurationService.nodeEnv]);
    }

    public static init() {
        ConfigurationService.nodeEnv = process.env.NODE_ENV || 'DEV';
        ConfigurationService.nodeInstall = (process.env.NODE_INSTALL == 'true');
        ConfigurationService.nodeInstallFullSegments = (process.env.NODE_INSTALL_FULL_SEGMENTS == 'true');
    }

    /**
     * Local thread cache -----
     */
    private static nodeEnv: string;
    private static STATIC_ENV_PARAMS: { [env: string]: IEnvParam };
    /**
     * ----- Local thread cache
     */
}