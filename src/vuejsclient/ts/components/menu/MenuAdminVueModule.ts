import ModuleMenu from '../../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import MenuController from '../menu/MenuController';

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
        this.policies_needed = [
            ModuleMenu.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleMenu.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleMenu.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "MenuAdminVueModule",
                    "fa-list",
                    50,
                    null
                )
            );

        let url: string = '/menu/organizer';
        let main_route_name: string = 'menu_organizer';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "MenuOrganizerComponent" */ './organizer/MenuOrganizerComponent'),
            props: (route) => ({
                key: main_route_name
            })
        });

        let menuPointer = MenuElementVO.create_new(
            ModuleMenu.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            main_route_name,
            "fa-list",
            10,
            main_route_name,
            true,
            menuBranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointer);
    }
}