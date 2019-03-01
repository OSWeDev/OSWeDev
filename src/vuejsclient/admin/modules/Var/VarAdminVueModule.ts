import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import SimpleVarConfVO from '../../../../shared/modules/Var/simple_vars/SimpleVarConfVO';
import VarsController from '../../../../shared/modules/Var/VarsController';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class VarAdminVueModule extends VueModuleBase {


    public static getInstance(): VarAdminVueModule {
        if (!VarAdminVueModule.instance) {
            VarAdminVueModule.instance = new VarAdminVueModule();
        }

        return VarAdminVueModule.instance;
    }

    private static instance: VarAdminVueModule = null;

    private constructor() {

        super(ModuleVar.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = new MenuBranch("VarAdminVueModule", MenuElementBase.PRIORITY_MEDIUM - 1, "fa-calculator", []);

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_BO_VARCONF_ACCESS)) {
            CRUDComponentManager.getInstance().registerCRUD(
                SimpleVarConfVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("SimpleVarConfVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-calculator"),
                    menuBranch),
                this.routes);
        }

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_BO_IMPORTED_ACCESS)) {

            for (let api_type in VarsController.getInstance().registered_var_data_api_types) {

                CRUDComponentManager.getInstance().registerCRUD(
                    api_type,
                    null,
                    new MenuPointer(
                        new MenuLeaf(api_type, MenuElementBase.PRIORITY_HIGH, "fa-database"),
                        menuBranch),
                    this.routes);
            }
        }
    }
}