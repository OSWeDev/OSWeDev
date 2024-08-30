import DashboardBuilderController from '../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import VueModuleBase from '../../modules/VueModuleBase';

export default class CMSBuilderVueModuleBase extends VueModuleBase {

    protected static instance: CMSBuilderVueModuleBase = null;

    protected constructor() {

        super(ModuleDashboardBuilder.getInstance().name);

        if (!this.policies_needed) {
            this.policies_needed = [
                ModuleDashboardBuilder.POLICY_FO_ACCESS
            ];
        } else if (this.policies_needed.indexOf(ModuleDashboardBuilder.POLICY_FO_ACCESS) < 0) {
            this.policies_needed.push(ModuleDashboardBuilder.POLICY_FO_ACCESS);
        }
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): CMSBuilderVueModuleBase {
        if (!CMSBuilderVueModuleBase.instance) {
            CMSBuilderVueModuleBase.instance = new CMSBuilderVueModuleBase();
        }

        return CMSBuilderVueModuleBase.instance;
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleDashboardBuilder.POLICY_FO_ACCESS]) {
            return;
        }

        // On crée les routes names, mais pas les liens de menus qui seront créés dans le dashboard builder directement
        let url: string = "/cms/view/:dashboard_id";
        let main_route_name: string = 'CMS View';

        this.routes = this.routes.concat(DashboardBuilderController.getInstance().addRouteForDashboard(
            url,
            main_route_name,
            () => import('../dashboard_builder/viewer/DashboardViewerComponent'),
            true,
        ));

        url = "/cms_builder";
        main_route_name = 'CMSBuilder';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./CMSBuilderComponent'),
            props: (route) => ({
                dashboard_id: null
            })
        });

        url = "/cms_builder" + "/:dashboard_id";
        main_route_name = 'DashboardBuilder_id';

        this.routes = this.routes.concat(DashboardBuilderController.getInstance().addRouteForDashboard(
            url,
            main_route_name,
            () => import('./CMSBuilderComponent'),
            true,
        ));
    }
}