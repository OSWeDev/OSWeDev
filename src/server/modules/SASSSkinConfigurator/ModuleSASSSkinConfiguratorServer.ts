import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';

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
                ConsoleHandler.getInstance().error(error);
                reject(error);
            } finally {
                resolve();
            }
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