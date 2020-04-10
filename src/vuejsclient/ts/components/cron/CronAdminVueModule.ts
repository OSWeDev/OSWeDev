import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCron from '../../../../shared/modules/Cron/ModuleCron';
import CronWorkerPlanification from '../../../../shared/modules/Cron/vos/CronWorkerPlanification';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';

export default class CronAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "CronAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-cogs",
        []
    );

    public static getInstance(): CronAdminVueModule {
        if (!CronAdminVueModule.instance) {
            CronAdminVueModule.instance = new CronAdminVueModule();
        }

        return CronAdminVueModule.instance;
    }

    private static instance: CronAdminVueModule = null;

    private constructor() {

        super(ModuleCron.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleCron.POLICY_BO_ACCESS)) {
            return;
        }

        let importsMenuBranch: MenuBranch = CronAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        CRUDComponentManager.getInstance().registerCRUD(
            CronWorkerPlanification.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("CronWorkerPlanification", MenuElementBase.PRIORITY_HIGH, "fa-calendar"),
                importsMenuBranch),
            this.routes);

        let url: string = "/cron/run";
        let main_route_name: string = 'CronRun';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "CronComponent" */ './CronComponent')
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf('CronRun', MenuElementBase.PRIORITY_ULTRAHIGH, "fa-play"),
            CronAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();
    }
}