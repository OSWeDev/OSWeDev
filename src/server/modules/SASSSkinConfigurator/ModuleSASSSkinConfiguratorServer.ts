import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
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

    public async generate() {

        return new Promise(async (resolve, reject) => {

            let fileContent = this.getFileContent();
            try {

                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/vuejsclient/scss/generated/');
                await ModuleFileServer.getInstance().writeFile('./src/vuejsclient/scss/generated/skin-variables.scss', fileContent);
            } catch (error) {
                reject(error);
            } finally {
                resolve();
            }
        });
    }

    private getFileContent() {
        let fileContent = "";

        fileContent += this.getSassVariablesDefinition(ModuleSASSSkinConfigurator.getInstance().fields);

        return fileContent;
    }

    private getSassVariablesDefinition(variables: ModuleTableField<string>[]): string {

        let res = '';

        for (let i in variables) {
            let variable: ModuleTableField<string> = variables[i];

            res = res + this.getSassVariableDefinition(variable.field_id, variable.field_value) + '\n';
        }
        return res;
    }


    private getSassVariableDefinition(name: string, value: string): string {
        return "$" + name + ": " + (((value == '') || (typeof value == 'undefined')) ? 'null' : value) + ";";
    }
}