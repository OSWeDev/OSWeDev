/* istanbul ignore file: no usefull tests to build */

import IEnvParam from './IEnvParam';

export default class EnvParam implements IEnvParam {
    public APP_TITLE: string;
    public CONNECTION_STRING: string;
    public PORT: string;
    public ISDEV: boolean;
    public DEFAULT_LOCALE: string;
    public CODE_PAYS: string;
    public MSGPCK: boolean;
    public COMPRESS: boolean;
    public URL_RECOVERY_CHALLENGE: string;
    public URL_RECOVERY: string;
    public BASE_URL: string;
    public BLOCK_MAIL_DELIVERY: boolean;
    public MAIL_DELIVERY_WHITELIST: string;
    public BDD_OWNER: string;
    public NODE_VERBOSE: boolean;
    public ACTIVATE_LONG_JOHN: boolean;
    public MAX_POOL: number = 10;
    public SERVER_START_BOOSTER: boolean;
    public SERVER_ENCODING: string;
    public CONSOLE_LOG_TO_FILE: boolean = true;
    public DEBUG_FORKS: boolean = false;
    public START_MAINTENANCE_ACCEPTATION_CODE: string;
    public AUTO_END_MAINTENANCE_ON_START: boolean = true;
    public CODE_GOOGLE_ANALYTICS: string = null;
    public DEBUG_VARS: boolean = false;
    public DEBUG_INTERTHREADS_MESSAGES?: boolean = false;
    public DEBUG_IMPORTS?: boolean = false;
    public ACTIVATE_PWA: boolean = false;
    public RETRY_FAILED_FAST_TRACK_IMPORTS_WITH_NORMAL_IMPORTATION?: boolean = true;
}