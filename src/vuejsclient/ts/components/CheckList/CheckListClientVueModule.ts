import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';

export default class CheckListClientVueModule extends VueModuleBase {

    public static getInstance(
        checklist_shared_module: ModuleCheckListBase,
        checklist_client_controller: ModuleCheckListBase,
        route_base_checklist: string = "/checklist",
        menuBranch: MenuBranch = new MenuBranch(
            "CheckListClientVueModule",
            MenuElementBase.PRIORITY_HIGH,
            "fa-list",
            []
        )): CheckListClientVueModule {
        if (!CheckListClientVueModule.instances[checklist_shared_module.name]) {
            CheckListClientVueModule.instances[checklist_shared_module.name] = new CheckListClientVueModule(
                checklist_shared_module, route_base_checklist, menuBranch);
        }

        return CheckListClientVueModule.instances[checklist_shared_module.name];
    }

    private static instances: { [shared_name: string]: CheckListClientVueModule } = {};

    private constructor(
        public checklist_shared_module: ModuleCheckListBase,
        public route_base_checklist: string,
        public menuBranch: MenuBranch) {

        super(checklist_shared_module.name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(this.checklist_shared_module.POLICY_FO_ACCESS)) {
            return;
        }

        let url: string = this.route_base_checklist + "/:list_id";
        let main_route_name: string = this.checklist_shared_module.name + '-component';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "CheckListComponent" */ './CheckListComponent'),
            props: (route) => ({
                key: this.checklist_shared_module.name + '_list_' + parseInt(route.params.list_id),
                list_id: parseInt(route.params.list_id),
                modal_show: false,
                global_route_path: this.route_base_checklist,
                checklist_shared_module: this.checklist_shared_module
            })
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf(main_route_name, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-list"),
            this.menuBranch
        );

        //TODO FIXME ajouter les liens pour chaque checklist
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();

        url = this.route_base_checklist + "/:list_id/:item_id";
        main_route_name = this.checklist_shared_module.name + '_Item';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "CheckListComponent" */ './CheckListComponent'),
            props: (route) => ({
                key: this.checklist_shared_module.name + '_list_' + parseInt(route.params.list_id) + '_ITEM_' + parseInt(route.params.item_id),
                list_id: parseInt(route.params.list_id),
                item_id: parseInt(route.params.item_id),
                modal_show: true,
                global_route_path: this.route_base_checklist,
                checklist_shared_module: this.checklist_shared_module
            })
        });

        url = this.route_base_checklist + "/:list_id/:item_id/:checkpoint_id";
        main_route_name = this.checklist_shared_module.name + '_Item_Checkpoint';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "CheckListComponent" */ './CheckListComponent'),
            props: (route) => ({
                key: this.checklist_shared_module.name + '_list_' + parseInt(route.params.list_id) + '_ITEM_' + parseInt(route.params.item_id) + '_CHECKPOINT_' + parseInt(route.params.checkpoint_id),
                list_id: parseInt(route.params.list_id),
                item_id: parseInt(route.params.item_id),
                checkpoint_id: parseInt(route.params.checkpoint_id),
                modal_show: true,
                global_route_path: this.route_base_checklist,
                checklist_shared_module: this.checklist_shared_module
            })
        });
    }
}