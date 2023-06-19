import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleVocus from '../../../../shared/modules/Vocus/ModuleVocus';
import VocusHandler from '../../../../shared/tools/VocusHandler';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import MenuController from '../menu/MenuController';


export default class VocusAdminVueModule extends VueModuleBase {

    public static ROUTE_PATH: string = VocusHandler.Vocus_ROUTE_BASE;

    public static getInstance(): VocusAdminVueModule {
        if (!VocusAdminVueModule.instance) {
            VocusAdminVueModule.instance = new VocusAdminVueModule();
        }

        return VocusAdminVueModule.instance;
    }

    private static instance: VocusAdminVueModule = null;

    private constructor() {

        super(ModuleVocus.getInstance().name);
        this.policies_needed = [
            ModuleVocus.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleVocus.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleVocus.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "VocusAdminVueModule",
                    "fa-search",
                    50,
                    null
                )
            );

        let url: string = VocusAdminVueModule.ROUTE_PATH;
        let main_route_name: string = 'Vocus';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./VocusComponent'),
            props: (route) => ({
                key: main_route_name
            })
        });

        url = VocusAdminVueModule.ROUTE_PATH + '/:type/:id';

        this.routes.push({
            path: url,
            name: main_route_name + '__vo',
            component: () => import('./VocusComponent'),
            props: (route) => ({
                key: main_route_name,
                vo_id: parseInt(route.params.id),
                vo_type: route.params.type
            })
        });

        let menuPointer = MenuElementVO.create_new(
            ModuleVocus.POLICY_BO_ACCESS,
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