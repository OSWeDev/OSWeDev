import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ImageVO from '../../../../shared/modules/Image/vos/ImageVO';
import ModuleImage from '../../../../shared/modules/Image/ModuleImage';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanProgram from '../../../../shared/modules/ProgramPlan/interfaces/IPlanProgram';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import ProgramPlanComponent from './ProgramPlanComponent';
import ProgramsOverviewComponent from './ProgramsOverview/ProgramsOverviewComponent';

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

    public initialize() {

        if (!ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.ACCESS_GROUP_NAME, ModuleProgramPlanBase.FRONT_ACCESS_RULE_NAME)) {
            return;
        }

        let url: string = ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAMS;
        let main_route_name: string = 'PlanProgramComponent';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: ProgramsOverviewComponent
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf('PlanProgramComponent', MenuElementBase.PRIORITY_ULTRAHIGH, "fa-calendar"),
            this.menuBranch
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();

        url = ProgramPlanClientVueModule.ROUTE_BASE_PLAN_PROGRAM + ":program_id";
        main_route_name = 'ProgramPlan';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: ProgramPlanComponent,
            props: (route) => ({
                key: 'ProgramPlan_' + parseInt(route.params.program_id),
                program_id: parseInt(route.params.program_id)
            })
        });

        url = "/plan/program/:program_id/rdv/:selected_rdv_id";
        main_route_name = 'ProgramPlanRDV';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: ProgramPlanComponent,
            props: (route) => ({
                key: 'ProgramPlanRDV_' + parseInt(route.params.selected_rdv_id),
                program_id: parseInt(route.params.program_id),
                modal_show: true,
                selected_rdv_id: parseInt(route.params.selected_rdv_id)
            })
        });
    }
}