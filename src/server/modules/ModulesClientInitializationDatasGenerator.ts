import Module from "../../shared/modules/Module";
import ConfigurationService from '../env/ConfigurationService';
import ModuleFileServer from './File/ModuleFileServer';
import ModuleServiceBase from "./ModuleServiceBase";

export default class ModulesClientInitializationDatasGenerator {

    public static getInstance(): ModulesClientInitializationDatasGenerator {
        if (!ModulesClientInitializationDatasGenerator.instance) {
            ModulesClientInitializationDatasGenerator.instance = new ModulesClientInitializationDatasGenerator();
        }
        return ModulesClientInitializationDatasGenerator.instance;
    }
    private static instance: ModulesClientInitializationDatasGenerator = null;

    private constructor() {
    }


    public async generate() {

        return new Promise(async (resolve, reject) => {

            // On veut générer un fichier avec les imports des modules actifs uniquement, et sur ces modules on veut appeler le getInstance()
            //  et on veut aussi initialiser les params
            let fileContent_admin = this.getFileContent('Admin');
            let fileContent_client = this.getFileContent('Client');
            let fileContent_login = this.getFileContent('Login');
            let fileContent_test = this.getFileContent('Test');

            // 'export default ModulesClientInitializationDatas = ' + JSON.stringify(this.GM.get_modules_infos(req.params.env)) + ';';
            try {

                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/client/ts/generated/');
                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/admin/ts/generated/');
                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/login/ts/generated/');
                await ModuleFileServer.getInstance().makeSureThisFolderExists('./src/test/ts/generated/');
                await ModuleFileServer.getInstance().writeFile('./src/client/ts/generated/InitializeClientModulesDatas.ts', fileContent_client);
                await ModuleFileServer.getInstance().writeFile('./src/admin/ts/generated/InitializeAdminModulesDatas.ts', fileContent_admin);
                await ModuleFileServer.getInstance().writeFile('./src/login/ts/generated/InitializeLoginModulesDatas.ts', fileContent_login);
                await ModuleFileServer.getInstance().writeFile('./src/test/ts/generated/InitializeTestModulesDatas.ts', fileContent_test);
            } catch (error) {
                console.error(error);
                reject(error);
            } finally {
                resolve();
            }
        });
    }

    private getFileContent(target: string) {
        let fileContent = "";

        fileContent += this.generateModulesCode(this.generateModuleImport, target);

        fileContent += "import EnvHandler from 'oswedev/dist/shared/tools/EnvHandler';\n";
        fileContent += "import APIControllerWrapper from 'oswedev/dist/shared/modules/API/APIControllerWrapper';\n";

        if (target != 'Test') {
            fileContent += "import ClientAPIController from 'oswedev/dist/vuejsclient/ts/modules/API/ClientAPIController';\n";
            fileContent += "import AjaxCacheClientController from 'oswedev/dist/vuejsclient/ts/modules/AjaxCache/AjaxCacheClientController';\n";
        } else {
            fileContent += "import ServerAPIController from 'oswedev/dist/server/modules/API/ServerAPIController';\n";
        }

        fileContent += "\n";
        fileContent += "export default async function Initialize" + target + "ModulesDatas() {\n";

        // On initialise le Controller pour les APIs
        if (target != 'Test') {
            fileContent += "    APIControllerWrapper.API_CONTROLLER = ClientAPIController.getInstance();\n";
        } else {
            fileContent += "    APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();\n";
        }

        // Initialiser directement l'env param
        fileContent += "    EnvHandler.getInstance().NODE_VERBOSE = " + ((!!ConfigurationService.getInstance().getNodeConfiguration().NODE_VERBOSE) ? 'true' : 'false') + ';\n';
        fileContent += "    EnvHandler.getInstance().IS_DEV = " + ((!!ConfigurationService.getInstance().getNodeConfiguration().ISDEV) ? 'true' : 'false') + ';\n';
        fileContent += "    EnvHandler.getInstance().MSGPCK = " + ((!!ConfigurationService.getInstance().getNodeConfiguration().MSGPCK) ? 'true' : 'false') + ';\n';
        fileContent += "    EnvHandler.getInstance().COMPRESS = " + ((!!ConfigurationService.getInstance().getNodeConfiguration().COMPRESS) ? 'true' : 'false') + ';\n';
        fileContent += "    EnvHandler.getInstance().BASE_URL = '" + ConfigurationService.getInstance().getNodeConfiguration().BASE_URL + "';\n";
        fileContent += "    EnvHandler.getInstance().CODE_GOOGLE_ANALYTICS = '" + ConfigurationService.getInstance().getNodeConfiguration().CODE_GOOGLE_ANALYTICS + "';\n";

        fileContent += this.generateModulesCode(this.generateModuleData, target);

        if (target != 'Test') {
            fileContent += "    await AjaxCacheClientController.getInstance().getCSRFToken();";
        }
        fileContent += "    let promises = [];";

        fileContent += this.generateModulesCode(this.generateModuleAsyncInitialisation, target);
        fileContent += '    await Promise.all(promises);';
        fileContent += "}";

        return fileContent;
    }

    private generateModulesCode(hook: (module: Module, target: string) => {}, target: string) {
        let fileContent = "";

        let modules: Module[] = [];
        switch (target) {
            case 'Client':
            case 'Admin':
                modules = ModuleServiceBase.getInstance().sharedModules;
                break;
            case 'Login':
                modules = ModuleServiceBase.getInstance().loginModules;
                break;
            case 'Test':
                // modules =[];
                // for (let i in ModulesManager.getInstance().modules_by_name){
                //     module.push(ModulesManager.getInstance().modules_by_name[i].getModuleComponentByRole(Module.SharedModuleRoleName));
                // }
                modules = ModuleServiceBase.getInstance().sharedModules;
                break;
        }
        for (let i in modules) {
            let module: Module = modules[i];

            if (module.actif || (target == 'Test')) {
                fileContent += hook(module, target);
            }
        }

        return fileContent;
    }

    private generateModuleImport(module: Module, target: string) {
        let path: string = '../../../shared/modules/';

        if ((((target == 'Test') || (target == 'Client') || (target == 'Admin')) && ModuleServiceBase.getInstance().isBaseSharedModule(module)) ||
            ((target == 'Login') && ModuleServiceBase.getInstance().isBaseLoginModule(module))) {
            path = 'oswedev/dist/shared/modules/';
        }

        if (module.specificImportPath) {

            return "import Module" + module.reflexiveClassName + " from '" + path + module.specificImportPath + "/Module" + module.reflexiveClassName + "';\n";
        }
        return "import Module" + module.reflexiveClassName + " from '" + path + module.reflexiveClassName + "/Module" + module.reflexiveClassName + "';\n";
    }



    private generateModuleData(module: Module) {
        let fileContent = "";

        fileContent = "    Module" + module.reflexiveClassName + ".getInstance().actif = true;\n";

        for (let i in module.fields) {
            let field = module.fields[i];

            fileContent += "    Module" + module.reflexiveClassName + ".getInstance().setParamValue(\"" + field.field_id + "\", " + JSON.stringify(field.field_value) + ");\n";
        }

        return fileContent;
    }

    private generateModuleAsyncInitialisation(module: Module, target: string) {

        let res = "    await Module" + module.reflexiveClassName + ".getInstance().hook_module_async_" + target.toLowerCase() + "_initialization();\n";

        if ((target == 'Client') || (target == 'Admin') || (target == 'Test')) {
            res = "    await Module" + module.reflexiveClassName + ".getInstance().hook_module_async_client_admin_initialization();\n" + res;
        }

        res = "promises.push((async () => {" + res + "})());";
        return res;
    }
}