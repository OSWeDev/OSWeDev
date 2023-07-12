/* istanbul ignore file: no usefull tests to build */

import EnvParam from './EnvParam';
import IEnvParam from './IEnvParam';


export default class ConfigurationService {

    /**
     * Local thread cache -----
     */
    public static nodeInstall: boolean;
    public static nodeInstallFullSegments: boolean;

    public static shared_params: any;
    public static node_configuration: EnvParam = null;

    public static IS_UNIT_TEST_MODE: boolean = false;
    /**
     * ----- Local thread cache
     */

    public static setEnvParams(STATIC_ENV_PARAMS: { [env: string]: IEnvParam }) {
        if (!ConfigurationService.nodeEnv) {
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