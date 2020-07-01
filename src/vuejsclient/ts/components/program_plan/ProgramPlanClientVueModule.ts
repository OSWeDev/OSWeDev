import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleImage from '../../../../shared/modules/Image/ModuleImage';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import ProgramPlanControllerBase from './ProgramPlanControllerBase';

export default class ProgramPlanClientVueModule extends VueModuleBase {

    public static getInstance(
        program_plan_shared_module: ModuleProgramPlanBase,
        program_plan_controller: ProgramPlanControllerBase,
        route_base_programs: string = "/plan/programs",
        route_base_program: string = "/plan/program/",
        menuBranch: MenuBranch = new MenuBranch(
            "ProgramPlanClientVueModule",
            MenuElementBase.PRIORITY_HIGH,
            "fa-calendar",
            []
        )): ProgramPlanClientVueModule {
        if (!ProgramPlanClientVueModule.instances[program_plan_shared_module.name]) {
            ProgramPlanClientVueModule.instances[program_plan_shared_module.name] = new ProgramPlanClientVueModule(
                program_plan_shared_module, program_plan_controller, route_base_programs, route_base_program, menuBranch);
        }

        return ProgramPlanClientVueModule.instances[program_plan_shared_module.name];
    }

    private static instances: { [shared_name: string]: ProgramPlanClientVueModule } = {};

    private constructor(
        public program_plan_shared_module: ModuleProgramPlanBase,
        public program_plan_controller: ProgramPlanControllerBase,
        public route_base_programs: string,
        public route_base_program: string,
        public menuBranch: MenuBranch) {

        super(program_plan_shared_module.name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(this.program_plan_shared_module.POLICY_FO_ACCESS)) {
            return;
        }

        let url: string = this.route_base_programs;
        let main_route_name: string = this.program_plan_shared_module.name + '-component';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "ProgramsOverviewComponent" */ './ProgramsOverview/ProgramsOverviewComponent'),
            props: (route) => ({
                key: main_route_name,
                program_plan_shared_module: this.program_plan_shared_module,
                program_plan_client_module: this
            })
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf(main_route_name, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-calendar"),
            this.menuBranch
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();

        url = this.route_base_program + ":program_id";
        main_route_name = this.program_plan_shared_module.name;

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "ProgramPlanComponent" */ './ProgramPlanComponent'),
            props: (route) => ({
                key: this.program_plan_shared_module.name + '_' + parseInt(route.params.program_id),
                program_id: parseInt(route.params.program_id),
                global_route_path: this.route_base_program,
                program_plan_shared_module: this.program_plan_shared_module,
                program_plan_controller: this.program_plan_controller
            })
        });

        url = this.route_base_program + ":program_id" + "/rdv/:selected_rdv_id";
        main_route_name = this.program_plan_shared_module.name + '_RDV';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "ProgramPlanComponent" */ './ProgramPlanComponent'),
            props: (route) => ({
                key: this.program_plan_shared_module.name + '_RDV_' + parseInt(route.params.selected_rdv_id),
                program_id: parseInt(route.params.program_id),
                modal_show: true,
                selected_rdv_id: parseInt(route.params.selected_rdv_id),
                global_route_path: this.route_base_program,
                program_plan_shared_module: this.program_plan_shared_module,
                program_plan_controller: this.program_plan_controller
            })
        });
    }
}