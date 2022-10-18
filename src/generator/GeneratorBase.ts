/* istanbul ignore file: really difficult tests : not willing to test this part. Maybe divide this in smaller chunks, but I don't see any usefull test */

import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import ConfigurationService from '../server/env/ConfigurationService';
import EnvParam from '../server/env/EnvParam';
import FileLoggerHandler from '../server/FileLoggerHandler';
import ModulesClientInitializationDatasGenerator from '../server/modules/ModulesClientInitializationDatasGenerator';
import ModuleServiceBase from '../server/modules/ModuleServiceBase';
import ModuleSASSSkinConfiguratorServer from '../server/modules/SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import DefaultTranslationsServerManager from '../server/modules/Translation/DefaultTranslationsServerManager';
import ModulesManager from '../shared/modules/ModulesManager';
import ConsoleHandler from '../shared/tools/ConsoleHandler';
import IGeneratorWorker from './IGeneratorWorker';
import VendorBuilder from './vendor_builder/VendorBuilder';
import Patch20210803ChangeDIHDateType from './patchs/premodules/Patch20210803ChangeDIHDateType';
import Patch20210804Changebddvarsindexes from './patchs/postmodules/Patch20210804Changebddvarsindexes';
import Patch20210914ClearDashboardWidgets from './patchs/premodules/Patch20210914ClearDashboardWidgets';
import Patch20211004ChangeLang from './patchs/premodules/Patch20211004ChangeLang';
import Patch20220111LocalizeCRONDate from './patchs/premodules/Patch20220111LocalizeCRONDate';
import Patch20210916SetParamPushData from './patchs/postmodules/Patch20210916SetParamPushData';
import Patch20211214ChangeVarTooltipTrads from './patchs/postmodules/Patch20211214ChangeVarTooltipTrads';
import Patch20220217ChangeLoginTrad from './patchs/postmodules/Patch20220217ChangeLoginTrad';
import Patch20220222MigrationCodesTradsDB from './patchs/postmodules/Patch20220222MigrationCodesTradsDB';
import Patch20220222RemoveVorfieldreffrombdd from './patchs/premodules/Patch20220222RemoveVorfieldreffrombdd';
import Patch20220223Adduniqtranslationconstraint from './patchs/premodules/Patch20220223Adduniqtranslationconstraint';
import Patch20220401SetParamPushData from './patchs/postmodules/Patch20220401SetParamPushData';
import Patch20220725DashboardWidgetUpdate from './patchs/postmodules/Patch20220725DashboardWidgetUpdate';
import Patch20220809ChangeDbbTrad from './patchs/postmodules/Patch20220809ChangeDbbTrad';
import VersionUpdater from './version_updater/VersionUpdater';
import Patch20220404UpdateDBBWidgetsDefaultSize from './patchs/postmodules/Patch20220404UpdateDBBWidgetsDefaultSize';
import Patch20220713ChangeVarCacheType1To0 from './patchs/postmodules/Patch20220713ChangeVarCacheType1To0';
import Patch20220822ChangeTypeRecurrCron from './patchs/premodules/Patch20220822ChangeTypeRecurrCron';

export default abstract class GeneratorBase {

    public static getInstance(): GeneratorBase {
        return GeneratorBase.instance;
    }

    protected static instance: GeneratorBase;

    protected pre_modules_workers: IGeneratorWorker[];
    protected post_modules_workers: IGeneratorWorker[];

    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam } = {};

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {

        GeneratorBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ModulesManager.getInstance().isServerSide = true;

        this.pre_modules_workers = [
            Patch20210803ChangeDIHDateType.getInstance(),
            Patch20210914ClearDashboardWidgets.getInstance(),
            Patch20211004ChangeLang.getInstance(),
            Patch20220111LocalizeCRONDate.getInstance(),
            Patch20220222RemoveVorfieldreffrombdd.getInstance(),
            Patch20220223Adduniqtranslationconstraint.getInstance(),
            Patch20220822ChangeTypeRecurrCron.getInstance(),
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
        ];
    }

    public abstract getVersion();

    public async generate() {

        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);

        /**
         * Le générateur est fait pour faire les checks de format en bdd, donc on force ce paramètre
         *  par défaut il est actif sur le lancement du server pour gagner du temps
         */
        ConfigurationService.getInstance().node_configuration.IGNORE_ALL_DATABASE_FORMAT_CHECKS = false;

        FileLoggerHandler.getInstance().prepare().then(() => {
            ConsoleHandler.getInstance().logger_handler = FileLoggerHandler.getInstance();
            ConsoleHandler.getInstance().log("Generator starting");
        }).catch((reason) => {
            ConsoleHandler.getInstance().error("Generator prepare : " + reason);
        });

        const envParam: EnvParam = ConfigurationService.getInstance().node_configuration;

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

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

        console.log("configure_server_modules...");
        await this.modulesService.configure_server_modules(null);

        console.log("post modules initialization workers...");
        if (!!this.post_modules_workers) {
            if (!await this.execute_workers(this.post_modules_workers, db)) {
                process.exit(0);
                return;
            }
        }
        console.log("post modules initialization workers done.");

        /**
         * On décale les trads après les post modules workers sinon les trads sont pas générées sur créa d'une lang en post worker => cas de la créa de nouveau projet
         */
        console.log("saveDefaultTranslations...");
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations(true);

        console.log("Generate Vendor: ...");
        await VendorBuilder.getInstance().generate_vendor();
        console.log("Generate Vendor: OK!");

        console.log("Code Generation DONE. Exiting ...");
        process.exit(0);
    }

    private async execute_workers(workers: IGeneratorWorker[], db: IDatabase<any>): Promise<boolean> {
        for (let i in workers) {
            let worker = workers[i];

            // On check que le patch a pas encore été lancé
            try {
                await db.one('select * from generator.workers where uid = $1;', [worker.uid]);
                continue;
            } catch (error) {
                if ((!error) || ((error['message'] != "No data returned from the query.") && (error['code'] != '42P01'))) {

                    console.warn('Patch :' + worker.uid + ': Erreur... [' + error + '], on tente de lancer le patch.');
                } else {
                    console.debug('Patch :' + worker.uid + ': aucune trace de lancement en base, lancement du patch...');
                }
                // Pas d'info en base, le patch a pas été lancé, on le lance
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