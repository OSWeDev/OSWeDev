import Vue from 'vue';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import DashboardBuilderWidgetsController from './widgets/DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import TableWidgetOptions from './widgets/table_widget/options/TableWidgetOptions';
import VarWidgetOptions from './widgets/var_widget/options/VarWidgetOptions';

export default class DashboardBuilderVueModuleBase extends VueModuleBase {

    public static getInstance(): DashboardBuilderVueModuleBase {
        if (!DashboardBuilderVueModuleBase.instance) {
            DashboardBuilderVueModuleBase.instance = new DashboardBuilderVueModuleBase();
        }

        return DashboardBuilderVueModuleBase.instance;
    }

    protected static instance: DashboardBuilderVueModuleBase = null;

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

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleDashboardBuilder.POLICY_FO_ACCESS]) {
            return;
        }

        // On crée les routes names, mais pas les liens de menus qui seront créés dans le dashboard builder directement
        let url: string = "/dashboard/view/:dashboard_id";
        let main_route_name: string = 'Dashboard View';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "DashboardViewerComponent" */ './viewer/DashboardViewerComponent'),
            props: (route) => ({
                dashboard_id: parseInt(route.params.dashboard_id),
            })
        });

        await this.initializeDefaultWidgets();
    }

    private async initializeDefaultWidgets() {
        await this.initializeWidget_FieldValueFilter();
        await this.initializeWidget_Var();
        await this.initializeWidget_Table();
    }

    private async initializeWidget_Table() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 18;
        Table.default_width = 45;
        Table.icone_class = 'fa-table';
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 0;
        Table.default_background = '#f5f5f5';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptions(null, null, null, false, true, false, true, true, true, true));

        Vue.component('Tablewidgetcomponent', () => import(/* webpackChunkName: "TableWidgetComponent" */ './widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import(/* webpackChunkName: "TableWidgetOptionsComponent" */ './widgets/table_widget/options/TableWidgetOptionsComponent'));
    }

    private async initializeWidget_FieldValueFilter() {
        let fieldValueFilter = new DashboardWidgetVO();

        fieldValueFilter.default_height = 9;
        fieldValueFilter.default_width = 36;
        fieldValueFilter.icone_class = 'fa-filter';
        fieldValueFilter.widget_component = 'Fieldvaluefilterwidgetcomponent';
        fieldValueFilter.options_component = 'Fieldvaluefilterwidgetoptionscomponent';
        fieldValueFilter.weight = 0;
        fieldValueFilter.default_background = '#f5f5f5';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(fieldValueFilter, () => new FieldValueFilterWidgetOptions(null, true, 50));

        Vue.component('Fieldvaluefilterwidgetcomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetComponent" */ './widgets/field_value_filter_widget/FieldValueFilterWidgetComponent'));
        Vue.component('Fieldvaluefilterwidgetoptionscomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetOptionsComponent" */ './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent'));
    }

    private async initializeWidget_Var() {
        let var_widget = new DashboardWidgetVO();

        var_widget.default_height = 12;
        var_widget.default_width = 27;
        var_widget.icone_class = 'fa-bullseye';
        var_widget.widget_component = 'Varwidgetcomponent';
        var_widget.options_component = 'Varwidgetoptionscomponent';
        var_widget.weight = 0;
        var_widget.default_background = '#f5f5f5';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(var_widget, () => new VarWidgetOptions(null, null, null, null));

        Vue.component('Varwidgetcomponent', () => import(/* webpackChunkName: "VarWidgetComponent" */ './widgets/var_widget/VarWidgetComponent'));
        Vue.component('Varwidgetoptionscomponent', () => import(/* webpackChunkName: "VarWidgetOptionsComponent" */ './widgets/var_widget/options/VarWidgetOptionsComponent'));
    }
}