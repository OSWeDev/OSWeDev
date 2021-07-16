import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleMenu from '../../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleMenu from '../../../../shared/modules/Vocus/ModuleMenu';
import VocusHandler from '../../../../shared/tools/VocusHandler';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import MenuController from '../menu/MenuController';
import MenuBranch from '../menu/vos/MenuBranch';
import MenuLeaf from '../menu/vos/MenuLeaf';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';


export default class MenuAdminVueModule extends VueModuleBase {

    public static getInstance(): MenuAdminVueModule {
        if (!MenuAdminVueModule.instance) {
            MenuAdminVueModule.instance = new MenuAdminVueModule();
        }

        return MenuAdminVueModule.instance;
    }

    private static instance: MenuAdminVueModule = null;

    private constructor() {

        super(ModuleMenu.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleMenu.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleMenu.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "MenuAdminVueModule",
                    "fa-search",
                    50,
                    null
                )
            );

        let url: string = MenuAdminVueModule.ROUTE_PATH;
        let main_route_name: string = 'Vocus';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "VocusComponent" */ './VocusComponent'),
            props: (route) => ({
                key: main_route_name
            })
        });

        url = MenuAdminVueModule.ROUTE_PATH + '/:type/:id';

        this.routes.push({
            path: url,
            name: main_route_name + '__vo',
            component: () => import(/* webpackChunkName: "VocusComponent" */ './VocusComponent'),
            props: (route) => ({
                key: main_route_name,
                vo_id: parseInt(route.params.id),
                vo_type: route.params.type
            })
        });

        let menuPointer = MenuElementVO.create_new(
            ModuleMenu.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            main_route_name,
            "fa-search",
            10,
            main_route_name,
            true,
            menuBranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointer);
    }
}