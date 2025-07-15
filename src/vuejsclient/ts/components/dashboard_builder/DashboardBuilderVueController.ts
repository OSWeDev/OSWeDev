import { RouteConfig } from 'vue-router';

export default class DashboardBuilderVueController {

    public static DBB_ONGLET_TABLE: string = 'onglet_table';
    public static DBB_ONGLET_VIEWPORT: string = 'onglet_viewport';
    public static DBB_ONGLET_WIDGETS: string = 'onglet_widgets';
    public static DBB_ONGLET_MENUS: string = 'onglet_menus';
    public static DBB_ONGLET_FILTRES_PARTAGES: string = 'onglet_shared_filters';
    public static DBB_ONGLET_RIGHTS: string = 'onglet_rights';
    public static ALL_DBB_ONGLETS: string[] = [
        DashboardBuilderVueController.DBB_ONGLET_TABLE,
        DashboardBuilderVueController.DBB_ONGLET_VIEWPORT,
        DashboardBuilderVueController.DBB_ONGLET_WIDGETS,
        DashboardBuilderVueController.DBB_ONGLET_MENUS,
        DashboardBuilderVueController.DBB_ONGLET_FILTRES_PARTAGES,
        DashboardBuilderVueController.DBB_ONGLET_RIGHTS,
    ];

    /**
     * On ajoute l'id tout simplement après le prefix et on a le code trad
     *  A supprimer au profit des translatable_string !
     */

    public static DASHBOARD_VO_ACTION_ADD: string = "add";
    public static DASHBOARD_VO_ACTION_EDIT: string = "edit";
    public static DASHBOARD_VO_ACTION_DELETE: string = "delete";
    public static DASHBOARD_VO_ACTION_VOCUS: string = "vocus";

    public static ROUTE_NAME_CRUD: string = "__CRUD";
    public static ROUTE_NAME_CRUD_ALL: string = "__all";

    public static addRouteForDashboard(path: string, name: string, component: any, crud: boolean): RouteConfig[] {
        const routes: RouteConfig[] = [{
            path: path,
            name: name,
            component: component,
            props: (route) => ({
                dashboard_id: parseInt(route.params.dashboard_id),
            })
        }];

        if (crud) {
            name += DashboardBuilderVueController.ROUTE_NAME_CRUD;

            routes.push({
                path: path + '/:dashboard_vo_action/:dashboard_vo_id',
                name: name,
                component: component,
                props: (route) => ({
                    dashboard_id: parseInt(route.params.dashboard_id),
                    dashboard_vo_action: route.params.dashboard_vo_action,
                    dashboard_vo_id: route.params.dashboard_vo_id,
                })
            });

            name += DashboardBuilderVueController.ROUTE_NAME_CRUD_ALL;

            routes.push({
                path: path + '/:dashboard_vo_action/:dashboard_vo_id/:api_type_id_action',
                name: name,
                component: component,
                props: (route) => ({
                    dashboard_id: parseInt(route.params.dashboard_id),
                    api_type_id_action: route.params.api_type_id_action,
                    dashboard_vo_action: route.params.dashboard_vo_action,
                    dashboard_vo_id: route.params.dashboard_vo_id,
                })
            });
        }

        return routes;
    }
}