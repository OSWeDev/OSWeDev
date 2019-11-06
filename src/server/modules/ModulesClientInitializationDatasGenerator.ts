import ModuleServiceBase from "./ModuleServiceBase";
import Module from "../../shared/modules/Module";
import ModuleFileServer from './File/ModuleFileServer';

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
                await ModuleFileServer.getInstance().makeSureThisFolderExists('./test/generated/');
                await ModuleFileServer.getInstance().writeFile('./src/client/ts/generated/InitializeClientModulesDatas.ts', fileContent_client);
                await ModuleFileServer.getInstance().writeFile('./src/admin/ts/generated/InitializeAdminModulesDatas.ts', fileContent_admin);
                await ModuleFileServer.getInstance().writeFile('./src/login/ts/generated/InitializeLoginModulesDatas.ts', fileContent_login);
                await ModuleFileServer.getInstance().writeFile('./test/generated/InitializeTestModulesDatas.ts', fileContent_test);
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
        fileContent += "\n";
        fileContent += "export default async function Initialize" + target + "ModulesDatas() {\n";
        fileContent += this.generateModulesCode(this.generateModuleData, target);
        fileContent += this.generateModulesCode(this.generateModuleAsyncInitialisation, target);
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
        } else if (target == 'Test') {
            path = '../../src/shared/modules/';
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
        return res;
    }
}