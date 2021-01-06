import { ChildProcess } from 'child_process';
import { Server, Socket } from 'net';
import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import EnvParam from '../../env/EnvParam';
import FileLoggerHandler from '../../FileLoggerHandler';
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
        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.getInstance().logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.getInstance().log("Forked Process starting");
        });

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
            ConsoleHandler.getInstance().error("Failed loading argv on forked process+" + error);
            process.exit(1);
        }
    }

    get process_UID(): number {
        return this.UID;
    }

    public async run() {

        const envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

        await this.modulesService.register_all_modules(db);
        await this.modulesService.configure_server_modules(null);

        BGThreadServerController.getInstance().server_ready = true;
        CronServerController.getInstance().server_ready = true;

        process.on('message', async (msg: IForkMessage) => {
            msg = APIControllerWrapper.getInstance().try_translate_vo_from_api(msg);
            ForkMessageController.getInstance().message_handler(msg, process);
        });

        // On prévient le process parent qu'on est ready
        ForkMessageController.getInstance().send(new AliveForkMessage());
    }
}