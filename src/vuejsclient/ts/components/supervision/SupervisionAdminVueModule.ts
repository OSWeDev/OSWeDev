import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleSupervision from '../../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import './supervision_crud.scss';

export default class SupervisionAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "SupervisionAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-tachometer",
        []
    );

    public static getInstance(): SupervisionAdminVueModule {
        if (!SupervisionAdminVueModule.instance) {
            SupervisionAdminVueModule.instance = new SupervisionAdminVueModule();
        }

        return SupervisionAdminVueModule.instance;
    }

    private static instance: SupervisionAdminVueModule = null;

    private constructor() {

        super(ModuleSupervision.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleSupervision.POLICY_BO_ACCESS)) {
            return;
        }

        let registered_api_types = SupervisionController.getInstance().registered_controllers;
        for (let registered_api_type in registered_api_types) {

            CRUDComponentManager.getInstance().registerCRUD(
                registered_api_type,
                null,
                new MenuPointer(
                    new MenuLeaf(registered_api_type, MenuElementBase.PRIORITY_HIGH, "fa-table"),
                    SupervisionAdminVueModule.DEFAULT_MENU_BRANCH),
                this.routes);
        }

        let main_route_name: string = 'SupervisionDashboard';
        this.routes.push({
            path: "/supervision/dashboard",
            name: main_route_name,
            component: () => import(/* webpackChunkName: "SupervisionDashboardComponent" */ './dashboard/SupervisionDashboardComponent')
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf('SupervisionDashboard', MenuElementBase.PRIORITY_ULTRAHIGH, "fa-tachometer"),
            SupervisionAdminVueModule.DEFAULT_MENU_BRANCH
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();

        this.routes.push({
            path: "/supervision/item/:vo_type/:id",
            name: 'SupervisedItem',
            component: () => import(/* webpackChunkName: "SupervisionDashboardComponent" */ './item/SupervisedItemComponent'),
            props: (route) => ({
                supervised_item_id: parseInt(route.params.id),
                supervised_item_vo_type: route.params.vo_type
            }),
        });
    }
}