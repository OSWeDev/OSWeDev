import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ParamVO from '../../../../shared/modules/Params/vos/ParamVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class ParamsAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "ParamsAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-upload",
        []
    );

    public static getInstance(): ParamsAdminVueModule {
        if (!ParamsAdminVueModule.instance) {
            ParamsAdminVueModule.instance = new ParamsAdminVueModule();
        }

        return ParamsAdminVueModule.instance;
    }

    private static instance: ParamsAdminVueModule = null;

    private constructor() {

        super(ModuleParams.getInstance().name);
    }

    public async initializeAsync() {

        let menuBranch: MenuBranch = ParamsAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleParams.POLICY_BO_ACCESS)) {
            return;
        }

        CRUDComponentManager.getInstance().registerCRUD(
            ParamVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf(ParamVO.API_TYPE_ID, MenuElementBase.PRIORITY_MEDIUM, "fa-cogs")
            ),
            this.routes);
    }
}