import ModuleServiceBase from "./ModuleServiceBase";
import Module from "../../shared/modules/Module";
import FileHandler from '../../shared/tools/FileHandler';

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

            // 'export default ModulesClientInitializationDatas = ' + JSON.stringify(this.GM.get_modules_infos(req.params.env)) + ';';
            try {

                if (!await FileHandler.getInstance().dirExists('./src/client/ts/generated/')) {
                    await FileHandler.getInstance().dirCreate('./src/client/ts/generated/');
                }
                if (!await FileHandler.getInstance().dirExists('./src/admin/ts/generated/')) {
                    await FileHandler.getInstance().dirCreate('./src/admin/ts/generated/');
                }
                await FileHandler.getInstance().writeFile('./src/client/ts/generated/InitializeClientModulesDatas.ts', fileContent_client);
                await FileHandler.getInstance().writeFile('./src/admin/ts/generated/InitializeAdminModulesDatas.ts', fileContent_admin);
            } catch (error) {
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

        for (let i in ModuleServiceBase.getInstance().sharedModules) {
            let module: Module = ModuleServiceBase.getInstance().sharedModules[i];

            if (module.actif) {
                fileContent += hook(module, target);
            }
        }

        return fileContent;
    }

    private generateModuleImport(module: Module) {
        let path: string = '../../../shared/modules/';

        if (ModuleServiceBase.getInstance().isBaseSharedModule(module)) {
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
        return "    await Module" + module.reflexiveClassName + ".getInstance().hook_module_async_client_admin_initialization();\n" +
            "    await Module" + module.reflexiveClassName + ".getInstance().hook_module_async_" + target.toLowerCase() + "_initialization();\n";
    }
}