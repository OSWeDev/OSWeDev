import pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModulesManager from '../../../shared/modules/ModulesManager';
import StatsController from '../../../shared/modules/Stats/StatsController';
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
import StatsServerController from '../Stats/StatsServerController';
import ForkMessageController from './ForkMessageController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import DBDisconnectionManager from '../../../shared/tools/DBDisconnectionManager';
import DBDisconnectionServerHandler from '../DAO/disconnection/DBDisconnectionServerHandler';

export default abstract class ForkedProcessWrapperBase {

    // istanbul ignore next: nothing to test
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
        PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS = ConfigurationService.node_configuration.DEBUG_PROMISE_PIPELINE_WORKER_STATS;
        DBDisconnectionManager.instance = new DBDisconnectionServerHandler();

        ConsoleHandler.init();
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Forked Process starting");
        }).catch((error) => ConsoleHandler.error(error));

        ModulesManager.isServerSide = true;

        // Les bgthreads peuvent être register et run - reste à définir lesquels
        BGThreadServerController.init();
        BGThreadServerController.register_bgthreads = true;
        BGThreadServerController.run_bgthreads = true;
        CronServerController.getInstance().register_crons = true;
        CronServerController.getInstance().run_crons = true;

        try {

            this.UID = parseInt(process.argv[2]);

            for (let i = 3; i < process.argv.length; i++) {
                const arg = process.argv[i];

                const splitted = arg.split(':');
                const type: string = splitted[0];
                const name: string = splitted[1];

                switch (type) {
                    case BGThreadServerController.ForkedProcessType:
                        BGThreadServerController.valid_bgthreads_names[name] = true;
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

        let thread_name = 'fork_';
        thread_name += Object.keys(BGThreadServerController.valid_bgthreads_names).join('_').replace(/ \./g, '_');
        StatsController.THREAD_NAME = thread_name;
        StatsController.UNSTACK_THROTTLE_PARAM_NAME = 'StatsController.UNSTACK_THROTTLE_SERVER';
        StatsController.getInstance().UNSTACK_THROTTLE = 60000;
        StatsController.new_stats_handler = StatsServerController.new_stats_handler;
        StatsController.register_stat_COMPTEUR('ServerBase', 'START', '-');
    }

    get process_UID(): number {
        return this.UID;
    }

    public async run() {

        const envParam: EnvParam = ConfigurationService.node_configuration;

        const connectionString = envParam.CONNECTION_STRING;

        const pgp: pg_promise.IMain = pg_promise({});
        const db: IDatabase<any> = pgp(connectionString);

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

        await StatsController.init_params();

        // Derniers chargements
        await this.modulesService.late_server_modules_configurations(false);

        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:START');
        }
        // Avant de supprimer i18next... on corrige pour que ça fonctionne coté serveur aussi les locales
        const locales = await ModuleTranslation.getInstance().getALL_LOCALES();
        const locales_corrected = {};
        for (const lang in locales) {
            if (lang && lang.indexOf('-') >= 0) {
                const lang_parts = lang.split('-');
                if (lang_parts.length == 2) {
                    locales_corrected[lang_parts[0] + '-' + lang_parts[1].toUpperCase()] = locales[lang];
                }
            }
        }
        const i18nextInit = I18nextInit.getInstance(locales_corrected);
        LocaleManager.getInstance().i18n = i18nextInit.i18next;
        if (ConfigurationService.node_configuration.DEBUG_START_SERVER) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:END');
        }

        BGThreadServerController.SERVER_READY = true;
        CronServerController.getInstance().server_ready = true;

        process.on('message', async (msg: IForkMessage) => {
            msg = APIControllerWrapper.try_translate_vo_from_api(msg);
            await ForkMessageController.message_handler(msg, process);
        });

        // On prévient le process parent qu'on est ready
        await ForkMessageController.send(new AliveForkMessage());

        ThreadHandler.set_interval(MemoryUsageStat.updateMemoryUsageStat, 45000, 'MemoryUsageStat.updateMemoryUsageStat', true);
    }
}