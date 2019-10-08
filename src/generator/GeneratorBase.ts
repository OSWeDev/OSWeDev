import * as pg_promise from 'pg-promise';
import { IDatabase } from 'pg-promise';
import ConfigurationService from '../server/env/ConfigurationService';
import EnvParam from '../server/env/EnvParam';
import ModulesClientInitializationDatasGenerator from '../server/modules/ModulesClientInitializationDatasGenerator';
import ModuleServiceBase from '../server/modules/ModuleServiceBase';
import ModuleSASSSkinConfiguratorServer from '../server/modules/SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import DefaultTranslationsServerManager from '../server/modules/Translation/DefaultTranslationsServerManager';
import ModulesManager from '../shared/modules/ModulesManager';
import IGeneratorWorker from './IGeneratorWorker';
import ActivateDataImport from './patchs/ActivateDataImport';
import ActivateDataRender from './patchs/ActivateDataRender';
import ChangeTypeDatesNotificationVO from './patchs/ChangeTypeDatesNotificationVO';
import ChangeCronDateHeurePlanifiee from './patchs/ChangeCronDateHeurePlanifiee';
import Patch20191008ChangeDIHDateType from './patchs/Patch20191008ChangeDIHDateType';
import Patch20191008ChangeDILDateType from './patchs/Patch20191008ChangeDILDateType';
import Patch20191008SupprimerTacheReimport from './patchs/Patch20191008SupprimerTacheReimport';

export default abstract class GeneratorBase {

    public static getInstance(): GeneratorBase {
        return GeneratorBase.instance;
    }

    protected static instance: GeneratorBase = null;

    protected pre_modules_workers: IGeneratorWorker[] = null;
    protected post_modules_workers: IGeneratorWorker[] = null;

    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {
        GeneratorBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ModulesManager.getInstance().isServerSide = true;

        this.pre_modules_workers = [
            ActivateDataImport.getInstance(),
            ActivateDataRender.getInstance(),
            ChangeTypeDatesNotificationVO.getInstance(),
            ChangeCronDateHeurePlanifiee.getInstance(),
            Patch20191008ChangeDIHDateType.getInstance(),
            Patch20191008ChangeDILDateType.getInstance(),
            Patch20191008SupprimerTacheReimport.getInstance()
        ];

        this.post_modules_workers = [];
    }

    public async generate() {

        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);
        const envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

        console.log("pre modules initialization workers...");
        if (!!this.pre_modules_workers) {
            await this.execute_workers(this.pre_modules_workers, db);
        }
        console.log("pre modules initialization workers done.");

        await this.modulesService.register_all_modules(db);

        console.log("ModulesClientInitializationDatasGenerator.getInstance().generate()");
        await ModulesClientInitializationDatasGenerator.getInstance().generate();
        console.log("ModuleSASSSkinConfiguratorServer.getInstance().generate()");
        await ModuleSASSSkinConfiguratorServer.getInstance().generate();

        console.log("configure_server_modules...");
        await this.modulesService.configure_server_modules(null);
        console.log("saveDefaultTranslations...");
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations();

        console.log("post modules initialization workers...");
        if (!!this.post_modules_workers) {
            await this.execute_workers(this.post_modules_workers, db);
        }
        console.log("post modules initialization workers done.");

        console.log("Code Generation DONE. Exiting ...");
        process.exit(0);
    }

    private async execute_workers(workers: IGeneratorWorker[], db: IDatabase<any>) {
        for (let i in workers) {
            let worker = workers[i];

            // On check que le patch a pas encore été lancé
            try {
                await db.one('select * from generator.workers where uid = $1;', [worker.uid]);
                continue;
            } catch (error) {
                // Pas d'info en base, le patch a pas été lancé, on le lance
                console.warn('Patch :' + worker.uid + ': aucune trace de lancement en base, lancement du patch... [' + error + ']');
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
                return null;
            }
        }
    }
}