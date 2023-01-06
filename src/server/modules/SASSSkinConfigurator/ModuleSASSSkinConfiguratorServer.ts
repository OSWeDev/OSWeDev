import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleSASSSkinConfiguratorServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleSASSSkinConfiguratorServer.instance) {
            ModuleSASSSkinConfiguratorServer.instance = new ModuleSASSSkinConfiguratorServer();
        }
        return ModuleSASSSkinConfiguratorServer.instance;
    }

    private static instance: ModuleSASSSkinConfiguratorServer = null;

    private constructor() {
        super(ModuleSASSSkinConfigurator.getInstance().name);
    }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleSASSSkinConfigurator.APINAME_get_sass_param_value, this.get_sass_param_value.bind(this));
    }

    public async get_sass_param_value(param_name: string) {
        return ModuleSASSSkinConfigurator.getInstance().getParamValue(param_name);
    }

    public async generate() {

        return new Promise(async (resolve, reject) => {

            try {

                for (let param_name in ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES) {
                    let default_value: string = ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES[param_name];

                    let param_value: string = await ModuleParams.getInstance().getParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.' + param_name);
                    if ((!param_value) && (!!default_value)) {
                        await ModuleParams.getInstance().setParamValue(ModuleSASSSkinConfigurator.MODULE_NAME + '.' + param_name, default_value);
                    } else {
                        ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES[param_name] = param_value;
                    }
                }

                let fileContent = this.getFileContent();
                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/vuejsclient/scss/generated/');
                await ModuleFileServer.getInstance().writeFile('./src/vuejsclient/scss/generated/skin-variables.scss', fileContent);
            } catch (error) {
                ConsoleHandler.error(error);
                reject(error);
                return;
            }
            resolve(null);
        });
    }

    private getFileContent() {
        let fileContent = "";

        fileContent += this.getSassVariablesDefinition(ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES);

        return fileContent;
    }

    private getSassVariablesDefinition(variables: { [param_name: string]: string }): string {

        let res = '';

        for (let param_name in variables) {
            let value: string = variables[param_name];

            res = res + this.getSassVariableDefinition(param_name, value) + '\n';
        }
        return res;
    }


    private getSassVariableDefinition(name: string, value: string): string {
        return "$" + name + ": " + (((value == '') || (typeof value == 'undefined')) ? 'null' : value) + ";";
    }
}