import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MenuElementVO from '../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleVO from '../../../shared/modules/ModuleVO';
import VueAppController from '../../VueAppController';
import CRUDComponentManager from '../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../ts/components/menu/MenuController';
import VueModuleBase from '../../ts/modules/VueModuleBase';

export default class ModulesAdminVueModule extends VueModuleBase {


    // istanbul ignore next: nothing to test
    public static getInstance(): ModulesAdminVueModule {
        if (!ModulesAdminVueModule.instance) {
            ModulesAdminVueModule.instance = new ModulesAdminVueModule();
        }

        return ModulesAdminVueModule.instance;
    }

    private static instance: ModulesAdminVueModule = null;

    private constructor() {

        // On triche on utilise le Module DAO qui a la fois peut pas être inactif et en même temps ne peut pas (a priori) servir dans un module admin
        super(ModuleDAO.getInstance().name);
        this.policies_needed = [
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS]) {
            return;
        }

        const modulesMenuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "ModulesAdminVueModule",
                    "fa-puzzle-piece",
                    10,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(ModuleVO.API_TYPE_ID, null,
            MenuElementVO.create_new(
                ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                VueAppController.getInstance().app_name,
                "ModuleVO",
                "fa-puzzle-piece",
                10,
                null,
                null,
                modulesMenuBranch.id
            ),
            this.routes);
    }
}