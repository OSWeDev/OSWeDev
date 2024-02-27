import ModuleMenu from '../../../../shared/modules/Menu/ModuleMenu';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';

export default class MenuAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
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

        const menuBranch: MenuElementVO =
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

        const url: string = '/menu/organizer';
        const main_route_name: string = 'menu_organizer';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./organizer/MenuOrganizerComponent'),
            props: (route) => ({
                key: main_route_name
            })
        });

        const menuPointer = MenuElementVO.create_new(
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


        await CRUDComponentManager.getInstance().registerCRUD(
            MenuElementVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleMenu.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                MenuElementVO.API_TYPE_ID,
                "fa-list",
                30,
                null,
                null,
                menuBranch.id
            ),
            this.routes);
    }
}