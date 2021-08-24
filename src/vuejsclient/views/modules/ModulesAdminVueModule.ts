import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MenuElementVO from '../../../shared/modules/Menu/vos/MenuElementVO';
import Module from '../../../shared/modules/Module';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleVO from '../../../shared/modules/ModuleVO';
import CRUDComponentManager from '../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../ts/components/menu/MenuController';
import VueModuleBase from '../../ts/modules/VueModuleBase';
import VueAppController from '../../VueAppController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

export default class ModulesAdminVueModule extends VueModuleBase {


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

        let modulesMenuBranch: MenuElementVO =
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

        for (let i in ModulesManager.getInstance().modules_by_name) {
            let wrapper = ModulesManager.getInstance().modules_by_name[i];
            if (!wrapper) {
                continue;
            }

            let sharedModule = wrapper.getModuleComponentByRole(Module.SharedModuleRoleName);
            if (!sharedModule) {
                continue;
            }

            if (!sharedModule.actif) {
                continue;
            }

            if ((!(sharedModule as Module).fields) || ((sharedModule as Module).fields.length <= 0)) {
                continue;
            }

            await CRUDComponentManager.getInstance().registerCRUD(ModulesManager.MODULE_PARAM_TABLE_PREFIX + sharedModule.name, null,
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    ModulesManager.MODULE_PARAM_TABLE_PREFIX + sharedModule.name,
                    "fa-sliders",
                    30,
                    null,
                    null,
                    modulesMenuBranch.id
                ),
                this.routes);
        }
    }
}