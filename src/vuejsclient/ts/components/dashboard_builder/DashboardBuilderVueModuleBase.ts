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
        await this.initializeWidget_ValueTable();
        await this.initializeWidget_DataTable();
    }

    private async initializeWidget_DataTable() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 18;
        Table.default_width = 45;
        Table.name = 'datatable';
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 21;
        Table.default_background = '#f5f5f5';
        Table.icon_component = 'Tablewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptions(null, null, true, 10, null, false, true, false, true, true, true, true), TableWidgetOptions.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import(/* webpackChunkName: "TableWidgetComponent" */ './widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import(/* webpackChunkName: "TableWidgetOptionsComponent" */ './widgets/table_widget/options/TableWidgetOptionsComponent'));
        Vue.component('Tablewidgeticoncomponent', () => import(/* webpackChunkName: "TableWidgetIconComponent" */ './widgets/table_widget/icon/TableWidgetIconComponent'));
    }

    private async initializeWidget_ValueTable() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 18;
        Table.default_width = 45;
        Table.name = 'valuetable';
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 20;
        Table.default_background = '#f5f5f5';
        Table.icon_component = 'Tablewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptions(null, null, false, 10, null, false, false, false, false, false, true, true), TableWidgetOptions.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import(/* webpackChunkName: "TableWidgetComponent" */ './widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import(/* webpackChunkName: "TableWidgetOptionsComponent" */ './widgets/table_widget/options/TableWidgetOptionsComponent'));
        Vue.component('Tablewidgeticoncomponent', () => import(/* webpackChunkName: "TableWidgetIconComponent" */ './widgets/table_widget/icon/TableWidgetIconComponent'));
    }

    private async initializeWidget_FieldValueFilter() {
        let fieldValueFilter = new DashboardWidgetVO();

        fieldValueFilter.default_height = 9;
        fieldValueFilter.default_width = 36;
        fieldValueFilter.name = 'fieldvaluefilter';
        fieldValueFilter.widget_component = 'Fieldvaluefilterwidgetcomponent';
        fieldValueFilter.options_component = 'Fieldvaluefilterwidgetoptionscomponent';
        fieldValueFilter.weight = 0;
        fieldValueFilter.default_background = '#f5f5f5';
        fieldValueFilter.icon_component = 'Fieldvaluefilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(fieldValueFilter, () => new FieldValueFilterWidgetOptions(null, true, 50), FieldValueFilterWidgetOptions.get_selected_fields);

        Vue.component('Fieldvaluefilterwidgetcomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetComponent" */ './widgets/field_value_filter_widget/FieldValueFilterWidgetComponent'));
        Vue.component('Fieldvaluefilterwidgetoptionscomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetOptionsComponent" */ './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent'));
        Vue.component('Fieldvaluefilterwidgeticoncomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetIconComponent" */ './widgets/field_value_filter_widget/icon/FieldValueFilterWidgetIconComponent'));
    }

    private async initializeWidget_Var() {
        let var_widget = new DashboardWidgetVO();

        var_widget.default_height = 12;
        var_widget.default_width = 27;
        var_widget.name = 'var';
        var_widget.widget_component = 'Varwidgetcomponent';
        var_widget.options_component = 'Varwidgetoptionscomponent';
        var_widget.weight = 10;
        var_widget.default_background = '#f5f5f5';
        var_widget.icon_component = 'Varwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(var_widget, () => new VarWidgetOptions(null, null, null, null), VarWidgetOptions.get_selected_fields);

        Vue.component('Varwidgetcomponent', () => import(/* webpackChunkName: "VarWidgetComponent" */ './widgets/var_widget/VarWidgetComponent'));
        Vue.component('Varwidgetoptionscomponent', () => import(/* webpackChunkName: "VarWidgetOptionsComponent" */ './widgets/var_widget/options/VarWidgetOptionsComponent'));
        Vue.component('Varwidgeticoncomponent', () => import(/* webpackChunkName: "VarWidgetIconComponent" */ './widgets/var_widget/icon/VarWidgetIconComponent'));
    }

    private async initializeWidget_PageSwitch() {
        let var_widget = new DashboardWidgetVO();

        var_widget.default_height = 6;
        var_widget.default_width = 20;
        var_widget.name = 'pageswitch';
        var_widget.widget_component = 'Pageswitchwidgetcomponent';
        var_widget.options_component = 'Pageswitchwidgetoptionscomponent';
        var_widget.weight = 5;
        var_widget.default_background = '#f5f5f5';
        var_widget.icon_component = 'Pageswitchwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(var_widget, () => new VarWidgetOptions(null, null, null, null), VarWidgetOptions.get_selected_fields);

        Vue.component('Varwidgetcomponent', () => import(/* webpackChunkName: "VarWidgetComponent" */ './widgets/var_widget/VarWidgetComponent'));
        Vue.component('Varwidgetoptionscomponent', () => import(/* webpackChunkName: "VarWidgetOptionsComponent" */ './widgets/var_widget/options/VarWidgetOptionsComponent'));
        Vue.component('Varwidgeticoncomponent', () => import(/* webpackChunkName: "VarWidgetIconComponent" */ './widgets/var_widget/icon/VarWidgetIconComponent'));
    }
}