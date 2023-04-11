import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import LocaleManager from '../../../shared/tools/LocaleManager';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import FileLoggerHandler from '../../FileLoggerHandler';
import I18nextInit from '../../I18nextInit';
import MemoryUsageStat from '../../MemoryUsageStat';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ServerAPIController from '../API/ServerAPIController';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import CronServerController from '../Cron/CronServerController';
import ModuleServiceBase from '../ModuleServiceBase';
import ForkMessageController from './ForkMessageController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';

export default abstract class ForkedProcessWrapperBase {

    public static getInstance(): ForkedProcessWrapperBase {
        return ForkedProcessWrapperBase.instance;
    }

    protected static instance: ForkedProcessWrapperBase;

    /**
     * Local thread cache -----
     */
    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    private UID: number;
    /**
     * ----- Local thread cache
     */

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        // On initialise le Controller pour les APIs
        APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

        ForkedProcessWrapperBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);

        ConsoleHandler.init();
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Forked Process starting");
        }).catch((error) => ConsoleHandler.error(error));

        ModulesManager.getInstance().isServerSide = true;

        // Les bgthreads peuvent être register et run - reste à définir lesquels
        BGThreadServerController.getInstance().register_bgthreads = true;
        BGThreadServerController.getInstance().run_bgthreads = true;
        CronServerController.getInstance().register_crons = true;
        CronServerController.getInstance().run_crons = true;

        try {

            this.UID = parseInt(process.argv[2]);

            for (let i = 3; i < process.argv.length; i++) {
                let arg = process.argv[i];

                let splitted = arg.split(':');
                let type: string = splitted[0];
                let name: string = splitted[1];

                switch (type) {
                    case BGThreadServerController.ForkedProcessType:
                        BGThreadServerController.getInstance().valid_bgthreads_names[name] = true;
                        break;
                    case CronServerController.ForkedProcessType:
                        CronServerController.getInstance().valid_crons_names[name] = true;
                        break;
                }
            }
        } catch (error) {
            ConsoleHandler.error("Failed loading argv on forked process+" + error);
            process.exit(1);
        }
    }

    get process_UID(): number {
        return this.UID;
    }

    public async run() {

        const envParam: EnvParam = ConfigurationService.node_configuration;

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ForkedProcessWrapperBase:register_all_modules:START');
        }
        await this.modulesService.register_all_modules(db);
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ForkedProcessWrapperBase:register_all_modules:END');
        }

        // On préload les droits / users / groupes / deps pour accélérer le démarrage
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ForkedProcessWrapperBase:preload_access_rights:START');
        }
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ForkedProcessWrapperBase:preload_access_rights:END');
        }

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ForkedProcessWrapperBase:configure_server_modules:START');
        }
        await this.modulesService.configure_server_modules(null);
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ForkedProcessWrapperBase:configure_server_modules:END');
        }

        // Derniers chargements
        await this.modulesService.late_server_modules_configurations();

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:START');
        }
        // Avant de supprimer i18next... on corrige pour que ça fonctionne coté serveur aussi les locales
        let locales = await ModuleTranslation.getInstance().getALL_LOCALES();
        let locales_corrected = {};
        for (let lang in locales) {
            if (lang && lang.indexOf('-') >= 0) {
                let lang_parts = lang.split('-');
                if (lang_parts.length == 2) {
                    locales_corrected[lang_parts[0] + '-' + lang_parts[1].toUpperCase()] = locales[lang];
                }
            }
        }
        let i18nextInit = I18nextInit.getInstance(locales_corrected);
        LocaleManager.getInstance().i18n = i18nextInit.i18next;
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:END');
        }

        BGThreadServerController.SERVER_READY = true;
        CronServerController.getInstance().server_ready = true;

        process.on('message', async (msg: IForkMessage) => {
            msg = APIControllerWrapper.try_translate_vo_from_api(msg);
            await ForkMessageController.getInstance().message_handler(msg, process);
        });

        // On prévient le process parent qu'on est ready
        await ForkMessageController.getInstance().send(new AliveForkMessage());

        await MemoryUsageStat.updateMemoryUsageStat();
    }
}