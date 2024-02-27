import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';
import CheckListControllerBase from './CheckListControllerBase';

export default class CheckListClientVueModule extends VueModuleBase {

    public static getInstance(
        checklist_shared_module: ModuleCheckListBase,
        route_base_checklist: string = "/checklist"): CheckListClientVueModule {
        if (!CheckListClientVueModule.instances[checklist_shared_module.name]) {
            CheckListClientVueModule.instances[checklist_shared_module.name] = new CheckListClientVueModule(
                checklist_shared_module, route_base_checklist);
        }

        return CheckListClientVueModule.instances[checklist_shared_module.name];
    }

    private static instances: { [shared_name: string]: CheckListClientVueModule } = {};

    private constructor(
        public checklist_shared_module: ModuleCheckListBase,
        public route_base_checklist: string) {

        super(checklist_shared_module.name);
        this.policies_needed = [
            this.checklist_shared_module.POLICY_FO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[this.checklist_shared_module.POLICY_FO_ACCESS]) {
            return;
        }

        const menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    this.checklist_shared_module.POLICY_FO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "CheckListClientVueModule",
                    "fa-list",
                    20,
                    null
                )
            );

        let url: string = this.route_base_checklist + "/:list_id";
        let main_route_name: string = this.checklist_shared_module.name + '-component';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./CheckListComponent'),
            props: (route) => ({
                key: this.checklist_shared_module.name + '_list_' + parseInt(route.params.list_id),
                list_id: parseInt(route.params.list_id),
                modal_show: false,
                global_route_path: this.route_base_checklist,
                checklist_shared_module: this.checklist_shared_module,
                checklist_controller: CheckListControllerBase.controller_by_name[this.checklist_shared_module.name]
            })
        });
        const menuelt = MenuElementVO.create_new(
            this.checklist_shared_module.POLICY_FO_ACCESS,
            VueAppController.getInstance().app_name,
            main_route_name,
            "fa-list",
            10,
            main_route_name,
            true,
            menuBranch.id
        );

        //TODO FIXME ajouter les liens pour chaque checklist
        await MenuController.getInstance().declare_menu_element(menuelt);

        url = this.route_base_checklist + "/:list_id/:item_id";
        main_route_name = this.checklist_shared_module.name + '_Item';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./CheckListComponent'),
            props: (route) => ({
                key: this.checklist_shared_module.name + '_list_' + parseInt(route.params.list_id) + '_ITEM_' + parseInt(route.params.item_id),
                list_id: parseInt(route.params.list_id),
                item_id: parseInt(route.params.item_id),
                modal_show: true,
                global_route_path: this.route_base_checklist,
                checklist_shared_module: this.checklist_shared_module,
                checklist_controller: CheckListControllerBase.controller_by_name[this.checklist_shared_module.name]
            })
        });

        url = this.route_base_checklist + "/:list_id/:item_id/:checkpoint_id";
        main_route_name = this.checklist_shared_module.name + '_Item_Checkpoint';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./CheckListComponent'),
            props: (route) => ({
                key: this.checklist_shared_module.name + '_list_' + parseInt(route.params.list_id) + '_ITEM_' + parseInt(route.params.item_id) + '_CHECKPOINT_' + parseInt(route.params.checkpoint_id),
                list_id: parseInt(route.params.list_id),
                item_id: parseInt(route.params.item_id),
                step_id: parseInt(route.params.checkpoint_id),
                modal_show: true,
                global_route_path: this.route_base_checklist,
                checklist_shared_module: this.checklist_shared_module,
                checklist_controller: CheckListControllerBase.controller_by_name[this.checklist_shared_module.name]
            })
        });
    }
}