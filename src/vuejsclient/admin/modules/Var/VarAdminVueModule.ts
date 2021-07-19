import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
import VarPerfVO from '../../../../shared/modules/Var/vos/VarPerfVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../../ts/components/menu/MenuController';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';

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
        this.policies_needed = [
            ModuleVar.POLICY_BO_ACCESS,
            ModuleVar.POLICY_BO_VARCONF_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleVar.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleVar.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "VarAdminVueModule",
                    "fa-calculator",
                    30 - 1,
                    null
                )
            );

        if (this.policies_loaded[ModuleVar.POLICY_BO_VARCONF_ACCESS]) {
            await CRUDComponentManager.getInstance().registerCRUD(
                VarConfVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleVar.POLICY_BO_VARCONF_ACCESS,
                    VueAppController.getInstance().app_name,
                    "SimpleVarConfVO",
                    "fa-calculator",
                    10,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);

            await CRUDComponentManager.getInstance().registerCRUD(
                VarCacheConfVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleVar.POLICY_BO_VARCONF_ACCESS,
                    VueAppController.getInstance().app_name,
                    "VarCacheConfVO",
                    "fa-calculator",
                    10 + 1,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);

            await CRUDComponentManager.getInstance().registerCRUD(
                VarPerfVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleVar.POLICY_BO_VARCONF_ACCESS,
                    VueAppController.getInstance().app_name,
                    "VarPerfVO",
                    "fa-pie-chart",
                    10 + 2,
                    null,
                    null,
                    menuBranch.id
                ),
                this.routes);
        }
    }
}