import * as pg_promise from 'pg-promise';
import EnvParam from '../server/env/EnvParam';
import ConfigurationService from '../server/env/ConfigurationService';
import { IDatabase } from 'pg-promise';
import ModulesClientInitializationDatasGenerator from '../server/modules/ModulesClientInitializationDatasGenerator';
import ModuleServiceBase from '../server/modules/ModuleServiceBase';
import ModulesManager from '../shared/modules/ModulesManager';
import ModuleSASSSkinConfiguratorServer from '../server/modules/SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';

export default abstract class GeneratorBase {

    public static getInstance(): GeneratorBase {
        return GeneratorBase.instance;
    }

    protected static instance: GeneratorBase = null;

    private modulesService: ModuleServiceBase;
    private STATIC_ENV_PARAMS: { [env: string]: EnvParam };

    constructor(modulesService: ModuleServiceBase, STATIC_ENV_PARAMS: { [env: string]: EnvParam }) {
        GeneratorBase.instance = this;
        this.modulesService = modulesService;
        this.STATIC_ENV_PARAMS = STATIC_ENV_PARAMS;
        ModulesManager.getInstance().isServerSide = true;
    }

    public async generate() {

        ConfigurationService.getInstance().setEnvParams(this.STATIC_ENV_PARAMS);
        const envParam: EnvParam = ConfigurationService.getInstance().getNodeConfiguration();

        let connectionString = envParam.CONNECTION_STRING;

        let pgp: pg_promise.IMain = pg_promise({});
        let db: IDatabase<any> = pgp(connectionString);

        await this.modulesService.register_all_modules(db);

        console.log("ModulesClientInitializationDatasGenerator.getInstance().generate()");
        await ModulesClientInitializationDatasGenerator.getInstance().generate();
        console.log("ModuleSASSSkinConfiguratorServer.getInstance().generate()");
        await ModuleSASSSkinConfiguratorServer.getInstance().generate();
        console.log("Code Generation DONE. Exiting ...");
        process.exit(0);
    }
}