import Vue from 'vue';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppBase from '../../../VueAppBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import DashboardBuilderWidgetsController from './widgets/DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import FieldValueFilterWidgetOptionsComponent from './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent';

export default class DashboardBuilderAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "DashboardBuilderAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-area-chart",
        []
    );

    public static getInstance(): DashboardBuilderAdminVueModule {
        if (!DashboardBuilderAdminVueModule.instance) {
            DashboardBuilderAdminVueModule.instance = new DashboardBuilderAdminVueModule();
        }

        return DashboardBuilderAdminVueModule.instance;
    }

    private static instance: DashboardBuilderAdminVueModule = null;

    private constructor() {

        super(ModuleDashboardBuilder.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS)) {
            return;
        }

        let url: string = "/dashboard_builder";
        let main_route_name: string = 'DashboardBuilder';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "DashboardBuilderComponent" */ './DashboardBuilderComponent'),
            props: (route) => ({
                dashboard_id: null
            })
        });
        let menuPointer = new MenuPointer(
            new MenuLeaf(main_route_name, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-area-chart"),
            DashboardBuilderAdminVueModule.DEFAULT_MENU_BRANCH
        );

        //TODO FIXME ajouter les liens pour chaque checklist
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();


        url = "/dashboard_builder" + "/:dashboard_id";
        main_route_name = 'DashboardBuilder_id';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "DashboardBuilderComponent" */ './DashboardBuilderComponent'),
            props: (route) => ({
                dashboard_id: parseInt(route.params.dashboard_id),
            })
        });

        await this.initializeDefaultWidgets();
    }

    private async initializeDefaultWidgets() {
        await this.initializeWidget_FieldValueFilter();
    }

    private async initializeWidget_FieldValueFilter() {
        let fieldValueFilter = new DashboardWidgetVO();

        fieldValueFilter.default_height = 1;
        fieldValueFilter.default_width = 2;
        fieldValueFilter.icone_class = 'fa-filter';
        fieldValueFilter.widget_component = 'Fieldvaluefilterwidgetcomponent';
        fieldValueFilter.options_component = 'Fieldvaluefilterwidgetoptionscomponent';
        fieldValueFilter.weight = 0;
        fieldValueFilter.default_background = '#f5f5f5';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(fieldValueFilter, () => new FieldValueFilterWidgetOptions(null, true, 50));

        Vue.component('Fieldvaluefilterwidgetcomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetComponent" */ './widgets/field_value_filter_widget/FieldValueFilterWidgetComponent'));
        Vue.component('Fieldvaluefilterwidgetoptionscomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetOptionsComponent" */ './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent'));
    }

}