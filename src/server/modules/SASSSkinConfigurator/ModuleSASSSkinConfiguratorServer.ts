import ModuleTableField from '../../../shared/modules/ModuleTableField';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';

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

    public async configure() {

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Dark'
        }, 'theme.dark_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Light'
        }, 'theme.light_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Primary'
        }, 'theme.primary_mode.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'NavBar'
        }, 'theme.navbar_fa_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Solid'
        }, 'theme.fa_solid_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Regular'
        }, 'theme.fa_regular_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Light'
        }, 'theme.fa_light_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'Thin'
        }, 'theme.fa_thin_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'DuoTone'
        }, 'theme.fa_duotone_mode.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            'fr-fr': 'SideBarMenu'
        }, 'theme.sidebarmenu_fa_mode.___LABEL___'));
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