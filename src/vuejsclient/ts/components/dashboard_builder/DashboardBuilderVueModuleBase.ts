import Vue from 'vue';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import BulkOpsWidgetOptions from './widgets/bulkops_widget/options/BulkOpsWidgetOptions';
import ChecklistWidgetOptions from './widgets/checklist_widget/options/ChecklistWidgetOptions';
import DashboardBuilderWidgetsController from './widgets/DashboardBuilderWidgetsController';
import DOWFilterWidgetOptions from './widgets/dow_filter_widget/options/DOWFilterWidgetOptions';
import FieldValueFilterWidgetOptions from './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptions';
import MonthFilterWidgetOptions from './widgets/month_filter_widget/options/MonthFilterWidgetOptions';
import PageSwitchWidgetOptions from './widgets/page_switch_widget/options/PageSwitchWidgetOptions';
import TableWidgetOptions from './widgets/table_widget/options/TableWidgetOptions';
import VarWidgetOptions from './widgets/var_widget/options/VarWidgetOptions';
import YearFilterWidgetOptions from './widgets/year_filter_widget/options/YearFilterWidgetOptions';

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

        url = "/dashboard_builder";
        main_route_name = 'DashboardBuilder';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "DashboardBuilderComponent" */ './DashboardBuilderComponent'),
            props: (route) => ({
                dashboard_id: null
            })
        });

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

        await this.initializeWidget_DOWFilter();
        await this.initializeWidget_MonthFilter();
        await this.initializeWidget_YearFilter();

        await this.initializeWidget_Checklist();

        await this.initializeWidget_BulkOps();

        await this.initializeWidget_Var();

        await this.initializeWidget_ValueTable();
        await this.initializeWidget_DataTable();

        await this.initializeWidget_PageSwitch();
    }

    private async initializeWidget_BulkOps() {
        let BulkOps = new DashboardWidgetVO();

        BulkOps.default_height = 35;
        BulkOps.default_width = 12;
        BulkOps.name = 'bulkops';
        BulkOps.widget_component = 'Bulkopswidgetcomponent';
        BulkOps.options_component = 'Bulkopswidgetoptionscomponent';
        BulkOps.weight = 40;
        BulkOps.default_background = '#f5f5f5';
        BulkOps.icon_component = 'Bulkopswidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(BulkOps, () => new BulkOpsWidgetOptions(null, 10), BulkOpsWidgetOptions.get_selected_fields);

        Vue.component('Bulkopswidgetcomponent', () => import(/* webpackChunkName: "BulkOpsWidgetComponent" */ './widgets/bulkops_widget/BulkOpsWidgetComponent'));
        Vue.component('Bulkopswidgetoptionscomponent', () => import(/* webpackChunkName: "BulkOpsWidgetOptionsComponent" */ './widgets/bulkops_widget/options/BulkOpsWidgetOptionsComponent'));
        Vue.component('Bulkopswidgeticoncomponent', () => import(/* webpackChunkName: "BulkOpsWidgetIconComponent" */ './widgets/bulkops_widget/icon/BulkOpsWidgetIconComponent'));
    }

    private async initializeWidget_Checklist() {
        let Checklist = new DashboardWidgetVO();

        Checklist.default_height = 35;
        Checklist.default_width = 12;
        Checklist.name = 'checklist';
        Checklist.widget_component = 'Checklistwidgetcomponent';
        Checklist.options_component = 'Checklistwidgetoptionscomponent';
        Checklist.weight = 30;
        Checklist.default_background = '#f5f5f5';
        Checklist.icon_component = 'Checklistwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Checklist, () => new ChecklistWidgetOptions(10, null, false, true, true, true), ChecklistWidgetOptions.get_selected_fields);

        Vue.component('Checklistwidgetcomponent', () => import(/* webpackChunkName: "ChecklistWidgetComponent" */ './widgets/checklist_widget/ChecklistWidgetComponent'));
        Vue.component('Checklistwidgetoptionscomponent', () => import(/* webpackChunkName: "ChecklistWidgetOptionsComponent" */ './widgets/checklist_widget/options/ChecklistWidgetOptionsComponent'));
        Vue.component('Checklistwidgeticoncomponent', () => import(/* webpackChunkName: "ChecklistWidgetIconComponent" */ './widgets/checklist_widget/icon/ChecklistWidgetIconComponent'));
    }

    private async initializeWidget_DataTable() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 35;
        Table.default_width = 12;
        Table.name = 'datatable';
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 21;
        Table.default_background = '#f5f5f5';
        Table.icon_component = 'Tablewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptions(null, true, 100, null, false, true, false, true, true, true, true, true), TableWidgetOptions.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import(/* webpackChunkName: "TableWidgetComponent" */ './widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import(/* webpackChunkName: "TableWidgetOptionsComponent" */ './widgets/table_widget/options/TableWidgetOptionsComponent'));
        Vue.component('Tablewidgeticoncomponent', () => import(/* webpackChunkName: "TableWidgetIconComponent" */ './widgets/table_widget/icon/TableWidgetIconComponent'));
    }

    private async initializeWidget_ValueTable() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 35;
        Table.default_width = 12;
        Table.name = 'valuetable';
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 20;
        Table.default_background = '#f5f5f5';
        Table.icon_component = 'Tablewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptions(null, false, 100, null, false, false, false, false, false, true, true, true), TableWidgetOptions.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import(/* webpackChunkName: "TableWidgetComponent" */ './widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import(/* webpackChunkName: "TableWidgetOptionsComponent" */ './widgets/table_widget/options/TableWidgetOptionsComponent'));
        Vue.component('Tablewidgeticoncomponent', () => import(/* webpackChunkName: "TableWidgetIconComponent" */ './widgets/table_widget/icon/TableWidgetIconComponent'));
    }

    private async initializeWidget_FieldValueFilter() {
        let fieldValueFilter = new DashboardWidgetVO();

        fieldValueFilter.default_height = 5;
        fieldValueFilter.default_width = 3;
        fieldValueFilter.name = 'fieldvaluefilter';
        fieldValueFilter.widget_component = 'Fieldvaluefilterwidgetcomponent';
        fieldValueFilter.options_component = 'Fieldvaluefilterwidgetoptionscomponent';
        fieldValueFilter.weight = 0;
        fieldValueFilter.default_background = '#f5f5f5';
        fieldValueFilter.icon_component = 'Fieldvaluefilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(fieldValueFilter, () => new FieldValueFilterWidgetOptions(null, null, null, true, false, 50, false, false), FieldValueFilterWidgetOptions.get_selected_fields);

        Vue.component('Fieldvaluefilterwidgetcomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetComponent" */ './widgets/field_value_filter_widget/FieldValueFilterWidgetComponent'));
        Vue.component('Fieldvaluefilterwidgetoptionscomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetOptionsComponent" */ './widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent'));
        Vue.component('Fieldvaluefilterwidgeticoncomponent', () => import(/* webpackChunkName: "FieldValueFilterWidgetIconComponent" */ './widgets/field_value_filter_widget/icon/FieldValueFilterWidgetIconComponent'));
    }

    private async initializeWidget_DOWFilter() {
        let DOWFilter = new DashboardWidgetVO();

        DOWFilter.default_height = 5;
        DOWFilter.default_width = 3;
        DOWFilter.name = 'dowfilter';
        DOWFilter.widget_component = 'Dowfilterwidgetcomponent';
        DOWFilter.options_component = 'Dowfilterwidgetoptionscomponent';
        DOWFilter.weight = 1;
        DOWFilter.default_background = '#f5f5f5';
        DOWFilter.icon_component = 'Dowfilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(DOWFilter, () => new DOWFilterWidgetOptions(true, null, null), DOWFilterWidgetOptions.get_selected_fields);

        Vue.component('Dowfilterwidgetcomponent', () => import(/* webpackChunkName: "DOWFilterWidgetComponent" */ './widgets/dow_filter_widget/DOWFilterWidgetComponent'));
        Vue.component('Dowfilterwidgetoptionscomponent', () => import(/* webpackChunkName: "DOWFilterWidgetOptionsComponent" */ './widgets/dow_filter_widget/options/DOWFilterWidgetOptionsComponent'));
        Vue.component('Dowfilterwidgeticoncomponent', () => import(/* webpackChunkName: "DOWFilterWidgetIconComponent" */ './widgets/dow_filter_widget/icon/DOWFilterWidgetIconComponent'));
    }

    private async initializeWidget_MonthFilter() {
        let MonthFilter = new DashboardWidgetVO();

        MonthFilter.default_height = 5;
        MonthFilter.default_width = 4;
        MonthFilter.name = 'monthfilter';
        MonthFilter.widget_component = 'Monthfilterwidgetcomponent';
        MonthFilter.options_component = 'Monthfilterwidgetoptionscomponent';
        MonthFilter.weight = 2;
        MonthFilter.default_background = '#f5f5f5';
        MonthFilter.icon_component = 'Monthfilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(MonthFilter, () => new MonthFilterWidgetOptions(true, null, null, true, null, null, true, true, null, null), MonthFilterWidgetOptions.get_selected_fields);

        Vue.component('Monthfilterwidgetcomponent', () => import(/* webpackChunkName: "MonthFilterWidgetComponent" */ './widgets/month_filter_widget/MonthFilterWidgetComponent'));
        Vue.component('Monthfilterwidgetoptionscomponent', () => import(/* webpackChunkName: "MonthFilterWidgetOptionsComponent" */ './widgets/month_filter_widget/options/MonthFilterWidgetOptionsComponent'));
        Vue.component('Monthfilterwidgeticoncomponent', () => import(/* webpackChunkName: "MonthFilterWidgetIconComponent" */ './widgets/month_filter_widget/icon/MonthFilterWidgetIconComponent'));
    }

    private async initializeWidget_YearFilter() {
        let YearFilter = new DashboardWidgetVO();

        YearFilter.default_height = 5;
        YearFilter.default_width = 2;
        YearFilter.name = 'yearfilter';
        YearFilter.widget_component = 'Yearfilterwidgetcomponent';
        YearFilter.options_component = 'Yearfilterwidgetoptionscomponent';
        YearFilter.weight = 3;
        YearFilter.default_background = '#f5f5f5';
        YearFilter.icon_component = 'Yearfilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(YearFilter, () => new YearFilterWidgetOptions(true, null, null, true, null, null, true, true, null, null), YearFilterWidgetOptions.get_selected_fields);

        Vue.component('Yearfilterwidgetcomponent', () => import(/* webpackChunkName: "YearFilterWidgetComponent" */ './widgets/year_filter_widget/YearFilterWidgetComponent'));
        Vue.component('Yearfilterwidgetoptionscomponent', () => import(/* webpackChunkName: "YearFilterWidgetOptionsComponent" */ './widgets/year_filter_widget/options/YearFilterWidgetOptionsComponent'));
        Vue.component('Yearfilterwidgeticoncomponent', () => import(/* webpackChunkName: "YearFilterWidgetIconComponent" */ './widgets/year_filter_widget/icon/YearFilterWidgetIconComponent'));
    }

    private async initializeWidget_Var() {
        let var_widget = new DashboardWidgetVO();

        var_widget.default_height = 10;
        var_widget.default_width = 1;
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
        let pageswitch_widget = new DashboardWidgetVO();

        pageswitch_widget.default_height = 5;
        pageswitch_widget.default_width = 2;
        pageswitch_widget.name = 'pageswitch';
        pageswitch_widget.widget_component = 'Pageswitchwidgetcomponent';
        pageswitch_widget.options_component = 'Pageswitchwidgetoptionscomponent';
        pageswitch_widget.weight = 5;
        pageswitch_widget.default_background = '#f5f5f5';
        pageswitch_widget.icon_component = 'Pageswitchwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(pageswitch_widget, () => new PageSwitchWidgetOptions(null), () => null);

        Vue.component('Pageswitchwidgetcomponent', () => import(/* webpackChunkName: "PageSwitchWidgetComponent" */ './widgets/page_switch_widget/PageSwitchWidgetComponent'));
        Vue.component('Pageswitchwidgetoptionscomponent', () => import(/* webpackChunkName: "PageSwitchWidgetOptionsComponent" */ './widgets/page_switch_widget/options/PageSwitchWidgetOptionsComponent'));
        Vue.component('Pageswitchwidgeticoncomponent', () => import(/* webpackChunkName: "PageSwitchWidgetIconComponent" */ './widgets/page_switch_widget/icon/PageSwitchWidgetIconComponent'));
    }
}