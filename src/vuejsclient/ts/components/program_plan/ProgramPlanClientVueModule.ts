import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';
import ProgramPlanControllerBase from './ProgramPlanControllerBase';

export default class ProgramPlanClientVueModule extends VueModuleBase {

    public static getInstance(
        program_plan_shared_module: ModuleProgramPlanBase,
        program_plan_controller: ProgramPlanControllerBase,
        route_base_programs: string = "/plan/programs",
        route_base_program: string = "/plan/program/"): ProgramPlanClientVueModule {

        if (!ProgramPlanClientVueModule.instances[program_plan_shared_module.name]) {
            ProgramPlanClientVueModule.instances[program_plan_shared_module.name] = new ProgramPlanClientVueModule(
                program_plan_shared_module, program_plan_controller, route_base_programs, route_base_program
            );
        }

        return ProgramPlanClientVueModule.instances[program_plan_shared_module.name];
    }

    private static instances: { [shared_name: string]: ProgramPlanClientVueModule } = {};

    private constructor(
        public program_plan_shared_module: ModuleProgramPlanBase,
        public program_plan_controller: ProgramPlanControllerBase,
        public route_base_programs: string,
        public route_base_program: string) {

        super(program_plan_shared_module.name);
        this.policies_needed = [
            this.program_plan_shared_module.POLICY_FO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[this.program_plan_shared_module.POLICY_FO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    this.program_plan_shared_module.POLICY_FO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "ProgramPlanClientVueModule",
                    "fa-calendar",
                    20,
                    null
                )
            );

        let url: string = this.route_base_programs;
        let main_route_name: string = this.program_plan_shared_module.name + '-component';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./ProgramsOverview/ProgramsOverviewComponent'),
            props: (route) => ({
                key: main_route_name,
                program_plan_shared_module: this.program_plan_shared_module,
                program_plan_client_module: this
            })
        });
        let menuPointer = MenuElementVO.create_new(
            this.program_plan_shared_module.POLICY_FO_ACCESS,
            VueAppController.getInstance().app_name,
            main_route_name,
            "fa-calendar",
            10,
            main_route_name,
            true,
            menuBranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointer);

        url = this.route_base_program + ":program_id";
        main_route_name = this.program_plan_shared_module.name;

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./ProgramPlanComponent'),
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
            component: () => import('./ProgramPlanComponent'),
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