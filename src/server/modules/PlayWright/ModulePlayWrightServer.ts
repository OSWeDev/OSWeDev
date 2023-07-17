
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModulePlayWright from '../../../shared/modules/PlayWright/ModulePlayWright';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleServerBase from '../ModuleServerBase';
import PlayWrightServerController from './PlayWrightServerController';

export default class ModulePlayWrightServer extends ModuleServerBase {

    public static getInstance(): ModulePlayWrightServer {
        if (!ModulePlayWrightServer.instance) {
            ModulePlayWrightServer.instance = new ModulePlayWrightServer();
        }
        return ModulePlayWrightServer.instance;
    }

    private static instance: ModulePlayWrightServer = null;

    private constructor() {
        super(ModulePlayWright.getInstance().name);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_setup_and_login, this.setup_and_login.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_global_setup, this.global_setup.bind(this));
        // APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_global_teardown, this.global_teardown.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_after_all, this.after_all.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_after_each, this.after_each.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_before_all, this.before_all.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModulePlayWright.APINAME_before_each, this.before_each.bind(this));
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
    }

    protected async setup_and_login(access_code: string): Promise<string> {

        if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
            ConsoleHandler.error('ModulePlayWrightServer setup_and_login: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
            return;
        }

        return await PlayWrightServerController.getInstance().setup_and_login();
    }

    // private async global_setup(access_code: string) {

    //     if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
    //         ConsoleHandler.error('ModulePlayWrightServer global_setup: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
    //         return;
    //     }

    //     await PlayWrightServerController.getInstance().global_setup();
    // }
    // private async global_teardown(access_code: string) {

    //     if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
    //         ConsoleHandler.error('ModulePlayWrightServer global_teardown: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
    //         return;
    //     }

    //     await PlayWrightServerController.getInstance().global_teardown();
    // }

    private async after_all(access_code: string) {

        if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
            ConsoleHandler.error('ModulePlayWrightServer after_all: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
            return;
        }

        await PlayWrightServerController.getInstance().after_all();
    }

    private async after_each(access_code: string, test_title: string) {

        if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
            ConsoleHandler.error('ModulePlayWrightServer after_each: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
            return;
        }

        await PlayWrightServerController.getInstance().after_each(test_title);
    }

    private async before_all(access_code: string, test_title: string) {

        if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
            ConsoleHandler.error('ModulePlayWrightServer before_all: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
            return;
        }

        await PlayWrightServerController.getInstance().before_all();
    }

    private async before_each(access_code: string, test_title: string) {

        if (!access_code || (access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE)) {
            ConsoleHandler.error('ModulePlayWrightServer before_each: access_code != ConfigurationService.node_configuration.START_MAINTENANCE_ACCEPTATION_CODE');
            return;
        }

        await PlayWrightServerController.getInstance().before_each(test_title);
    }
}