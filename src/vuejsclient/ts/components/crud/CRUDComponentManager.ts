import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { RouteConfig } from 'vue-router';
import CRUDComponent from '../../components/crud/component/CRUDComponent';
import MenuBranch from '../../components/menu/vos/MenuBranch';
import MenuElementBase from '../../components/menu/vos/MenuElementBase';
import MenuPointer from '../../components/menu/vos/MenuPointer';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import CRUD from './vos/CRUD';

export default class CRUDComponentManager {

    public static DEFAULT_CRUD_MENU_BRANCH: MenuBranch = new MenuBranch(
        "__crud_datatables__",
        MenuElementBase.PRIORITY_MEDIUM,
        "fa-table",
        []
    );

    public static getInstance() {

        if (!CRUDComponentManager.instance) {
            CRUDComponentManager.instance = new CRUDComponentManager();
        }
        return CRUDComponentManager.instance;
    }

    private static instance: CRUDComponentManager;

    /**
     *
     * @param API_TYPE_ID
     * @param crud Pas obligatoire, le crud sera alors créé avec les infos par défaut du moduletable que l'on retrouve avec le API_TYPE_ID
     * @param menuPointer
     * @param routes
     */
    public registerCRUD<T extends IDistantVOBase>(
        API_TYPE_ID: string,
        crud: CRUD<T>,
        menuPointer: MenuPointer,
        routes: RouteConfig[]) {

        let url: string = '/manage/' + API_TYPE_ID;
        let route_name: string = 'Manage ' + API_TYPE_ID;

        if (!crud) {
            crud = CRUD.getNewCRUD(API_TYPE_ID);
        }

        routes.push({
            path: url,
            name: route_name,
            component: CRUDComponent,
            props: () => ({
                crud: crud,
                key: '__manage__' + API_TYPE_ID
            })
        });
        menuPointer.leaf.target = new MenuLeafRouteTarget(route_name);
        menuPointer.addToMenu();
    }
}