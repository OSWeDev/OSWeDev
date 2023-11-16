/* istanbul ignore file: really difficult tests : not willing to test this part. Maybe divide this in smaller chunks, but I don't see any usefull test */

import pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import ConfigurationService from '../server/env/ConfigurationService';
import EnvParam from '../server/env/EnvParam';
import FileLoggerHandler from '../server/FileLoggerHandler';
import ModuleAccessPolicyServer from '../server/modules/AccessPolicy/ModuleAccessPolicyServer';
import ModulesClientInitializationDatasGenerator from './ModulesClientInitializationDatasGenerator';
import ModuleServiceBase from '../server/modules/ModuleServiceBase';
import ModuleSASSSkinConfiguratorServer from '../server/modules/SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import DefaultTranslationsServerManager from '../server/modules/Translation/DefaultTranslationsServerManager';
import ModulesManager from '../shared/modules/ModulesManager';
import StatsController from '../shared/modules/Stats/StatsController';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import IGeneratorWorker from './IGeneratorWorker';
import AddMaintenanceCreationPolicy from './inits/postmodules/AddMaintenanceCreationPolicy';
import AddPwdCryptTrigger from './inits/postmodules/AddPwdCryptTrigger';
import ChangeResetPWDMailContent from './inits/postmodules/ChangeResetPWDMailContent';
import CHECKEnvParamsForMDPRecovery from './inits/postmodules/CHECKEnvParamsForMDPRecovery';
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
import Patch20210804Changebddvarsindexes from './patchs/postmodules/Patch20210804Changebddvarsindexes';
import Patch20210916SetParamPushData from './patchs/postmodules/Patch20210916SetParamPushData';
import Patch20211214ChangeVarTooltipTrads from './patchs/postmodules/Patch20211214ChangeVarTooltipTrads';
import Patch20220217ChangeLoginTrad from './patchs/postmodules/Patch20220217ChangeLoginTrad';
import Patch20220222MigrationCodesTradsDB from './patchs/postmodules/Patch20220222MigrationCodesTradsDB';
import Patch20220401SetParamPushData from './patchs/postmodules/Patch20220401SetParamPushData';
import Patch20220404UpdateDBBWidgetsDefaultSize from './patchs/postmodules/Patch20220404UpdateDBBWidgetsDefaultSize';
import Patch20220713ChangeVarCacheType1To0 from './patchs/postmodules/Patch20220713ChangeVarCacheType1To0';
import Patch20220725DashboardWidgetUpdate from './patchs/postmodules/Patch20220725DashboardWidgetUpdate';
import Patch20220809ChangeDbbTrad from './patchs/postmodules/Patch20220809ChangeDbbTrad';
import Patch20221216ChangeDbbTradsToIncludeLabels from './patchs/postmodules/Patch20221216ChangeDbbTradsToIncludeLabels';
import Patch20221217ParamBlockVos from './patchs/postmodules/Patch20221217ParamBlockVos';
import Patch20230428FavoriteWidgetsAreNotFilters from './patchs/postmodules/Patch20230428FavoriteWidgetsAreNotFilters';
import Patch20230517InitParamsStats from './patchs/postmodules/Patch20230517InitParamsStats';
import Patch20230519AddRightsFeedbackStateVO from './patchs/postmodules/Patch20230519AddRightsFeedbackStateVO';
import Patch20210803ChangeDIHDateType from './patchs/premodules/Patch20210803ChangeDIHDateType';
import Patch20210914ClearDashboardWidgets from './patchs/premodules/Patch20210914ClearDashboardWidgets';
import Patch20211004ChangeLang from './patchs/premodules/Patch20211004ChangeLang';
import Patch20220111LocalizeCRONDate from './patchs/premodules/Patch20220111LocalizeCRONDate';
import Patch20220222RemoveVorfieldreffrombdd from './patchs/premodules/Patch20220222RemoveVorfieldreffrombdd';
import Patch20220223Adduniqtranslationconstraint from './patchs/premodules/Patch20220223Adduniqtranslationconstraint';
import Patch20220822ChangeTypeRecurrCron from './patchs/premodules/Patch20220822ChangeTypeRecurrCron';
import Patch20230209AddColumnFormatDatesNombres from './patchs/premodules/Patch20230209AddColumnFormatDatesNombres';
import Patch20230512DeleteAllStats from './patchs/premodules/Patch20230512DeleteAllStats';
import Patch20230517DeleteAllStats from './patchs/premodules/Patch20230517DeleteAllStats';
import Patch20230428UpdateUserArchivedField from './patchs/premodules/Patch20230428UpdateUserArchivedField';
import VersionUpdater from './version_updater/VersionUpdater';
import PromisePipeline from '../shared/tools/PromisePipeline/PromisePipeline';
import Patch20230927AddSupervisionToCrons from './patchs/postmodules/Patch20230927AddSupervisionToCrons';
import Patch20230927AddAliveTimeoutToSomeBGThreads from './patchs/postmodules/Patch20230927AddAliveTimeoutToSomeBGThreads';
import Patch20231003ForceUnicityCodeText from './patchs/premodules/Patch20231003ForceUnicityCodeText';
import Patch20231010ForceUnicityVarConfName from './patchs/premodules/Patch20231010ForceUnicityVarConfName';
import Patch20231010ForceUnicityVarCacheConfVarID from './patchs/premodules/Patch20231010ForceUnicityVarCacheConfVarID';
import Patch20231010ForceUnicityParamName from './patchs/premodules/Patch20231010ForceUnicityParamName';
import Patch20231030FilePathUnique from './patchs/premodules/Patch20231030FilePathUnique';
import Patch20231030ImagePathUnique from './patchs/premodules/Patch20231030ImagePathUnique';
import Patch20231116AddUniqPhoneUserConstraint from './patchs/premodules/Patch20231116AddUniqPhoneUserConstraint';

export default abstract class GeneratorBase {

    public static getInstance(): GeneratorBase {
        return GeneratorBase.instance;
    }

    protected static instance: GeneratorBase;

    protected pre_modules_workers: IGeneratorWorker[];
    protected post_modules_workers: IGeneratorWorker[];
    protected init_pre_modules_workers: IGeneratorWorker[];
    protected init_post_modules_workers: IGeneratorWorker[];

    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam } = {};

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        // BLOCK Stats Generator side
        StatsController.ACTIVATED = false;

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

        this.pre_modules_workers = [
            Patch20231003ForceUnicityCodeText.getInstance(),
            Patch20231010ForceUnicityVarConfName.getInstance(),
            Patch20231010ForceUnicityVarCacheConfVarID.getInstance(),
            Patch20231010ForceUnicityParamName.getInstance(),
            Patch20210803ChangeDIHDateType.getInstance(),
            Patch20210914ClearDashboardWidgets.getInstance(),
            Patch20211004ChangeLang.getInstance(),
            Patch20220111LocalizeCRONDate.getInstance(),
            Patch20220222RemoveVorfieldreffrombdd.getInstance(),
            Patch20220223Adduniqtranslationconstraint.getInstance(),
            Patch20220822ChangeTypeRecurrCron.getInstance(),
            Patch20230209AddColumnFormatDatesNombres.getInstance(),
            Patch20230512DeleteAllStats.getInstance(),
            Patch20230517DeleteAllStats.getInstance(),
            Patch20230428UpdateUserArchivedField.getInstance(),
            Patch20231030FilePathUnique.getInstance(),
            Patch20231030ImagePathUnique.getInstance(),
            Patch20231116AddUniqPhoneUserConstraint.getInstance(),
        ];

        this.post_modules_workers = [
            Patch20210804Changebddvarsindexes.getInstance(),
            Patch20210916SetParamPushData.getInstance(),
            Patch20211214ChangeVarTooltipTrads.getInstance(),
            Patch20220217ChangeLoginTrad.getInstance(),
            Patch20220222MigrationCodesTradsDB.getInstance(),
            Patch20220404UpdateDBBWidgetsDefaultSize.getInstance(),
            Patch20220401SetParamPushData.getInstance(),
            Patch20220713ChangeVarCacheType1To0.getInstance(),
            Patch20220725DashboardWidgetUpdate.getInstance(),
            Patch20220809ChangeDbbTrad.getInstance(),
            Patch20221216ChangeDbbTradsToIncludeLabels.getInstance(),
            Patch20221217ParamBlockVos.getInstance(),
            Patch20230428FavoriteWidgetsAreNotFilters.getInstance(),
            Patch20230517InitParamsStats.getInstance(),
            Patch20230519AddRightsFeedbackStateVO.getInstance(),
            Patch20230927AddSupervisionToCrons.getInstance(),
            Patch20230927AddAliveTimeoutToSomeBGThreads.getInstance(),
        ];
    }

    public abstract getVersion();

    public async generate() {

        ConfigurationService.setEnvParams(this.STATIC_ENV_PARAMS);

        ConsoleHandler.init();
        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.log("Generator starting");
        }).catch((reason) => {
            ConsoleHandler.error("Generator prepare : " + reason);
        });

        const envParam: EnvParam = ConfigurationService.node_configuration;

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

        if (envParam.LAUNCH_INIT) {
            console.log("INIT pre modules initialization workers...");
            if (!!this.init_pre_modules_workers) {
                if (!await this.execute_workers(this.init_pre_modules_workers, db)) {
                    process.exit(0);
                    return;
                }
            }
            console.log("INIT pre modules initialization workers done.");
        }

        console.log("pre modules initialization workers...");
        if (!!this.pre_modules_workers) {
            if (!await this.execute_workers(this.pre_modules_workers, db)) {
                process.exit(0);
                return;
            }
        }
        console.log("pre modules initialization workers done.");

        await this.modulesService.register_all_modules(db, true);

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

        if (envParam.LAUNCH_INIT) {
            console.log("INIT post modules initialization workers...");
            if (!!this.init_post_modules_workers) {
                if (!await this.execute_workers(this.init_post_modules_workers, db)) {
                    process.exit(0);
                    return;
                }
            }
            console.log("INIT post modules initialization workers done.");
        }

        console.log("post modules initialization workers...");
        if (!!this.post_modules_workers) {
            if (!await this.execute_workers(this.post_modules_workers, db)) {
                process.exit(0);
                return;
            }
        }
        console.log("post modules initialization workers done.");

        // Derniers chargements
        await this.modulesService.late_server_modules_configurations(true);

        /**
         * On décale les trads après les post modules workers sinon les trads sont pas générées sur créa d'une lang en post worker => cas de la créa de nouveau projet
         */
        console.log("saveDefaultTranslations...");
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations(true);

        console.log("Code Generation DONE. Exiting ...");
        process.exit(0);
    }

    private async execute_workers(workers: IGeneratorWorker[], db: IDatabase<any>): Promise<boolean> {

        let workers_to_execute: { [id: number]: IGeneratorWorker } = {};
        let promises_pipeline = new PromisePipeline(ConfigurationService.node_configuration.MAX_POOL / 2, 'GeneratorBase.execute_workers');
        for (let i in workers) {
            let worker = workers[i];

            await promises_pipeline.push(async () => {
                // On check que le patch a pas encore été lancé
                try {
                    await db.one('select * from generator.workers where uid = $1;', [worker.uid]);
                    return;
                } catch (error) {
                    if ((!error) || ((error['message'] != "No data returned from the query.") && (error['code'] != '42P01'))) {
                        console.warn('Patch :' + worker.uid + ': Erreur... [' + error + '], on tente de lancer le patch.');
                    } else {
                        console.debug('Patch :' + worker.uid + ': aucune trace de lancement en base, lancement du patch...');
                    }
                    workers_to_execute[i] = worker;
                    // Pas d'info en base, le patch a pas été lancé, on le lance
                }
            });
        }
        await promises_pipeline.end();

        // Pour garder l'ordre initial, on itère sur les workers qui sont ordonnés et on check si il est dans workers_to_execute
        for (let i in workers) {
            let worker = workers_to_execute[i];
            if (!worker) {
                continue;
            }

            // Sinon on le lance et on stocke l'info en base
            try {
                await worker.work(db);

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
}