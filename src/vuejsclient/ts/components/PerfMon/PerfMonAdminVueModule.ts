import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModulePerfMon from '../../../../shared/modules/PerfMon/ModulePerfMon';
import PerfMonLineTypeVO from '../../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class PerfMonAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "PerfMonAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-bar-chart",
        []
    );

    public static getInstance(): PerfMonAdminVueModule {
        if (!PerfMonAdminVueModule.instance) {
            PerfMonAdminVueModule.instance = new PerfMonAdminVueModule();
        }

        return PerfMonAdminVueModule.instance;
    }

    private static instance: PerfMonAdminVueModule = null;

    private constructor() {

        super(ModulePerfMon.getInstance().name);
    }

    public async initializeAsync() {

        let menuBranch: MenuBranch = PerfMonAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModulePerfMon.POLICY_BO_ACCESS)) {
            return;
        }

        CRUDComponentManager.getInstance().registerCRUD(
            PerfMonLineTypeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf(PerfMonLineTypeVO.API_TYPE_ID, MenuElementBase.PRIORITY_MEDIUM, "fa-bar-chart")
            ),
            this.routes);
    }
}