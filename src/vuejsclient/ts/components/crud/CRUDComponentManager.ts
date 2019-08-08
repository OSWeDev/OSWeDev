import { RouteConfig } from 'vue-router';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import CRUDHandler from '../../../../shared/tools/CRUDHandler';
import CRUDComponent from '../../components/crud/component/CRUDComponent';
import MenuBranch from '../../components/menu/vos/MenuBranch';
import MenuElementBase from '../../components/menu/vos/MenuElementBase';
import MenuPointer from '../../components/menu/vos/MenuPointer';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import CRUD from './vos/CRUD';

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
    public callback_routes: string[] = [];
    public idistantvo_init: IDistantVOBase[] = [];

    public registerCRUDs<T extends IDistantVOBase>(
        API_TYPE_IDs: string[],
        menuPointers: MenuPointer[],
        routes: RouteConfig[]) {

        if ((!API_TYPE_IDs) || (!API_TYPE_IDs.length)) {
            return;
        }

        if ((!menuPointers) || (!menuPointers.length)) {
            return;
        }

        if (API_TYPE_IDs.length != menuPointers.length) {
            return;
        }

        for (let i in API_TYPE_IDs) {
            this.registerCRUD(API_TYPE_IDs[i], null, menuPointers[i], routes);
        }
    }

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
        read_query: any = null,
        routes_meta: any = null) {

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
            }),
            meta: routes_meta ? routes_meta : undefined
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
            }),
            meta: routes_meta ? routes_meta : undefined
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
                }),
                meta: routes_meta ? routes_meta : undefined
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
                }),
                meta: routes_meta ? routes_meta : undefined
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

    public getCallbackRoute(shift: boolean = true): string {
        if (CRUDComponentManager.getInstance().callback_routes && CRUDComponentManager.getInstance().callback_routes.length > 0) {
            let callback: string = CRUDComponentManager.getInstance().callback_routes[0];

            if (shift) {
                CRUDComponentManager.getInstance().callback_routes.shift();
            }

            return callback;
        }

        return null;
    }

    public getIDistantVOInit(shift: boolean = true): IDistantVOBase {
        if (CRUDComponentManager.getInstance().idistantvo_init && CRUDComponentManager.getInstance().idistantvo_init.length > 0) {
            let vo: IDistantVOBase = CRUDComponentManager.getInstance().idistantvo_init[0];

            if (shift) {
                CRUDComponentManager.getInstance().idistantvo_init.shift();
            }

            return vo;
        }

        return null;
    }
}