import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class FileAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): FileAdminVueModule {
        if (!FileAdminVueModule.instance) {
            FileAdminVueModule.instance = new FileAdminVueModule();
        }

        return FileAdminVueModule.instance;
    }

    private static instance: FileAdminVueModule = null;

    private constructor() {

        super(ModuleFile.getInstance().name);
        this.policies_needed = [
            ModuleFile.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleFile.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleFile.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "FileAdminVueModule",
                    "fa-folder-open",
                    20,
                    null
                )
            );
        await CRUDComponentManager.getInstance().registerCRUD(
            FileVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleFile.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                FileVO.API_TYPE_ID,
                "fa-folder-open",
                10,
                null,
                null,
                menuBranch.id
            ),

            this.routes);
    }
}