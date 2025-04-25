import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleSASSSkinConfiguratorServer extends ModuleServerBase {

    private static instance: ModuleSASSSkinConfiguratorServer = null;

    private in_generating: boolean = false;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSASSSkinConfigurator.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSASSSkinConfiguratorServer.instance) {
            ModuleSASSSkinConfiguratorServer.instance = new ModuleSASSSkinConfiguratorServer();
        }
        return ModuleSASSSkinConfiguratorServer.instance;
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        // let postUpdateTrigger: DAOPostUpdateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        // postUpdateTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handlePostUpdateParam);

        // let postCreateTrigger: DAOPostCreateTriggerHook = ModuleTriggerServer.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        // postCreateTrigger.registerHandler(ParamVO.API_TYPE_ID, this, this.handlePostCreateParam);

    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleSASSSkinConfigurator.APINAME_get_sass_param_value, this.get_sass_param_value.bind(this));
    }

    public async get_sass_param_value(param_name: string) {
        return ModuleSASSSkinConfigurator['CACHE_' + param_name];
    }

    public async generate() {
        if (this.in_generating) {
            return;
        }

        return new Promise(async (resolve, reject) => {

            try {
                // this.in_generating = true;

                // let max = ConfigurationService.node_configuration.MAX_POOL / 2;
                // let promise_pipeline = new PromisePipeline(max, 'ModuleSASSSkinConfiguratorServer.generate');
                // for (let param_name in ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES) {
                //     let default_value: string = ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES[param_name];

                //     await promise_pipeline.push(async () => {
                //         let param_value: string = await ParamsServerController.getParamValueAsString(ModuleSASSSkinConfigurator.MODULE_NAME + '.' + param_name);
                //         if ((!param_value) && (!!default_value)) {
                //             await ParamsServerController.setParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.' + param_name, default_value);
                //         } else {
                //             ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES[param_name] = param_value;
                //         }
                //     });
                // }

                // await promise_pipeline.end();

                const fileContent = this.getFileContent();
                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/vuejsclient/scss/generated/');
                await ModuleFileServer.getInstance().writeFile('./src/vuejsclient/scss/generated/skin-variables.scss', fileContent);
            } catch (error) {
                ConsoleHandler.error(error);
                reject(error);
                this.in_generating = false;
                return;
            }
            this.in_generating = false;
            resolve(null);
        });
    }

    private getFileContent() {
        let fileContent = "";

        fileContent += this.getSassVariablesDefinition();

        return fileContent;
    }

    private getSassVariablesDefinition(): string {

        let res = '';

        for (const param_name of ModuleSASSSkinConfigurator.SASS_PARAMS_NAMES) {
            const value: string = ModuleSASSSkinConfigurator['CACHE_' + param_name];

            res = res + this.getSassVariableDefinition(param_name, value) + '\n';
        }
        return res;
    }


    private getSassVariableDefinition(name: string, value: string): string {
        let res: string = "$" + name + ": ";

        if (((value == '') || (typeof value == 'undefined'))) {
            res += "''";
        } else {
            if (value.startsWith('"') || value.startsWith("'") || (name.indexOf('_url') < 0)) {
                res += value;
            } else {
                res += "'" + value + "'";
            }
        }

        res += ";";

        return res;
    }

    // private async handlePostUpdateParam(update: DAOUpdateVOHolder<ParamVO>) {
    //     await this.handlePostCreateParam(update.post_update_vo);
    // }

    // private async handlePostCreateParam(vo: ParamVO) {
    //     let name: string = vo.name.replace(ModuleSASSSkinConfigurator.MODULE_NAME + '.', '');

    //     if (!ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES[name]) {
    //         return;
    //     }

    // if(!this.in_generating) {
    //     //     await this.generate();
    // }
    // }
}