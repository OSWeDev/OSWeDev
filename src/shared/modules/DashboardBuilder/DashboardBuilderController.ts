import { RouteConfig } from 'vue-router';

export default class DashboardBuilderController {

    /**
     * On ajoute l'id tout simplement après le prefix et on a le code trad
     */

    public static DASHBOARD_NAME_CODE_PREFIX: string = "dashboard.name.";
    public static PAGE_NAME_CODE_PREFIX: string = "dashboard.page.name.";
    public static WIDGET_NAME_CODE_PREFIX: string = "dashboard.widget.name.";
    public static VOFIELDREF_NAME_CODE_PREFIX: string = "dashboard.vofieldref.name.";
    public static TableColumnDesc_NAME_CODE_PREFIX: string = "dashboard.table_column_desc.name.";

    public static DASHBOARD_VO_ACTION_ADD: string = "add";
    public static DASHBOARD_VO_ACTION_EDIT: string = "edit";
    public static DASHBOARD_VO_ACTION_DELETE: string = "delete";
    public static DASHBOARD_VO_ACTION_VOCUS: string = "vocus";

    public static ROUTE_NAME_CRUD: string = "__CRUD";
    public static ROUTE_NAME_CRUD_ALL: string = "__all";

    public static getInstance(): DashboardBuilderController {
        if (!DashboardBuilderController.instance) {
            DashboardBuilderController.instance = new DashboardBuilderController();
        }
        return DashboardBuilderController.instance;
    }

    private static instance: DashboardBuilderController = null;

    protected constructor() {
    }

    public addRouteForDashboard(path: string, name: string, component: any, crud: boolean): RouteConfig[] {
        let routes = [{
            path: path,
            name: name,
            component: component,
            props: true,
        }];

        if (crud) {
            name += DashboardBuilderController.ROUTE_NAME_CRUD;

            routes.push({
                path: path + '/:dashboard_vo_action/:dashboard_vo_id',
                name: name,
                component: component,
                props: true,
            });

            name += DashboardBuilderController.ROUTE_NAME_CRUD_ALL;

            routes.push({
                path: path + '/:dashboard_vo_action/:dashboard_vo_id/:api_type_id_action',
                name: name,
                component: component,
                props: true,
            });
        }

        return routes;
    }
}