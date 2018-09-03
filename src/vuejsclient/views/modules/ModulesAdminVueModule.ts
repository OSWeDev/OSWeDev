import ModuleVO from '../../../shared/modules/ModuleVO';
import VueModuleBase from '../../ts/modules/VueModuleBase';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import MenuBranch from '../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../ts/components/menu/vos/MenuElementBase';
import CRUDComponentManager from '../../ts/components/crud/CRUDComponentManager';
import MenuPointer from '../../ts/components/menu/vos/MenuPointer';
import MenuLeaf from '../../ts/components/menu/vos/MenuLeaf';
import ModulesManager from '../../../shared/modules/ModulesManager';
import Module from '../../../shared/modules/Module';
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

        let modulesMenuBranch: MenuBranch = new MenuBranch("ModulesAdminVueModule", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-puzzle-piece", []);

        CRUDComponentManager.getInstance().registerCRUD(ModuleVO.API_TYPE_ID, null, new MenuPointer(
            new MenuLeaf("ModuleVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-puzzle-piece"),
            modulesMenuBranch),
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

            CRUDComponentManager.getInstance().registerCRUD(ModulesManager.MODULE_PARAM_TABLE_PREFIX + sharedModule.name, null, new MenuPointer(
                new MenuLeaf(ModulesManager.MODULE_PARAM_TABLE_PREFIX + sharedModule.name, MenuElementBase.PRIORITY_MEDIUM, "fa-sliders"),
                modulesMenuBranch),
                this.routes);
        }
    }
}