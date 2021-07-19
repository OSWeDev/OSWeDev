import ModuleImage from '../../../../shared/modules/Image/ModuleImage';
import ImageVO from '../../../../shared/modules/Image/vos/ImageVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class ImageAdminVueModule extends VueModuleBase {

    public static getInstance(): ImageAdminVueModule {
        if (!ImageAdminVueModule.instance) {
            ImageAdminVueModule.instance = new ImageAdminVueModule();
        }

        return ImageAdminVueModule.instance;
    }

    private static instance: ImageAdminVueModule = null;

    private constructor() {

        super(ModuleImage.getInstance().name);
        this.policies_needed = [
            ModuleImage.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleImage.POLICY_BO_ACCESS]) {
            return;
        }

        let importsMenuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleImage.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "ImageAdminVueModule",
                    "fa-folder-open",
                    20,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            ImageVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleImage.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                ImageVO.API_TYPE_ID,
                "fa-folder-open",
                10,
                null,
                null,
                importsMenuBranch.id
            ),
            this.routes);
    }
}