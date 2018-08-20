import ModuleServerBase from '../ModuleServerBase';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import * as fs from 'fs';
import FileHandler from '../../tools/FileHandler';
import ModuleTableField from '../../../shared/modules/ModuleTableField';

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

                if (!await FileHandler.getInstance().dirExists('./src/')) {
                    await FileHandler.getInstance().dirCreate('./src/');
                }
                if (!await FileHandler.getInstance().dirExists('./src/vuejsclient/')) {
                    await FileHandler.getInstance().dirCreate('./src/vuejsclient/');
                }
                if (!await FileHandler.getInstance().dirExists('./src/vuejsclient/scss/')) {
                    await FileHandler.getInstance().dirCreate('./src/vuejsclient/scss/');
                }
                if (!await FileHandler.getInstance().dirExists('./src/vuejsclient/scss/generated/')) {
                    await FileHandler.getInstance().dirCreate('./src/vuejsclient/scss/generated/');
                }
                await FileHandler.getInstance().writeFile('./src/vuejsclient/scss/generated/skin-variables.scss', fileContent);
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
        return "$" + name + ": " + value + ";";
    }
}