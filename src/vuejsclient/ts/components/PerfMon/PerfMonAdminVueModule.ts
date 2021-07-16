import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModulePerfMon from '../../../../shared/modules/PerfMon/ModulePerfMon';
import PerfMonLineTypeVO from '../../../../shared/modules/PerfMon/vos/PerfMonLineTypeVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class PerfMonAdminVueModule extends VueModuleBase {

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

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModulePerfMon.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModulePerfMon.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "PerfMonAdminVueModule",
                    "fa-bar-chart",
                    20,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            PerfMonLineTypeVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModulePerfMon.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                PerfMonLineTypeVO.API_TYPE_ID,
                "fa-bar-chart",
                30,
                null,
                null,
                menuBranch.id
            ),
            this.routes);
    }
}