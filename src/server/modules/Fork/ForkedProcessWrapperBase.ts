import pg_promise, { IDatabase } from 'pg-promise';
import { parentPort, threadId, workerData } from 'worker_threads';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModulesManager from '../../../shared/modules/ModulesManager';
import PerfReportController from '../../../shared/modules/PerfReport/PerfReportController';
import StatsController from '../../../shared/modules/Stats/StatsController';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import DBDisconnectionManager from '../../../shared/tools/DBDisconnectionManager';
import LocaleManager from '../../../shared/tools/LocaleManager';
import PromisePipeline from '../../../shared/tools/PromisePipeline/PromisePipeline';
import StackContextWrapper from '../../../shared/tools/StackContextWrapper';
import ThreadHandler from '../../../shared/tools/ThreadHandler';
import FileLoggerHandler from '../../FileLoggerHandler';
import I18nextInit from '../../I18nextInit';
import MemoryUsageStat from '../../MemoryUsageStat';
import StackContext from '../../StackContext';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import ServerAPIController from '../API/ServerAPIController';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import BGThreadServerController from '../BGThread/BGThreadServerController';
import BGThreadServerDataManager from '../BGThread/BGThreadServerDataManager';
import BgthreadPerfModuleNamesHolder from '../BGThread/BgthreadPerfModuleNamesHolder';
import RunsOnBgThreadDataController, { EVENT_NAME_ForkServerController_ready } from '../BGThread/annotations/RunsOnBGThread';
import RunsOnMainThreadDataController from '../BGThread/annotations/RunsOnMainThread';
import CronServerController from '../Cron/CronServerController';
import DBDisconnectionServerHandler from '../DAO/disconnection/DBDisconnectionServerHandler';
import ModuleServiceBase from '../ModuleServiceBase';
import PushDataServerController from '../PushData/PushDataServerController';
import AsyncHookPromiseWatchController from '../Stats/AsyncHookPromiseWatchController';
import StatsServerController from '../Stats/StatsServerController';
import ForkMessageController from './ForkMessageController';
import ForkedTasksController from './ForkedTasksController';
import IForkMessage from './interfaces/IForkMessage';
import AliveForkMessage from './messages/AliveForkMessage';
import LoadBalancedBGThreadBase from '../BGThread/LoadBalancedBGThreadBase';

export default abstract class ForkedProcessWrapperBase {

    public static instance: ForkedProcessWrapperBase;

    /**
     * Local thread cache -----
     */
    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    /**
     * ----- Local thread cache
     */

    public constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        StackContextWrapper.instance = StackContext;
        RunsOnMainThreadDataController.exec_self_on_main_process_and_return_value_method = ForkedTasksController.exec_self_on_main_process_and_return_value.bind(ForkedTasksController);
        RunsOnBgThreadDataController.exec_self_on_bgthread_and_return_value_method = ForkedTasksController.exec_self_on_bgthread_and_return_value.bind(ForkedTasksController);

        // On initialise le Controller pour les APIs
        APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

        ModulesManager.initialize();

        ForkedProcessWrapperBase.instance = this;

        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);
        PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS = ConfigurationService.node_configuration.debug_promise_pipeline_worker_stats;
        DBDisconnectionManager.instance = new DBDisconnectionServerHandler();
        EventsController.hook_stack_incompatible = ConfigurationService.node_configuration.activate_incompatible_stack_context ? StackContext.context_incompatible : null;
        EventsController.hook_stack_exec_as_server = StackContext.exec_as_server;

        ConsoleHandler.init('thread ' + threadId);
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Forked Process starting");
        }).catch((error) => ConsoleHandler.error(error));

        ModulesManager.isServerSide = true;
        PushDataServerController.initialize();

        // Les bgthreads peuvent être register et run - reste à définir lesquels
        BGThreadServerController.init();
        BGThreadServerController.register_bgthreads = true;
        BGThreadServerController.run_bgthreads = true;
        CronServerController.getInstance().register_crons = true;
        CronServerController.getInstance().run_crons = true;

        try {

            const argv = workerData;

            for (let i = 1; i < argv.length; i++) {
                const arg = argv[i];

                const splitted = arg.split(':');
                const type: string = splitted[0];
                const name: string = splitted[1];

                switch (type) {
                    case BGThreadServerDataManager.ForkedProcessType:
                        BGThreadServerDataManager.valid_bgthreads_names[name] = true;

                        // On gère le cas des bgthreads loadbalancés qui doivent aussi indiquer qu'ils gèrent le base_name
                        if (name.indexOf(LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX) >= 0) {
                            const base_name = name.split(LoadBalancedBGThreadBase.LOAD_BALANCED_BGTHREAD_NAME_SUFFIX)[0];
                            BGThreadServerDataManager.valid_bgthreads_names[base_name] = true;
                        }

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

        EventsController.emit_event(EventifyEventInstanceVO.new_event(EVENT_NAME_ForkServerController_ready));

        let thread_name = 'fork_';
        thread_name += Object.keys(BGThreadServerDataManager.valid_bgthreads_names).join('_').replace(/ \./g, '_');
        StatsController.THREAD_NAME = thread_name;
        StatsController.UNSTACK_THROTTLE_PARAM_NAME = 'StatsController.UNSTACK_THROTTLE_SERVER';
        StatsController.getInstance().UNSTACK_THROTTLE = 10000;
        StatsController.new_stats_handler = StatsServerController.new_stats_handler;
        StatsController.register_stat_COMPTEUR('ServerBase', 'START', '-');
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ForkedProcessWrapperBase {
        return ForkedProcessWrapperBase.instance;
    }

    public async run() {

        const envParam: EnvParam = ConfigurationService.node_configuration;

        const connectionString = envParam.connection_string;

        const pgp: pg_promise.IMain = pg_promise({});
        const db: IDatabase<any> = pgp(connectionString);

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ForkedProcessWrapperBase:register_all_modules:START');
        }
        await this.modulesService.init_db(db);
        await this.modulesService.register_all_modules();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ForkedProcessWrapperBase:register_all_modules:END');
        }

        // On préload les droits / users / groupes / deps pour accélérer le démarrage
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ForkedProcessWrapperBase:preload_access_rights:START');
        }
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ForkedProcessWrapperBase:preload_access_rights:END');
        }

        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ForkedProcessWrapperBase:configure_server_modules:START');
        }
        await this.modulesService.configure_server_modules(null);
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ForkedProcessWrapperBase:configure_server_modules:END');
        }

        await StatsController.init_params();

        // Derniers chargements
        await this.modulesService.late_server_modules_configurations(false);

        AsyncHookPromiseWatchController.init();

        if (ConfigurationService.node_configuration.debug_start_server) {
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
        LocaleManager.i18n = i18nextInit.i18next;
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ServerExpressController:i18nextInit:getALL_LOCALES:END');
        }

        BGThreadServerController.SERVER_READY = true;
        CronServerController.getInstance().server_ready = true;

        parentPort.on('message', (msg: IForkMessage) => {

            // On commence par créer l'info de perfReport event de réception de query
            msg['PERF_MODULE_UID'] = msg['PERF_MODULE_UID'] ? msg['PERF_MODULE_UID'] : ForkMessageController.PERF_MODULE_UID++;
            const perf_name = 'ForkMessageController.message_handler.' + msg.message_type + ' [' + msg['PERF_MODULE_UID'] + ']';
            const perf_line_name = msg.message_type;
            PerfReportController.add_event(
                BgthreadPerfModuleNamesHolder.EXPRESSJS_PERF_MODULE_NAME,
                perf_name,
                perf_line_name,
                perf_line_name,
                Dates.now_ms(),
                perf_name + '<br>' +
                ForkMessageController.to_perf_desc(msg)
            );

            // cf GPT4.5 : Les messages reçus par un worker Node.js sont traités en série, car ils sont traités par un seul thread/event-loop.
            // Donc on await surtout pas ici et on renvoie pas la promise et on renvoie asap la main au worker
            setTimeout(() => {

                msg = ForkMessageController.reapply_prototypes_on_msg(msg);

                ForkMessageController.message_handler(msg, parentPort);
            }, 1);
            // On rend la main au worker
        });

        // On prévient le process parent qu'on est ready
        await ForkMessageController.send(new AliveForkMessage(), parentPort);

        ThreadHandler.set_interval(
            'MemoryUsageStat.updateMemoryUsageStat',
            MemoryUsageStat.updateMemoryUsageStat,
            45000,
            'MemoryUsageStat.updateMemoryUsageStat',
            true,
        );
    }
}