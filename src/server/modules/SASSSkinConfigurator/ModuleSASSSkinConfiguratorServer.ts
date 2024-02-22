import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleFileServer from '../File/ModuleFileServer';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleSASSSkinConfiguratorServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleSASSSkinConfiguratorServer.instance) {
            ModuleSASSSkinConfiguratorServer.instance = new ModuleSASSSkinConfiguratorServer();
        }
        return ModuleSASSSkinConfiguratorServer.instance;
    }

    private static instance: ModuleSASSSkinConfiguratorServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleSASSSkinConfigurator.getInstance().name);
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

        return new Promise(async (resolve, reject) => {

            try {
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

        fileContent += this.getSassVariablesDefinition();

        return fileContent;
    }

    private getSassVariablesDefinition(): string {

        let res = '';

        for (let param_name of ModuleSASSSkinConfigurator.SASS_PARAMS_NAMES) {
            let value: string = ModuleSASSSkinConfigurator['CACHE_' + param_name];

            res = res + this.getSassVariableDefinition(param_name, value) + '\n';
        }
        return res;
    }


    private getSassVariableDefinition(name: string, value: string): string {
        return "$" + name + ": " + (((value == '') || (typeof value == 'undefined')) ? 'null' : value) + ";";
    }

    // private async handlePostUpdateParam(update: DAOUpdateVOHolder<ParamVO>) {
    //     await this.handlePostCreateParam(update.post_update_vo);
    // }

    // private async handlePostCreateParam(vo: ParamVO) {
    //     let name: string = vo.name.replace(ModuleSASSSkinConfigurator.MODULE_NAME + '.', '');

    //     if (!ModuleSASSSkinConfigurator.SASS_PARAMS_VALUES[name]) {
    //         return;
    //     }

    //     await this.generate();
    // }
}