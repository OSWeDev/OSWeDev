import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { RouteConfig } from 'vue-router';
import CRUDComponent from '../../components/crud/component/CRUDComponent';
import MenuBranch from '../../components/menu/vos/MenuBranch';
import MenuElementBase from '../../components/menu/vos/MenuElementBase';
import MenuPointer from '../../components/menu/vos/MenuPointer';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import CRUD from './vos/CRUD';
import CRUDHandler from '../../../../shared/tools/CRUDHandler';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';

export default class CRUDComponentManager {

    public static DEFAULT_CRUD_MENU_BRANCH: MenuBranch = new MenuBranch(
        "__crud_datatables__",
        MenuElementBase.PRIORITY_LOW,
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

    public cruds_by_api_type_id: { [api_type_id: string]: CRUD<any> } = {};

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
        routes: RouteConfig[],
        read_query: any = null) {

        let url: string = CRUDHandler.getCRUDLink(API_TYPE_ID);
        let route_name: string = 'Manage ' + API_TYPE_ID;

        if (!crud) {
            crud = CRUD.getNewCRUD(API_TYPE_ID);
        }

        CRUDComponentManager.getInstance().cruds_by_api_type_id[API_TYPE_ID] = crud;

        routes.push({
            path: url,
            name: route_name,
            component: CRUDComponent,
            props: () => ({
                crud: crud,
                key: '__manage__' + API_TYPE_ID,
                read_query: read_query
            })
        });

        routes.push({
            path: url + "/update/:id",
            name: route_name + " --UPDATE",
            component: CRUDComponent,
            props: (route) => ({
                crud: crud,
                key: '__manage__' + API_TYPE_ID,
                modal_show_update: true,
                modal_vo_id: parseInt(route.params.id)
            })
        });

        if (!VOsTypesManager.getInstance().moduleTables_by_voType[crud.readDatatable.API_TYPE_ID].isModuleParamTable) {
            routes.push({
                path: url + "/create",
                name: route_name + " --CREATE",
                component: CRUDComponent,
                props: (route) => ({
                    crud: crud,
                    key: '__manage__' + API_TYPE_ID,
                    modal_show_create: true
                })
            });

            routes.push({
                path: url + "/delete/:id",
                name: route_name + " --DELETE",
                component: CRUDComponent,
                props: (route) => ({
                    crud: crud,
                    key: '__manage__' + API_TYPE_ID,
                    modal_show_delete: true,
                    modal_vo_id: parseInt(route.params.id)
                })
            });
        }

        if (!!menuPointer) {
            menuPointer.leaf.target = new MenuLeafRouteTarget(route_name);
            menuPointer.addToMenu();
        }
    }



    public defineMenuRouteToCRUD(
        API_TYPE_ID: string,
        menuPointer: MenuPointer,
        routes: RouteConfig[],
        read_query: any = null) {
        let url: string = CRUDHandler.getCRUDLink(API_TYPE_ID);
        let route_name: string = menuPointer.leaf.UID;

        routes.push({
            path: url,
            name: route_name,
            component: CRUDComponent,
            props: () => ({
                crud: CRUDComponentManager.getInstance().cruds_by_api_type_id[API_TYPE_ID],
                key: '__manage__' + API_TYPE_ID,
                read_query: read_query
            })
        });

        menuPointer.leaf.target = new MenuLeafRouteTarget(route_name);
        menuPointer.addToMenu();
    }
}