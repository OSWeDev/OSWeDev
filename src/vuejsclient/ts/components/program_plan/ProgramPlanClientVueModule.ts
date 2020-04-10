import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleImage from '../../../../shared/modules/Image/ModuleImage';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';

export default class ProgramPlanClientVueModule extends VueModuleBase {

    public static ROUTE_BASE_PLAN_PROGRAMS: string = "/plan/programs";
    public static ROUTE_BASE_PLAN_PROGRAM: string = "/plan/program/";

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "ProgramPlanClientVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-calendar",
        []
    );

    public static getInstance(menuBranch: MenuBranch = ProgramPlanClientVueModule.DEFAULT_MENU_BRANCH): ProgramPlanClientVueModule {
        if (!ProgramPlanClientVueModule.instance) {
            ProgramPlanClientVueModule.instance = new ProgramPlanClientVueModule(menuBranch);
        }

        return ProgramPlanClientVueModule.instance;
    }

    private static instance: ProgramPlanClientVueModule = null;

    private constructor(public menuBranch: MenuBranch) {

        super(ModuleImage.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_FO_ACCESS)) {
            return;
        }

        let url: string = ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAMS;
        let main_route_name: string = 'plan-program-component';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "ProgramsOverviewComponent" */ './ProgramsOverview/ProgramsOverviewComponent')
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf('PlanProgramComponent', MenuElementBase.PRIORITY_ULTRAHIGH, "fa-calendar"),
            this.menuBranch
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();

        url = ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAM + ":program_id";
        main_route_name = 'program-plan';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "ProgramPlanComponent" */ './ProgramPlanComponent'),
            props: (route) => ({
                key: 'ProgramPlan_' + parseInt(route.params.program_id),
                program_id: parseInt(route.params.program_id),
                global_route_path: ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAM
            })
        });

        url = ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAM + ":program_id" + "/rdv/:selected_rdv_id";
        main_route_name = 'ProgramPlanRDV';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "ProgramPlanComponent" */ './ProgramPlanComponent'),
            props: (route) => ({
                key: 'ProgramPlanRDV_' + parseInt(route.params.selected_rdv_id),
                program_id: parseInt(route.params.program_id),
                modal_show: true,
                selected_rdv_id: parseInt(route.params.selected_rdv_id),
                global_route_path: ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAM
            })
        });
    }
}