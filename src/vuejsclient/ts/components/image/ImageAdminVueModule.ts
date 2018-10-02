import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ImageVO from '../../../../shared/modules/Image/vos/ImageVO';
import ModuleImage from '../../../../shared/modules/Image/ModuleImage';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';

export default class ImageAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "ImageAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-folder-open",
        []
    );

    public static getInstance(): ImageAdminVueModule {
        if (!ImageAdminVueModule.instance) {
            ImageAdminVueModule.instance = new ImageAdminVueModule();
        }

        return ImageAdminVueModule.instance;
    }

    private static instance: ImageAdminVueModule = null;

    private constructor() {

        super(ModuleImage.getInstance().name);
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

        let importsMenuBranch: MenuBranch = ImageAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        CRUDComponentManager.getInstance().registerCRUD(
            ImageVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ImageVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-folder-open"),
                importsMenuBranch),
            this.routes);
    }
}