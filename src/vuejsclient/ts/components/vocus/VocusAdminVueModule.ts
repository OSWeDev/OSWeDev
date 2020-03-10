import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleVocus from '../../../../shared/modules/Vocus/ModuleVocus';
import VueModuleBase from '../../modules/VueModuleBase';
import MenuBranch from '../menu/vos/MenuBranch';
import MenuElementBase from '../menu/vos/MenuElementBase';
import MenuLeaf from '../menu/vos/MenuLeaf';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import MenuPointer from '../menu/vos/MenuPointer';
import VocusComponent from './VocusComponent';



export default class VocusAdminVueModule extends VueModuleBase {

    public static ROUTE_PATH: string = "/vocus";
    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "VocusAdminVueModule",
        MenuElementBase.PRIORITY_ULTRALOW,
        "fa-zoom",
        []
    );

    public static getInstance(): VocusAdminVueModule {
        if (!VocusAdminVueModule.instance) {
            VocusAdminVueModule.instance = new VocusAdminVueModule();
        }

        return VocusAdminVueModule.instance;
    }

    private static instance: VocusAdminVueModule = null;

    private constructor() {

        super(ModuleVocus.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleVocus.POLICY_BO_ACCESS)) {
            return;
        }

        let url: string = VocusAdminVueModule.ROUTE_PATH;
        let main_route_name: string = 'Vocus';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: VocusComponent,
            props: (route) => ({
                key: main_route_name
            })
        });

        url = VocusAdminVueModule.ROUTE_PATH + '/:type/:id';

        this.routes.push({
            path: url,
            name: main_route_name + '__vo',
            component: VocusComponent,
            props: (route) => ({
                key: main_route_name,
                vo_id: parseInt(route.params.id),
                vo_type: route.params.type
            })
        });

        let menuPointer = new MenuPointer(
            new MenuLeaf(main_route_name, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-zoom"),
            VocusAdminVueModule.DEFAULT_MENU_BRANCH
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();
    }
}