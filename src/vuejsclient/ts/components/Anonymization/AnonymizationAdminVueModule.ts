import ModuleAnonymization from '../../../../shared/modules/Anonymization/ModuleAnonymization';
import AnonymizationFieldConfVO from '../../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class AnonymizationAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): AnonymizationAdminVueModule {
        if (!AnonymizationAdminVueModule.instance) {
            AnonymizationAdminVueModule.instance = new AnonymizationAdminVueModule();
        }

        return AnonymizationAdminVueModule.instance;
    }

    private static instance: AnonymizationAdminVueModule = null;

    private constructor() {

        super(ModuleAnonymization.getInstance().name);
        this.policies_needed = [
            ModuleAnonymization.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleAnonymization.POLICY_BO_ACCESS]) {
            return;
        }

        const menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleAnonymization.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "AnonymizationAdminVueModule",
                    "fa-user-secret",
                    50,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnonymizationFieldConfVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnonymization.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                AnonymizationFieldConfVO.API_TYPE_ID,
                "fa-user-secret",
                30,
                null,
                null,
                menuBranch.id
            ),
            this.routes);
    }
}