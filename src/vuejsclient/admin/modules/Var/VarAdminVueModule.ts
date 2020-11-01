import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarCacheConfVO from '../../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../../shared/modules/Var/vos/VarConfVO';
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
                VarConfVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("SimpleVarConfVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-calculator"),
                    menuBranch),
                this.routes);

            CRUDComponentManager.getInstance().registerCRUD(
                VarCacheConfVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("VarCacheConfVO", MenuElementBase.PRIORITY_ULTRAHIGH + 1, "fa-calculator"),
                    menuBranch),
                this.routes);
        }
    }
}