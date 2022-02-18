import { RouteConfig } from 'vue-router';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import CRUDHandler from '../../../../shared/tools/CRUDHandler';
import MenuController from '../menu/MenuController';

export default class CRUDComponentManager {

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

    public inline_input_mode_semaphore: boolean = false;
    public inline_input_mode_semaphore_disable_cb: { [ii_id: number]: () => void } = {};

    public registerCRUDs<T extends IDistantVOBase>(
        API_TYPE_IDs: string[],
        menuElts: MenuElementVO[],
        routes: RouteConfig[],
        read_query: any[] = null,
        routes_meta: any[] = null) {

        if ((!API_TYPE_IDs) || (!API_TYPE_IDs.length)) {
            return;
        }

        if ((!menuElts) || (!menuElts.length)) {
            return;
        }

        if (API_TYPE_IDs.length != menuElts.length) {
            return;
        }

        for (let i in API_TYPE_IDs) {
            this.registerCRUD(API_TYPE_IDs[i], null, menuElts[i], routes, read_query ? read_query[i] : null, routes_meta ? routes_meta[i] : null);
        }
    }

    /**
     *
     * @param API_TYPE_ID
     * @param crud Pas obligatoire, le crud sera alors créé avec les infos par défaut du moduletable que l'on retrouve avec le API_TYPE_ID
     * @param menuElement
     * @param routes
     */
    public async registerCRUD<T extends IDistantVOBase>(
        API_TYPE_ID: string,                //id du VO
        crud: CRUD<T>,                      //le crud
        menuElement: MenuElementVO,           //menu
        routes: RouteConfig[],              //routes (urls)
        read_query: any = null,
        routes_meta: any = null,
        sort_id_descending: boolean = true,
    ) {

        let url: string = CRUDHandler.getCRUDLink(API_TYPE_ID);
        let route_name: string = 'Manage ' + API_TYPE_ID;

        if (!crud) {
            crud = CRUD.getNewCRUD(API_TYPE_ID);
        }

        CRUDComponentManager.getInstance().cruds_by_api_type_id[API_TYPE_ID] = crud;

        if (!!routes) {

            routes.push({
                path: url,
                name: route_name,
                component: () => import(/* webpackChunkName: "CRUDComponent" */ '../../components/crud/component/CRUDComponent'),
                props: () => ({
                    crud: crud,
                    key: '__manage__' + API_TYPE_ID,
                    read_query: read_query,
                    sort_id_descending: sort_id_descending,
                }),
                meta: routes_meta ? routes_meta : undefined
            });

            routes.push({
                path: url + "/update/:id",
                name: route_name + " --UPDATE",
                component: () => import(/* webpackChunkName: "CRUDComponent" */ '../../components/crud/component/CRUDComponent'),
                props: (route) => ({
                    crud: crud,
                    key: '__manage__' + API_TYPE_ID,
                    modal_show_update: true,
                    modal_vo_id: parseInt(route.params.id),
                    sort_id_descending: sort_id_descending,
                }),
                meta: routes_meta ? routes_meta : undefined
            });

            if (!VOsTypesManager.getInstance().moduleTables_by_voType[crud.readDatatable.API_TYPE_ID].isModuleParamTable) {
                routes.push({
                    path: url + "/create",
                    name: route_name + " --CREATE",
                    component: () => import(/* webpackChunkName: "CRUDComponent" */ '../../components/crud/component/CRUDComponent'),
                    props: (route) => ({
                        crud: crud,
                        key: '__manage__' + API_TYPE_ID,
                        modal_show_create: true,
                        sort_id_descending: sort_id_descending,
                    }),
                    meta: routes_meta ? routes_meta : undefined
                });

                routes.push({
                    path: url + "/delete/:id",
                    name: route_name + " --DELETE",
                    component: () => import(/* webpackChunkName: "CRUDComponent" */ '../../components/crud/component/CRUDComponent'),
                    props: (route) => ({
                        crud: crud,
                        key: '__manage__' + API_TYPE_ID,
                        modal_show_delete: true,
                        modal_vo_id: parseInt(route.params.id),
                        sort_id_descending: sort_id_descending,
                    }),
                    meta: routes_meta ? routes_meta : undefined
                });
            }
        }

        if (!!menuElement) {
            menuElement.target = route_name;
            menuElement.target_is_routename = true;
            await MenuController.getInstance().declare_menu_element(menuElement);
        }
    }

    public async defineMenuRouteToCRUD(
        API_TYPE_ID: string,
        menuelt: MenuElementVO,
        routes: RouteConfig[],
        read_query: any = null,
        sort_id_descending: boolean = true,
    ) {
        let url: string = CRUDHandler.getCRUDLink(API_TYPE_ID);
        let route_name: string = menuelt.name;

        routes.push({
            path: url,
            name: route_name,
            component: () => import(/* webpackChunkName: "CRUDComponent" */ '../../components/crud/component/CRUDComponent'),
            props: () => ({
                crud: CRUDComponentManager.getInstance().cruds_by_api_type_id[API_TYPE_ID],
                key: '__manage__' + API_TYPE_ID,
                read_query: read_query,
                sort_id_descending: sort_id_descending
            })
        });

        menuelt.target = route_name;
        menuelt.target_is_routename = true;
        await MenuController.getInstance().declare_menu_element(menuelt);
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