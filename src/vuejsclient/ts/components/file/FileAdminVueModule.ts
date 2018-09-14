import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';

export default class FileAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "FileAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-folder-open",
        []
    );

    public static getInstance(): FileAdminVueModule {
        if (!FileAdminVueModule.instance) {
            FileAdminVueModule.instance = new FileAdminVueModule();
        }

        return FileAdminVueModule.instance;
    }

    private static instance: FileAdminVueModule = null;

    private constructor() {

        super(ModuleFile.getInstance().name);
    }

    public initialize() {

        if (!
            (
                VueAppController.getInstance().hasRole(ModuleAccessPolicy.ROLE_SUPER_ADMIN) && (
                    (
                        (typeof VueAppController.getInstance().data_user.super_admin === "undefined") &&
                        (typeof VueAppController.getInstance().data_user.admin_central === "undefined") &&
                        (typeof VueAppController.getInstance().data_user.admin === "undefined")
                    ) || (
                        VueAppController.getInstance().data_user.super_admin
                    )
                ))) {
            return;
        }

        let importsMenuBranch: MenuBranch = FileAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        CRUDComponentManager.getInstance().registerCRUD(
            FileVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("FileVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-folder-open"),
                importsMenuBranch),
            this.routes);
    }
}