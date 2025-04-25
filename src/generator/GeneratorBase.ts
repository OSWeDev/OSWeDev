/* istanbul ignore file: really difficult tests : not willing to test this part. Maybe divide this in smaller chunks, but I don't see any usefull test */

import pg_promise, { IDatabase } from 'pg-promise';
import FileLoggerHandler from '../server/FileLoggerHandler';
import StackContext from '../server/StackContext';
import ConfigurationService from '../server/env/ConfigurationService';
import EnvParam from '../server/env/EnvParam';
import ModuleAccessPolicyServer from '../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import IDatabaseHolder from '../server/modules/IDatabaseHolder';
import ModuleServiceBase from '../server/modules/ModuleServiceBase';
import ModuleSASSSkinConfiguratorServer from '../server/modules/SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import DefaultTranslationsServerManager from '../server/modules/Translation/DefaultTranslationsServerManager';
import VarsServerController from '../server/modules/Var/VarsServerController';
import EventsController from '../shared/modules/Eventify/EventsController';
import ModulesManager from '../shared/modules/ModulesManager';
import StatsController from '../shared/modules/Stats/StatsController';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import PromisePipeline from '../shared/tools/PromisePipeline/PromisePipeline';
import GeneratorPatchsListHandler from './GeneratorPatchsListHandler';
import IGeneratorWorker from './IGeneratorWorker';
import ModulesClientInitializationDatasGenerator from './ModulesClientInitializationDatasGenerator';
import AddMaintenanceCreationPolicy from './inits/postmodules/AddMaintenanceCreationPolicy';
import AddPwdCryptTrigger from './inits/postmodules/AddPwdCryptTrigger';
import CHECKEnvParamsForMDPRecovery from './inits/postmodules/CHECKEnvParamsForMDPRecovery';
import ChangeResetPWDMailContent from './inits/postmodules/ChangeResetPWDMailContent';
import CreateDefaultAdminAccountIfNone from './inits/postmodules/CreateDefaultAdminAccountIfNone';
import CreateDefaultLangFRIfNone from './inits/postmodules/CreateDefaultLangFRIfNone';
import CreateDefaultRobotUserAccount from './inits/postmodules/CreateDefaultRobotUserAccount';
import InitBaseImageFormats from './inits/postmodules/InitBaseImageFormats';
import InitFrontVarsPolicies from './inits/postmodules/InitFrontVarsPolicies';
import InitFrontVarsPolicies2 from './inits/postmodules/InitFrontVarsPolicies2';
import InitLoggedOnce from './inits/postmodules/InitLoggedOnce';
import InitPoliciesFeedback from './inits/postmodules/InitPoliciesFeedback';
import InitPoliciesINSERTORUPDATEUserLogs from './inits/postmodules/InitPoliciesINSERTORUPDATEUserLogs';
import InitTeamsWebhookForDailyReports from './inits/postmodules/InitTeamsWebhookForDailyReports';
import InitUserLogPolicies from './inits/postmodules/InitUserLogPolicies';
import MailParamsInit from './inits/postmodules/MailParamsInit';
import PresetExistingLangsChangeRights from './inits/postmodules/PresetExistingLangsChangeRights';
import ActivateDataImport from './inits/premodules/ActivateDataImport';
import ActivateDataRender from './inits/premodules/ActivateDataRender';
import CheckBasicSchemas from './inits/premodules/CheckBasicSchemas';
import CheckExtensions from './inits/premodules/CheckExtensions';
import VersionUpdater from './version_updater/VersionUpdater';
// import Patch20240409AddOseliaPromptForFeedback from './patchs/postmodules/Patch20240409AddOseliaPromptForFeedback';

export default abstract class GeneratorBase {

    protected static instance: GeneratorBase;

    protected init_pre_modules_workers: IGeneratorWorker[];
    protected init_post_modules_workers: IGeneratorWorker[];

    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam } = {};

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        // BLOCK Stats Generator side
        StatsController.ACTIVATED = false;

        EventsController.hook_stack_exec_as_server = StackContext.exec_as_server;
        ModulesManager.initialize();

        GeneratorBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ModulesManager.isServerSide = true;
        ModulesManager.isGenerator = true;

        this.init_pre_modules_workers = [
            CheckExtensions.getInstance(),
            CheckBasicSchemas.getInstance(),
            ActivateDataImport.getInstance(),
            ActivateDataRender.getInstance(),
        ];

        this.init_post_modules_workers = [
            AddPwdCryptTrigger.getInstance(),
            CreateDefaultLangFRIfNone.getInstance(),
            CreateDefaultAdminAccountIfNone.getInstance(),
            CHECKEnvParamsForMDPRecovery.getInstance(),
            CreateDefaultRobotUserAccount.getInstance(),
            InitUserLogPolicies.getInstance(),
            ChangeResetPWDMailContent.getInstance(),
            PresetExistingLangsChangeRights.getInstance(),
            MailParamsInit.getInstance(),
            InitBaseImageFormats.getInstance(),
            InitTeamsWebhookForDailyReports.getInstance(),
            InitPoliciesINSERTORUPDATEUserLogs.getInstance(),
            InitPoliciesFeedback.getInstance(),
            InitFrontVarsPolicies.getInstance(),
            InitFrontVarsPolicies2.getInstance(),
            AddMaintenanceCreationPolicy.getInstance(),
            InitLoggedOnce.getInstance()
        ];
    }

    get pre_modules_workers(): IGeneratorWorker[] {
        return GeneratorPatchsListHandler.pre_modules_workers;
    }

    get post_modules_workers(): IGeneratorWorker[] {
        return GeneratorPatchsListHandler.post_modules_workers;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): GeneratorBase {
        return GeneratorBase.instance;
    }

    public async generate() {

        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);
        PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS = ConfigurationService.node_configuration.debug_promise_pipeline_worker_stats;

        ConsoleHandler.init('generator');
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Generator starting");
        }).catch((reason) => {
            ConsoleHandler.error("Generator prepare : " + reason);
        });

        const envParam: EnvParam = ConfigurationService.node_configuration;

        const connectionString = envParam.connection_string;

        const pgp: pg_promise.IMain = pg_promise({});
        const db: IDatabase<any> = pgp(connectionString);
        await this.modulesService.init_db(db);

        // On va créer la structure de base de la BDD pour les modules
        await this.modulesService.create_modules_base_structure_in_db(db);

        if (envParam.launch_init) {
            console.log("INIT pre modules initialization workers...");
            if (this.init_pre_modules_workers) {
                if (!await this.execute_workers(this.init_pre_modules_workers, IDatabaseHolder.db)) {
                    process.exit(0);
                    return;
                }
            }
            console.log("INIT pre modules initialization workers done.");
        }

        console.log("pre modules initialization workers...");
        if (this.pre_modules_workers) {
            if (!await this.execute_workers(this.pre_modules_workers, IDatabaseHolder.db)) {
                process.exit(0);
                return;
            }
        }
        console.log("pre modules initialization workers done.");

        await this.modulesService.register_all_modules(true);

        // console.log("ParamsManager.reloadPreloadParams: ...");
        // await ParamsManager.reloadPreloadParams();
        // console.log("ParamsManager.reloadPreloadParams:OK");

        console.log("VersionUpdater: ...");
        await VersionUpdater.getInstance().update_version();
        console.log("VersionUpdater: OK!");

        console.log("ModuleSASSSkinConfiguratorServer.getInstance().generate()");
        await ModuleSASSSkinConfiguratorServer.getInstance().generate();
        console.log("ModulesClientInitializationDatasGenerator.getInstance().generate()");
        await ModulesClientInitializationDatasGenerator.getInstance().generate();

        // On préload les droits / users / groupes / deps pour accélérer le démarrage
        console.log("ModuleAccessPolicyServer.getInstance().preload_access_rights()");
        await ModuleAccessPolicyServer.getInstance().preload_access_rights();

        console.log("configure_server_modules...");
        await this.modulesService.configure_server_modules(null, true);

        if (envParam.launch_init) {
            console.log("INIT post modules initialization workers...");
            if (this.init_post_modules_workers) {
                if (!await this.execute_workers(this.init_post_modules_workers, IDatabaseHolder.db)) {
                    process.exit(0);
                    return;
                }
            }
            console.log("INIT post modules initialization workers done.");
        }

        console.log("post modules initialization workers...");
        if (this.post_modules_workers) {
            if (!await this.execute_workers(this.post_modules_workers, IDatabaseHolder.db)) {
                process.exit(0);
                return;
            }
        }
        console.log("post modules initialization workers done.");

        // Derniers chargements
        await this.modulesService.late_server_modules_configurations(true);

        // On va faire le ménage dans les varconf qui sont pas initialisés
        console.log("Clean varconf non initialisés...");

        /**
         * On nettoie les varconfs en bdd qui n'ont plus de controller associé dans l'application
         */
        await VarsServerController.clean_varconfs_without_controller();

        console.log("Clean varconf non initialisés DONE");

        /**
         * On décale les trads après les post modules workers sinon les trads sont pas générées sur créa d'une lang en post worker => cas de la créa de nouveau projet
         */
        console.log("saveDefaultTranslations...");
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations(true);

        console.log("Code Generation DONE. Exiting ...");
        process.exit(0);
    }

    private async execute_workers(workers: IGeneratorWorker[], db: IDatabase<any>): Promise<boolean> {

        const workers_to_execute: { [id: number]: IGeneratorWorker } = {};
        const promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2, 'GeneratorBase.execute_workers');
        for (const i in workers) {
            const worker = workers[i];

            await promises_pipeline.push(async () => {
                // On check que le patch a pas encore été lancé
                const record = await db.oneOrNone('select * from generator.workers where uid = $1;', [worker.uid]);

                if (record != null) {
                    return;
                }

                // if ((!error) || ((error['message'] != "No data returned from the query.") && (error['code'] != '42P01'))) {
                //     console.warn('Patch :' + worker.uid + ': Erreur... [' + error + '], on tente de lancer le patch.');
                // } else {
                ConsoleHandler.log('Patch :' + worker.uid + ': aucune trace de lancement en base, lancement du patch...');
                // }
                workers_to_execute[i] = worker;
                // Pas d'info en base, le patch a pas été lancé, on le lance
                // }
            });
        }
        await promises_pipeline.end();

        // Pour garder l'ordre initial, on itère sur les workers qui sont ordonnés et on check si il est dans workers_to_execute
        for (const i in workers) {
            const worker = workers_to_execute[i];
            if (!worker) {
                continue;
            }

            // Sinon on le lance et on stocke l'info en base
            try {
                console.log('Patch :' + worker.uid + ': Exécution du patch... EN COURS');
                await worker.work(db);
                console.log('Patch :' + worker.uid + ': Exécution du patch... OK');

                await db.none('CREATE SCHEMA IF NOT EXISTS generator;');
                await db.none('CREATE TABLE IF NOT EXISTS generator.workers (' +
                    'id bigserial NOT NULL,' +
                    'uid text, CONSTRAINT workers_pkey PRIMARY KEY(id));');
                await db.none('insert into generator.workers (uid) values ($1);', [worker.uid]);
            } catch (error) {
                console.error('Patch :' + worker.uid + ': Impossible d\'exécuter le patch : ' + error + '. Arret du générateur.');
                return false;
            }
        }

        return true;
    }

    public abstract getVersion();
}