import Vue from 'vue';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import WidgetOptionsVOManager from '../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import CMSBlocTextWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO';
import CMSCrudButtonsWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CMSCrudButtonsWidgetOptionsVO';
import CMSImageWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import CMSLinkButtonWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO';
import CMSVisionneusePdfWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CMSVisionneusePdfWidgetOptionsVO';
import CurrentUserFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CurrentUserFilterWidgetOptionsVO';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FavoritesFiltersVO from '../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import FavoritesFiltersWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import FieldValueFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import SuiviCompetencesWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/SuiviCompetencesWidgetOptionsVO';
import TableWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import VOFieldRefVO from '../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VarMixedChartWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';
import VarPieChartWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO';
import VarRadarChartWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/VarRadarChartWidgetOptionsVO';
import YearFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import DashboardBuilderVueController from './DashboardBuilderVueController';
import AdvancedDateFilterWidgetOptions from './widgets/advanced_date_filter_widget/options/AdvancedDateFilterWidgetOptions';
import BulkOpsWidgetOptions from './widgets/bulkops_widget/options/BulkOpsWidgetOptions';
import ChecklistWidgetOptions from './widgets/checklist_widget/options/ChecklistWidgetOptions';
import DOWFilterWidgetOptions from './widgets/dow_filter_widget/options/DOWFilterWidgetOptions';
import AdvancedStringFilter from './widgets/field_value_filter_widget/string/AdvancedStringFilter';
import MonthFilterWidgetOptions from './widgets/month_filter_widget/options/MonthFilterWidgetOptions';
import OseliaRunGraphWidgetComponent from './widgets/oselia_run_graph_widget/OseliaRunGraphWidgetComponent';
import OseliaThreadWidgetOptions from './widgets/oselia_thread_widget/options/OseliaThreadWidgetOptions';
import PageSwitchWidgetOptions from './widgets/page_switch_widget/options/PageSwitchWidgetOptions';
import SupervisionTypeWidgetOptions from './widgets/supervision_type_widget/options/SupervisionTypeWidgetOptions';
import SupervisionWidgetOptions from './widgets/supervision_widget/options/SupervisionWidgetOptions';
import VarChoroplethChartWidgetOptions from './widgets/var_choropleth_chart_widget/options/VarChoroplethChartWidgetOptions';
import VarWidgetOptions from './widgets/var_widget/options/VarWidgetOptions';
export default class DashboardBuilderVueModuleBase extends VueModuleBase {

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

    // istanbul ignore next: nothing to test
    public static getInstance(): DashboardBuilderVueModuleBase {
        if (!DashboardBuilderVueModuleBase.instance) {
            DashboardBuilderVueModuleBase.instance = new DashboardBuilderVueModuleBase();
        }

        return DashboardBuilderVueModuleBase.instance;
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleDashboardBuilder.POLICY_FO_ACCESS]) {
            return;
        }

        // On crée les routes names, mais pas les liens de menus qui seront créés dans le dashboard builder directement
        let url: string = "/dashboard/view/:dashboard_id";
        let main_route_name: string = 'Dashboard View';

        this.routes = this.routes.concat(DashboardBuilderVueController.addRouteForDashboard(
            url,
            main_route_name,
            () => import('./viewer/DashboardViewerComponent'),
            true,
        ));

        url = "/dashboard_builder";
        main_route_name = 'DashboardBuilder';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./DashboardBuilderComponent'),
            props: (route) => ({
                dashboard_id: null
            })
        });

        url = "/dashboard_builder" + "/:dashboard_id";
        main_route_name = 'DashboardBuilder_id';

        this.routes = this.routes.concat(DashboardBuilderVueController.addRouteForDashboard(
            url,
            main_route_name,
            () => import('./DashboardBuilderComponent'),
            true,
        ));

        await this.initializeDefaultWidgets();
    }

    private async initializeDefaultWidgets() {
        await all_promises([
            this.initializeWidget_FieldValueFilter(),

            this.initializeWidget_DOWFilter(),
            this.initializeWidget_MonthFilter(),
            this.initializeWidget_YearFilter(),
            this.initializeWidget_AdvancedDateFilter(),
            this.initializeWidget_CurrentUserFilter(),

            this.initializeWidget_VarPieChart(),
            this.initializeWidget_VarRadarChart(),
            this.initializeWidget_VarMixedChart(),
            this.initializeWidget_VarChoroplethChart(),

            this.initializeWidget_Checklist(),
            this.initializeWidget_Supervision(),
            this.initializeWidget_SupervisionType(),

            this.initializeWidget_BulkOps(),

            this.initializeWidget_Var(),
            this.initializeWidget_DataTable(),

            this.initializeWidget_PageSwitch(),
            this.initializeWidget_OseliaRunGraphWidget(),

            this.initializeWidget_ValidationFilters(),

            this.initializeWidget_ResetFilters(),
            this.initializeWidget_BlocText(),
            this.initializeWidget_SuiviCompetences(),

            this.initializeWidget_SaveFavoritesFilters(),

            this.initializeWidget_ShowFavoritesFilters(),

            this.initializeWidget_OseliaThread(),

            this.initializeWidget_PerfReportGraph(),

            this.initializeWidget_CMSBlocText(),
            this.initializeWidget_CMSImage(),
            this.initializeWidget_CMSLinkButton(),
            this.initializeWidget_CMSLikeButton(),
            this.initializeWidget_CMSCrudButtons(),
            this.initializeWidget_CMSPrintParam(),
            this.initializeWidget_CMSVisionneusePdf(),
            this.initializeWidget_CMSBooleanButton(),

            this.initializeWidget_TemplateConsultation_CrudButtons(),
            this.initializeWidget_TemplateConsultation_VisionneusePdf(),
            this.initializeWidget_TemplateConsultation_LinkButton(),
            this.initializeWidget_TemplateConsultation_Image(),
            this.initializeWidget_TemplateConsultation_BlocText(),
        ]);
    }

    private async initializeWidget_PerfReportGraph() {
        const PerfReportGraph = new DashboardWidgetVO();

        PerfReportGraph.default_height = 35;
        PerfReportGraph.default_width = 12;
        PerfReportGraph.name = DashboardWidgetVO.WIDGET_NAME_perfreportgraph;
        PerfReportGraph.widget_component = 'Perfreportgraphwidgetcomponent';
        PerfReportGraph.options_component = 'Perfreportgraphwidgetoptionscomponent';
        PerfReportGraph.weight = 50;
        PerfReportGraph.default_background = '#f5f5f5';
        PerfReportGraph.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-scatter-bubble' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(PerfReportGraph, null, null);

        Vue.component('Perfreportgraphwidgetcomponent', () => import('./widgets/perf_report_graph_widget/PerfReportGraphWidgetComponent'));
        Vue.component('Perfreportgraphwidgetoptionscomponent', () => import('./widgets/perf_report_graph_widget/options/PerfReportGraphWidgetOptionsComponent'));
    }


    private async initializeWidget_BulkOps() {
        const BulkOps = new DashboardWidgetVO();

        BulkOps.default_height = 35;
        BulkOps.default_width = 12;
        BulkOps.name = DashboardWidgetVO.WIDGET_NAME_bulkops;
        BulkOps.widget_component = 'Bulkopswidgetcomponent';
        BulkOps.options_component = 'Bulkopswidgetoptionscomponent';
        BulkOps.weight = 40;
        BulkOps.default_background = '#f5f5f5';
        BulkOps.icon_html = `
        <i class='fa-lg fa-fw fa fa-cogs' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(BulkOps, () => new BulkOpsWidgetOptions(null, 10), BulkOpsWidgetOptions.get_selected_fields);

        Vue.component('Bulkopswidgetcomponent', () => import('./widgets/bulkops_widget/BulkOpsWidgetComponent'));
        Vue.component('Bulkopswidgetoptionscomponent', () => import('./widgets/bulkops_widget/options/BulkOpsWidgetOptionsComponent'));
    }

    private async initializeWidget_Checklist() {
        const Checklist = new DashboardWidgetVO();

        Checklist.default_height = 35;
        Checklist.default_width = 12;
        Checklist.name = DashboardWidgetVO.WIDGET_NAME_checklist;
        Checklist.widget_component = 'Checklistwidgetcomponent';
        Checklist.options_component = 'Checklistwidgetoptionscomponent';
        Checklist.weight = 30;
        Checklist.default_background = '#f5f5f5';
        Checklist.icon_html = `
        <i class='.fa-lg.fa-fw.fa.fa-check-circle"></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(Checklist, () => new ChecklistWidgetOptions(10, null, false, true, true, true), ChecklistWidgetOptions.get_selected_fields);

        Vue.component('Checklistwidgetcomponent', () => import('./widgets/checklist_widget/ChecklistWidgetComponent'));
        Vue.component('Checklistwidgetoptionscomponent', () => import('./widgets/checklist_widget/options/ChecklistWidgetOptionsComponent'));
    }

    private async initializeWidget_Supervision() {
        const supervision = new DashboardWidgetVO();

        supervision.default_height = 35;
        supervision.default_width = 12;
        supervision.name = DashboardWidgetVO.WIDGET_NAME_supervision;
        supervision.widget_component = 'Supervisionwidgetcomponent';
        supervision.options_component = 'Supervisionwidgetoptionscomponent';
        supervision.weight = 31;
        supervision.default_background = '#f5f5f5';
        supervision.icon_html = `
        <i class='fa-lg fa-fw fa fa-duotone fa-list-check' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(supervision, () => new SupervisionWidgetOptions(100, [], true, true, 30, true), SupervisionWidgetOptions.get_selected_fields);

        Vue.component('Supervisionwidgetcomponent', () => import('./widgets/supervision_widget/SupervisionWidgetComponent'));
        Vue.component('Supervisionwidgetoptionscomponent', () => import('./widgets/supervision_widget/options/SupervisionWidgetOptionsComponent'));
    }

    private async initializeWidget_SupervisionType() {
        const supervision_type = new DashboardWidgetVO();

        supervision_type.default_height = 5;
        supervision_type.default_width = 3;
        supervision_type.name = DashboardWidgetVO.WIDGET_NAME_supervision_type;
        supervision_type.widget_component = 'Supervisiontypewidgetcomponent';
        supervision_type.options_component = 'Supervisiontypewidgetoptionscomponent';
        supervision_type.weight = 32;
        supervision_type.default_background = '#f5f5f5';
        supervision_type.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-tasks' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(supervision_type, () => new SupervisionTypeWidgetOptions([]), SupervisionTypeWidgetOptions.get_selected_fields);

        Vue.component('Supervisiontypewidgetcomponent', () => import('./widgets/supervision_type_widget/SupervisionTypeWidgetComponent'));
        Vue.component('Supervisiontypewidgetoptionscomponent', () => import('./widgets/supervision_type_widget/options/SupervisionTypeWidgetOptionsComponent'));
    }

    private async initializeWidget_DataTable() {
        const Table = new DashboardWidgetVO();

        Table.default_height = 35;
        Table.default_width = 12;
        Table.name = DashboardWidgetVO.WIDGET_NAME_datatable;
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 21;
        Table.default_background = '#f5f5f5';
        Table.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-table fa-stack-2x'></i>
            <i class='fa-solid fa-pencil-square fa-stack-1x' style="position: absolute; left: 0px; bottom: 0px; width: auto; height: auto; color: dodgerblue; background: white; padding: 1px 3px; margin: 0; line-height: 1.1em;"></i>
        </div>
        `;

        await WidgetOptionsVOManager.register_widget_type(Table, () => new TableWidgetOptionsVO(
            null, true, 100, null, false, true, false, true, true, true, true, true, true, true, true, false, null, false, 5, false,
            false, null, false, true, true, true, false, false, false, false, false, false, [], false, false, [], null
        ), TableWidgetOptionsVO.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import('./widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import('./widgets/table_widget/options/TableWidgetOptionsComponent'));
    }

    private async initializeWidget_OseliaThread() {
        const widget = new DashboardWidgetVO();

        widget.default_height = 35;
        widget.default_width = 6;
        widget.name = DashboardWidgetVO.WIDGET_NAME_oseliathread;
        widget.widget_component = 'Oseliathreadwidgetcomponent';
        widget.options_component = 'Oseliathreadwidgetoptionscomponent';
        widget.weight = 99;
        widget.default_background = '#f5f5f5';
        widget.icon_html = `
        <i class='fa-duotone fa-comments'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(widget, () => new OseliaThreadWidgetOptions(), OseliaThreadWidgetOptions.get_selected_fields);

        Vue.component('Oseliathreadwidgetcomponent', () => import('./widgets/oselia_thread_widget/OseliaThreadWidgetComponent'));
        Vue.component('Oseliathreadwidgetoptionscomponent', () => import('./widgets/oselia_thread_widget/options/OseliaThreadWidgetOptionsComponent'));
    }


    private async initializeWidget_FieldValueFilter() {
        const fieldValueFilter = new DashboardWidgetVO();

        fieldValueFilter.default_height = 5;
        fieldValueFilter.default_width = 3;
        fieldValueFilter.name = DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter;
        fieldValueFilter.widget_component = 'Fieldvaluefilterwidgetcomponent';
        fieldValueFilter.options_component = 'Fieldvaluefilterwidgetoptionscomponent';
        fieldValueFilter.weight = 0;
        fieldValueFilter.default_background = '#f5f5f5';
        fieldValueFilter.icon_html = `
        <i class='fa-lg fa-fw fa fa-filter' aria-hidden='true'></i>
        `;
        fieldValueFilter.is_filter = true;

        await WidgetOptionsVOManager.register_widget_type(fieldValueFilter, () => new FieldValueFilterWidgetOptionsVO(
            null, null, null, true, false, FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_1, 50, false, false, null, false, AdvancedStringFilter.FILTER_TYPE_CONTIENT, false, false, null, null, null, null, null, false, false, false, null, null, null, null, false, null, false, false, false, null, null, false, false, false, null, null, null
        ), FieldValueFilterWidgetOptionsVO.get_selected_fields);

        Vue.component('Fieldvaluefilterwidgetcomponent', () => import('./widgets/field_value_filter_widget/FieldValueFilterWidgetComponent'));
        Vue.component('Fieldvaluefilterwidgetoptionscomponent', () => import('./widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent'));
    }

    private async initializeWidget_DOWFilter() {
        const DOWFilter = new DashboardWidgetVO();

        DOWFilter.default_height = 5;
        DOWFilter.default_width = 3;
        DOWFilter.name = DashboardWidgetVO.WIDGET_NAME_dowfilter;
        DOWFilter.widget_component = 'Dowfilterwidgetcomponent';
        DOWFilter.options_component = 'Dowfilterwidgetoptionscomponent';
        DOWFilter.weight = 1;
        DOWFilter.default_background = '#f5f5f5';
        DOWFilter.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">7</div>
        `;

        await WidgetOptionsVOManager.register_widget_type(DOWFilter, () => new DOWFilterWidgetOptions(true, null, null), DOWFilterWidgetOptions.get_selected_fields);

        Vue.component('Dowfilterwidgetcomponent', () => import('./widgets/dow_filter_widget/DOWFilterWidgetComponent'));
        Vue.component('Dowfilterwidgetoptionscomponent', () => import('./widgets/dow_filter_widget/options/DOWFilterWidgetOptionsComponent'));
    }

    private async initializeWidget_MonthFilter() {
        const MonthFilter = new DashboardWidgetVO();

        MonthFilter.default_height = 5;
        MonthFilter.default_width = 4;
        MonthFilter.name = DashboardWidgetVO.WIDGET_NAME_monthfilter;
        MonthFilter.widget_component = 'Monthfilterwidgetcomponent';
        MonthFilter.options_component = 'Monthfilterwidgetoptionscomponent';
        MonthFilter.weight = 2;
        MonthFilter.default_background = '#f5f5f5';
        MonthFilter.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">31</div>
        `;

        await WidgetOptionsVOManager.register_widget_type(MonthFilter, () => new MonthFilterWidgetOptions(true, null, null, false, 1, 12, false, false, null, null, false, null, false), MonthFilterWidgetOptions.get_selected_fields);

        Vue.component('Monthfilterwidgetcomponent', () => import('./widgets/month_filter_widget/MonthFilterWidgetComponent'));
        Vue.component('Monthfilterwidgetoptionscomponent', () => import('./widgets/month_filter_widget/options/MonthFilterWidgetOptionsComponent'));
    }


    private async initializeWidget_AdvancedDateFilter() {
        const AdvancedDateFilter = new DashboardWidgetVO();

        AdvancedDateFilter.default_height = 5;
        AdvancedDateFilter.default_width = 3;
        AdvancedDateFilter.name = DashboardWidgetVO.WIDGET_NAME_advanceddatefilter;
        AdvancedDateFilter.widget_component = 'Advanceddatefilterwidgetcomponent';
        AdvancedDateFilter.options_component = 'Advanceddatefilterwidgetoptionscomponent';
        AdvancedDateFilter.weight = 4;
        AdvancedDateFilter.default_background = '#f5f5f5';
        AdvancedDateFilter.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">X</div>
        `;

        await WidgetOptionsVOManager.register_widget_type(
            AdvancedDateFilter,
            () => new AdvancedDateFilterWidgetOptions(true, null, null, null, false, null, false, false, false, false, null, false, false, null, null),
            AdvancedDateFilterWidgetOptions.get_selected_fields
        );

        Vue.component('Advanceddatefilterwidgetcomponent', () => import('./widgets/advanced_date_filter_widget/AdvancedDateFilterWidgetComponent'));
        Vue.component('Advanceddatefilterwidgetoptionscomponent', () => import('./widgets/advanced_date_filter_widget/options/AdvancedDateFilterWidgetOptionsComponent'));
    }

    private async initializeWidget_CurrentUserFilter() {
        const CurrentUserFilter = new DashboardWidgetVO();

        CurrentUserFilter.default_height = 5;
        CurrentUserFilter.default_width = 2;
        CurrentUserFilter.name = DashboardWidgetVO.WIDGET_NAME_currentuserfilter;
        CurrentUserFilter.widget_component = 'Currentuserfilterwidgetcomponent';
        CurrentUserFilter.options_component = 'Currentuserfilterwidgetoptionscomponent';
        CurrentUserFilter.weight = 19;
        CurrentUserFilter.default_background = '#f5f5f5';
        CurrentUserFilter.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-user fa-stack-2x'></i>
            <i class='fa-solid fa-bullseye fa-stack-1x'></i>
        </div>
        `;
        CurrentUserFilter.is_filter = true;

        await WidgetOptionsVOManager.register_widget_type(
            CurrentUserFilter,
            () => new CurrentUserFilterWidgetOptionsVO(),
            null
        );

        Vue.component('Currentuserfilterwidgetcomponent', () => import('./widgets/current_user_filter_widget/CurrentUserFilterWidgetComponent'));
        Vue.component('Currentuserfilterwidgetoptionscomponent', () => import('./widgets/current_user_filter_widget/options/CurrentUserFilterWidgetOptionsComponent'));
    }

    private async initializeWidget_VarPieChart() {
        const VarPieChart = new DashboardWidgetVO();

        VarPieChart.default_height = 10;
        VarPieChart.default_width = 2;
        VarPieChart.name = DashboardWidgetVO.WIDGET_NAME_varpiechart;
        VarPieChart.widget_component = 'Varpiechartwidgetcomponent';
        VarPieChart.options_component = 'Varpiechartwidgetoptionscomponent';
        VarPieChart.weight = 15;
        VarPieChart.default_background = '#f5f5f5';
        VarPieChart.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-pie' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(VarPieChart, () => VarPieChartWidgetOptionsVO.createDefault(), VarPieChartWidgetOptionsVO.get_selected_fields);

        Vue.component('Varpiechartwidgetcomponent', () => import('./widgets/var_pie_chart_widget/VarPieChartWidgetComponent'));
        Vue.component('Varpiechartwidgetoptionscomponent', () => import('./widgets/var_pie_chart_widget/options/VarPieChartWidgetOptionsComponent'));
    }

    private async initializeWidget_VarChoroplethChart() {
        const VarChoroplethChart = new DashboardWidgetVO();

        VarChoroplethChart.default_height = 10;
        VarChoroplethChart.default_width = 2;
        VarChoroplethChart.name = DashboardWidgetVO.WIDGET_NAME_varchoroplethchart;
        VarChoroplethChart.widget_component = 'Varchoroplethchartwidgetcomponent';
        VarChoroplethChart.options_component = 'Varchoroplethchartwidgetoptionscomponent';
        VarChoroplethChart.weight = 15;
        VarChoroplethChart.default_background = '#f5f5f5';
        VarChoroplethChart.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-map-location-dot' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(VarChoroplethChart, () => VarChoroplethChartWidgetOptions.createDefault(), VarChoroplethChartWidgetOptions.get_selected_fields);

        Vue.component('Varchoroplethchartwidgetcomponent', () => import('./widgets/var_choropleth_chart_widget/VarChoroplethChartWidgetComponent'));
        Vue.component('Varchoroplethchartwidgetoptionscomponent', () => import('./widgets/var_choropleth_chart_widget/options/VarChoroplethChartWidgetOptionsComponent'));
    }

    private async initializeWidget_VarRadarChart() {
        const VarRadarChart = new DashboardWidgetVO();

        VarRadarChart.default_height = 10;
        VarRadarChart.default_width = 2;
        VarRadarChart.name = DashboardWidgetVO.WIDGET_NAME_varradarchart;
        VarRadarChart.widget_component = 'Varradarchartwidgetcomponent';
        VarRadarChart.options_component = 'Varradarchartwidgetoptionscomponent';
        VarRadarChart.weight = 15;
        VarRadarChart.default_background = '#f5f5f5';
        VarRadarChart.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-radar' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(VarRadarChart, () => VarRadarChartWidgetOptionsVO.createDefault(), VarRadarChartWidgetOptionsVO.get_selected_fields);

        Vue.component('Varradarchartwidgetcomponent', () => import('./widgets/var_radar_chart_widget/VarRadarChartWidgetComponent'));
        Vue.component('Varradarchartwidgetoptionscomponent', () => import('./widgets/var_radar_chart_widget/options/VarRadarChartWidgetOptionsComponent'));
    }

    private async initializeWidget_VarMixedChart() {
        const VarMixedChart = new DashboardWidgetVO();

        VarMixedChart.default_height = 10;
        VarMixedChart.default_width = 2;
        VarMixedChart.name = DashboardWidgetVO.WIDGET_NAME_varmixedcharts;
        VarMixedChart.widget_component = 'Varmixedchartswidgetcomponent';
        VarMixedChart.options_component = 'Varmixedchartswidgetoptionscomponent';
        VarMixedChart.weight = 15;
        VarMixedChart.default_background = '#f5f5f5';
        VarMixedChart.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-mixed' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(VarMixedChart, () => VarMixedChartWidgetOptionsVO.createDefault(), VarMixedChartWidgetOptionsVO.get_selected_fields);

        Vue.component('Varmixedchartswidgetcomponent', () => import('./widgets/var_mixed_charts_widget/VarMixedChartsWidgetComponent'));
        Vue.component('Varmixedchartswidgetoptionscomponent', () => import('./widgets/var_mixed_charts_widget/options/VarMixedChartsWidgetOptionsComponent'));
    }

    private async initializeWidget_YearFilter() {
        const YearFilter = new DashboardWidgetVO();

        YearFilter.default_height = 5;
        YearFilter.default_width = 2;
        YearFilter.name = DashboardWidgetVO.WIDGET_NAME_yearfilter;
        YearFilter.widget_component = 'Yearfilterwidgetcomponent';
        YearFilter.options_component = 'Yearfilterwidgetoptionscomponent';
        YearFilter.weight = 3;
        YearFilter.default_background = '#f5f5f5';
        YearFilter.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">365</div>
        `;

        await WidgetOptionsVOManager.register_widget_type(YearFilter, () => new YearFilterWidgetOptionsVO(true, null, null, true, -2, 2, true, true, 0, 0, false, null, false), YearFilterWidgetOptionsVO.get_selected_fields);

        Vue.component('Yearfilterwidgetcomponent', () => import('./widgets/year_filter_widget/YearFilterWidgetComponent'));
        Vue.component('Yearfilterwidgetoptionscomponent', () => import('./widgets/year_filter_widget/options/YearFilterWidgetOptionsComponent'));
    }

    private async initializeWidget_ValidationFilters() {
        const ValidationFilters = new DashboardWidgetVO();

        ValidationFilters.default_height = 5;
        ValidationFilters.default_width = 2;
        ValidationFilters.name = DashboardWidgetVO.WIDGET_NAME_validationfilters;
        ValidationFilters.widget_component = 'Validationfilterswidgetcomponent';
        ValidationFilters.options_component = 'Validationfilterswidgetoptionscomponent';
        ValidationFilters.weight = 3;
        ValidationFilters.default_background = '#f5f5f5';
        ValidationFilters.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-check fa-stack-1x'></i>
        </div>
        `;
        ValidationFilters.is_validation_filters = true;
        ValidationFilters.is_filter = true;

        await WidgetOptionsVOManager.register_widget_type(ValidationFilters, null, null);

        Vue.component('Validationfilterswidgetcomponent', () => import('./widgets/validation_filters_widget/ValidationFiltersWidgetComponent'));
        Vue.component('Validationfilterswidgetoptionscomponent', () => import('./widgets/validation_filters_widget/options/ValidationFiltersWidgetOptionsComponent'));
    }

    private async initializeWidget_SaveFavoritesFilters() {
        const SaveFavoritesFilters = new DashboardWidgetVO();

        SaveFavoritesFilters.default_height = 5;
        SaveFavoritesFilters.default_width = 2;
        SaveFavoritesFilters.name = DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters;
        SaveFavoritesFilters.widget_component = 'Savefavoritesfilterswidgetcomponent';
        SaveFavoritesFilters.options_component = 'Favoritesfilterswidgetoptionscomponent';
        SaveFavoritesFilters.weight = 3;
        SaveFavoritesFilters.default_background = '#f5f5f5';
        SaveFavoritesFilters.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-save fa-stack-1x'></i>
        </div>
        `;

        await WidgetOptionsVOManager.register_widget_type(
            SaveFavoritesFilters,
            () => new FavoritesFiltersWidgetOptionsVO(
                new VOFieldRefVO().from({
                    api_type_id: FavoritesFiltersVO.API_TYPE_ID,
                    field_id: "name"
                }),
            ),
            null
        );

        Vue.component('Savefavoritesfilterswidgetcomponent', () => import('./widgets/favorites_filters_widget/save_favorites_filters_widget/SaveFavoritesFiltersWidgetComponent'));
        Vue.component('Favoritesfilterswidgetoptionscomponent', () => import('./widgets/favorites_filters_widget/options/FavoritesFiltersWidgetOptionsComponent'));
    }

    private async initializeWidget_ShowFavoritesFilters() {
        const ShowFavoritesFilters = new DashboardWidgetVO();

        ShowFavoritesFilters.default_height = 5;
        ShowFavoritesFilters.default_width = 2;
        ShowFavoritesFilters.name = DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters;
        ShowFavoritesFilters.widget_component = 'Showfavoritesfilterswidgetcomponent';
        ShowFavoritesFilters.options_component = 'Favoritesfilterswidgetoptionscomponent';
        ShowFavoritesFilters.weight = 3;
        ShowFavoritesFilters.default_background = '#f5f5f5';
        ShowFavoritesFilters.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-eye fa-stack-1x'></i>
        </div>
        `;

        await WidgetOptionsVOManager.register_widget_type(
            ShowFavoritesFilters,
            () => new FavoritesFiltersWidgetOptionsVO(
                new VOFieldRefVO().from({
                    api_type_id: FavoritesFiltersVO.API_TYPE_ID,
                    field_id: "name"
                }),
            ),
            null
        );

        Vue.component('Showfavoritesfilterswidgetcomponent', () => import('./widgets/favorites_filters_widget/show_favorites_filters_widget/ShowFavoritesFiltersWidgetComponent'));
        Vue.component('Favoritesfilterswidgetoptionscomponent', () => import('./widgets/favorites_filters_widget/options/FavoritesFiltersWidgetOptionsComponent'));
    }

    private async initializeWidget_ResetFilters() {
        const ResetFilters = new DashboardWidgetVO();

        ResetFilters.default_height = 5;
        ResetFilters.default_width = 2;
        ResetFilters.name = DashboardWidgetVO.WIDGET_NAME_resetfilters;
        ResetFilters.widget_component = 'Resetfilterswidgetcomponent';
        ResetFilters.options_component = 'Resetfilterswidgetoptionscomponent';
        ResetFilters.weight = 3;
        ResetFilters.default_background = '#f5f5f5';
        ResetFilters.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-redo fa-stack-1x'></i>
        </div>
        `;
        ResetFilters.is_filter = true;

        await WidgetOptionsVOManager.register_widget_type(ResetFilters, null, null);

        Vue.component('Resetfilterswidgetcomponent', () => import('./widgets/reset_filters_widget/ResetFiltersWidgetComponent'));
        Vue.component('Resetfilterswidgetoptionscomponent', () => import('./widgets/reset_filters_widget/options/ResetFiltersWidgetOptionsComponent'));
    }

    private async initializeWidget_BlocText() {
        const BlocText = new DashboardWidgetVO();

        BlocText.default_height = 5;
        BlocText.default_width = 2;
        BlocText.name = DashboardWidgetVO.WIDGET_NAME_bloctext;
        BlocText.widget_component = 'BlocTextwidgetcomponent';
        BlocText.options_component = 'BlocTextwidgetoptionscomponent';
        BlocText.weight = 3;
        BlocText.default_background = '#f5f5f5';
        BlocText.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-text'></i>
        </div>
        `;
        BlocText.is_filter = true;

        await WidgetOptionsVOManager.register_widget_type(BlocText, null, null);

        Vue.component('BlocTextwidgetcomponent', () => import('./widgets/bloc_text_widget/BlocTextWidgetComponent'));
        Vue.component('BlocTextwidgetoptionscomponent', () => import('./widgets/bloc_text_widget/options/BlocTextWidgetOptionsComponent'));
    }
    private async initializeWidget_SuiviCompetences() {
        const SuiviCompetences = new DashboardWidgetVO();

        SuiviCompetences.default_height = 5;
        SuiviCompetences.default_width = 2;
        SuiviCompetences.name = DashboardWidgetVO.WIDGET_NAME_suivicompetences;
        SuiviCompetences.widget_component = 'SuiviCompetenceswidgetcomponent';
        SuiviCompetences.options_component = 'SuiviCompetenceswidgetoptionscomponent';
        SuiviCompetences.weight = 3;
        SuiviCompetences.default_background = '#f5f5f5';
        SuiviCompetences.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-memo-circle-check'></i>
        </div>
        `;
        SuiviCompetences.is_filter = true;

        await WidgetOptionsVOManager.register_widget_type(
            SuiviCompetences,
            () => new SuiviCompetencesWidgetOptionsVO(null, null, null),
            null
        );

        Vue.component('SuiviCompetenceswidgetcomponent', () => import('./widgets/suivi_competences_widget/SuiviCompetencesWidgetComponent'));
        Vue.component('SuiviCompetenceswidgetoptionscomponent', () => import('./widgets/suivi_competences_widget/options/SuiviCompetencesWidgetOptionsComponent'));
    }

    private async initializeWidget_Var() {
        const var_widget = new DashboardWidgetVO();

        var_widget.default_height = 10;
        var_widget.default_width = 1;
        var_widget.name = DashboardWidgetVO.WIDGET_NAME_var;
        var_widget.widget_component = 'Varwidgetcomponent';
        var_widget.options_component = 'Varwidgetoptionscomponent';
        var_widget.weight = 10;
        var_widget.default_background = '#f5f5f5';
        var_widget.icon_html = `
        <i class='fa-lg fa-fw fa fa-bullseye' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(var_widget, () => new VarWidgetOptions(null, null, null, null, null, null, null), VarWidgetOptions.get_selected_fields);

        Vue.component('Varwidgetcomponent', () => import('./widgets/var_widget/VarWidgetComponent'));
        Vue.component('Varwidgetoptionscomponent', () => import('./widgets/var_widget/options/VarWidgetOptionsComponent'));
    }

    private async initializeWidget_PageSwitch() {
        const pageswitch_widget = new DashboardWidgetVO();

        pageswitch_widget.default_height = 5;
        pageswitch_widget.default_width = 2;
        pageswitch_widget.name = DashboardWidgetVO.WIDGET_NAME_pageswitch;
        pageswitch_widget.widget_component = 'Pageswitchwidgetcomponent';
        pageswitch_widget.options_component = 'Pageswitchwidgetoptionscomponent';
        pageswitch_widget.weight = 5;
        pageswitch_widget.default_background = '#f5f5f5';
        pageswitch_widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-file fa-stack-2x'></i>
            <i class='fa-solid fa-external-link-square fa-stack-1x'></i>
        </div>
        `;

        await WidgetOptionsVOManager.register_widget_type(pageswitch_widget, () => new PageSwitchWidgetOptions(null), () => null);

        Vue.component('Pageswitchwidgetcomponent', () => import('./widgets/page_switch_widget/PageSwitchWidgetComponent'));
        Vue.component('Pageswitchwidgetoptionscomponent', () => import('./widgets/page_switch_widget/options/PageSwitchWidgetOptionsComponent'));
    }

    private async initializeWidget_OseliaRunGraphWidget() {
        const OseliaRunGraphWidget = new DashboardWidgetVO();

        OseliaRunGraphWidget.default_height = 5;
        OseliaRunGraphWidget.default_width = 4;
        OseliaRunGraphWidget.name = DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget;
        OseliaRunGraphWidget.widget_component = 'Oseliarungraphwidgetcomponent';
        OseliaRunGraphWidget.options_component = 'Oseliarungraphwidgetoptionscomponent';
        OseliaRunGraphWidget.weight = 2;
        OseliaRunGraphWidget.default_background = '#f5f5f5';
        OseliaRunGraphWidget.icon_html = `
        <i class='fa-lg fa-fw fa fa-chart-diagram' aria-hidden='true'></i>
        `;

        await WidgetOptionsVOManager.register_widget_type(OseliaRunGraphWidget, () => new OseliaRunGraphWidgetComponent(), () => null);

        Vue.component('Oseliarungraphwidgetcomponent', () => import('./widgets/oselia_run_graph_widget/OseliaRunGraphWidgetComponent'));
        Vue.component('Oseliarungraphwidgetoptionscomponent', () => import('./widgets/oselia_run_graph_widget/options/OseliaRunGraphWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSBlocText() {
        const CMSBlocText = new DashboardWidgetVO();

        CMSBlocText.default_height = 5;
        CMSBlocText.default_width = 2;
        CMSBlocText.name = DashboardWidgetVO.WIDGET_NAME_cmsbloctext;
        CMSBlocText.widget_component = 'CMSBlocTextwidgetcomponent';
        CMSBlocText.options_component = 'CMSBlocTextwidgetoptionscomponent';
        CMSBlocText.weight = 3;
        CMSBlocText.default_background = '#f5f5f5';
        CMSBlocText.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-text'></i>
        </div>
        `;
        CMSBlocText.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSBlocText, () =>
            CMSBlocTextWidgetOptionsVO.createNew(
                "",
                "",
                "",
                "",
                false,
                null,
                null,
                null,
                null,
                false,
                false,
                false,
                false,
                "",
                "",
                "",
                "",
                "",
            ), null);

        Vue.component('CMSBlocTextwidgetcomponent', () => import('./widgets/cms_bloc_text_widget/CMSBlocTextWidgetComponent'));
        Vue.component('CMSBlocTextwidgetoptionscomponent', () => import('./widgets/cms_bloc_text_widget/options/CMSBlocTextWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSImage() {
        const CMSImage = new DashboardWidgetVO();

        CMSImage.default_height = 5;
        CMSImage.default_width = 2;
        CMSImage.name = DashboardWidgetVO.WIDGET_NAME_cmsimage;
        CMSImage.widget_component = 'CMSImagewidgetcomponent';
        CMSImage.options_component = 'CMSImagewidgetoptionscomponent';
        CMSImage.weight = 3;
        CMSImage.default_background = '#f5f5f5';
        CMSImage.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-image'></i>
        </div>
        `;
        CMSImage.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSImage, () =>
            CMSImageWidgetOptionsVO.createNew(
                null,
                0,
                false,
                null,
                CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE,
                CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR,
            ), null);

        Vue.component('CMSImagewidgetcomponent', () => import('./widgets/cms_image_widget/CMSImageWidgetComponent'));
        Vue.component('CMSImagewidgetoptionscomponent', () => import('./widgets/cms_image_widget/options/CMSImageWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSLinkButton() {
        const CMSLinkButton = new DashboardWidgetVO();

        CMSLinkButton.default_height = 5;
        CMSLinkButton.default_width = 2;
        CMSLinkButton.name = DashboardWidgetVO.WIDGET_NAME_cmslinkbutton;
        CMSLinkButton.widget_component = 'CMSLinkButtonwidgetcomponent';
        CMSLinkButton.options_component = 'CMSLinkButtonwidgetoptionscomponent';
        CMSLinkButton.weight = 3;
        CMSLinkButton.default_background = '#f5f5f5';
        CMSLinkButton.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-link'></i>
        </div>
        `;
        CMSLinkButton.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSLinkButton, () =>
            CMSLinkButtonWidgetOptionsVO.createNew(
                null,
                null,
                '#003c7d',
                '#ffffff',
                false,
                0,
                null,
                "",
                false,
                [],
                "",
                false,
            ), null);

        Vue.component('CMSLinkButtonwidgetcomponent', () => import('./widgets/cms_link_button_widget/CMSLinkButtonWidgetComponent'));
        Vue.component('CMSLinkButtonwidgetoptionscomponent', () => import('./widgets/cms_link_button_widget/options/CMSLinkButtonWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSBooleanButton() {
        const CMSBooleanButton = new DashboardWidgetVO();

        CMSBooleanButton.default_height = 5;
        CMSBooleanButton.default_width = 2;
        CMSBooleanButton.name = DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton;
        CMSBooleanButton.widget_component = 'CMSBooleanButtonwidgetcomponent';
        CMSBooleanButton.options_component = 'CMSBooleanButtonwidgetoptionscomponent';
        CMSBooleanButton.weight = 3;
        CMSBooleanButton.default_background = '#f5f5f5';
        CMSBooleanButton.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-toggle-on'></i>
        </div>
        `;
        CMSBooleanButton.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSBooleanButton, null, null);

        Vue.component('CMSBooleanButtonwidgetcomponent', () => import('./widgets/cms_boolean_button_widget/CMSBooleanButtonWidgetComponent'));
        Vue.component('CMSBooleanButtonwidgetoptionscomponent', () => import('./widgets/cms_boolean_button_widget/options/CMSBooleanButtonWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSLikeButton() {
        const CMSLikeButton = new DashboardWidgetVO();

        CMSLikeButton.default_height = 5;
        CMSLikeButton.default_width = 2;
        CMSLikeButton.name = DashboardWidgetVO.WIDGET_NAME_cmslikebutton;
        CMSLikeButton.widget_component = 'CMSLikeButtonwidgetcomponent';
        CMSLikeButton.options_component = 'CMSLikeButtonwidgetoptionscomponent';
        CMSLikeButton.weight = 3;
        CMSLikeButton.default_background = '#f5f5f5';
        CMSLikeButton.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-heart-circle'></i>
        </div>
        `;
        CMSLikeButton.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSLikeButton, null, null);

        Vue.component('CMSLikeButtonwidgetcomponent', () => import('./widgets/cms_like_button_widget/CMSLikeButtonWidgetComponent'));
        Vue.component('CMSLikeButtonwidgetoptionscomponent', () => import('./widgets/cms_like_button_widget/options/CMSLikeButtonWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSPrintParam() {
        const CMSPrintParam = new DashboardWidgetVO();

        CMSPrintParam.default_height = 5;
        CMSPrintParam.default_width = 2;
        CMSPrintParam.name = DashboardWidgetVO.WIDGET_NAME_cmsprintparam;
        CMSPrintParam.widget_component = 'CMSPrintParamwidgetcomponent';
        CMSPrintParam.options_component = 'CMSPrintParamwidgetoptionscomponent';
        CMSPrintParam.weight = 3;
        CMSPrintParam.default_background = '#f5f5f5';
        CMSPrintParam.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-file fa-stack-2x'></i>
            <i class='fa-solid fa-cogs fa-stack-1x'></i>
        </div>
        `;
        CMSPrintParam.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSPrintParam, null, null);

        Vue.component('CMSPrintParamwidgetcomponent', () => import('./widgets/cms_print_param_widget/CMSPrintParamWidgetComponent'));
        Vue.component('CMSPrintParamwidgetoptionscomponent', () => import('./widgets/cms_print_param_widget/options/CMSPrintParamWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSVisionneusePdf() {
        const CMSVisionneusePdf = new DashboardWidgetVO();

        CMSVisionneusePdf.default_height = 5;
        CMSVisionneusePdf.default_width = 2;
        CMSVisionneusePdf.name = DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf;
        CMSVisionneusePdf.widget_component = 'CMSVisionneusePdfwidgetcomponent';
        CMSVisionneusePdf.options_component = 'CMSVisionneusePdfwidgetoptionscomponent';
        CMSVisionneusePdf.weight = 3;
        CMSVisionneusePdf.default_background = '#f5f5f5';
        CMSVisionneusePdf.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-file-pdf'></i>
        </div>
        `;
        CMSVisionneusePdf.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSVisionneusePdf, () =>
            CMSVisionneusePdfWidgetOptionsVO.createNew(
                null,
                false,
                null,
            ), null);

        Vue.component('CMSVisionneusePdfwidgetcomponent', () => import('./widgets/cms_visionneuse_pdf/CMSVisionneusePdfWidgetComponent'));
        Vue.component('CMSVisionneusePdfwidgetoptionscomponent', () => import('./widgets/cms_visionneuse_pdf/options/CMSVisionneusePdfWidgetOptionsComponent'));
    }

    private async initializeWidget_CMSCrudButtons() {
        const CrudButtons = new DashboardWidgetVO();

        CrudButtons.default_height = 5;
        CrudButtons.default_width = 2;
        CrudButtons.name = DashboardWidgetVO.WIDGET_NAME_crudbuttons;
        CrudButtons.widget_component = 'Cmscrudbuttonswidgetcomponent';
        CrudButtons.options_component = 'Cmscrudbuttonswidgetoptionscomponent';
        CrudButtons.weight = 3;
        CrudButtons.default_background = '#f5f5f5';

        CrudButtons.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-database fa-stack-2x'></i>
            <i class='fa-solid fa-trash fa-stack-1x' style="position: absolute;    left: 18px;    bottom: -5px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0;    line-height: 1.1em;"></i>
            <i class='fa-solid fa-pen fa-stack-1x' style="position: absolute;    left: 18px;    bottom: 15px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0; line-height: 1.1em;"></i>
        </div>
        `;

        CrudButtons.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CrudButtons,
            () => CMSCrudButtonsWidgetOptionsVO.createNew(
                false,
                false,
                false,
                true,
                null,
                true,
                [],
            ), null);

        Vue.component('Cmscrudbuttonswidgetcomponent', () => import('./widgets/cms_crud_buttons_widget/CMSCrudButtonsWidgetComponent'));
        Vue.component('Cmscrudbuttonswidgetoptionscomponent', () => import('./widgets/cms_crud_buttons_widget/options/CMSCrudButtonsWidgetOptionsComponent'));
    }

    private async initializeWidget_TemplateConsultation_CrudButtons() {
        const CrudButtons = new DashboardWidgetVO();

        CrudButtons.default_height = 5;
        CrudButtons.default_width = 2;
        CrudButtons.name = DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons;
        CrudButtons.widget_component = 'Cmscrudbuttonswidgetcomponent';
        CrudButtons.options_component = 'Cmscrudbuttonswidgetoptionscomponent';
        CrudButtons.weight = 3;
        CrudButtons.default_background = '#f5f5f5';

        CrudButtons.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-database fa-stack-2x'></i>
            <i class='fa-solid fa-trash fa-stack-1x' style="position: absolute;    left: 18px;    bottom: -5px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0;    line-height: 1.1em;"></i>
            <i class='fa-solid fa-pen fa-stack-1x' style="position: absolute;    left: 18px;    bottom: 15px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0; line-height: 1.1em;"></i>
        </div>
        `;
        CrudButtons.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CrudButtons,
            () => CMSCrudButtonsWidgetOptionsVO.createNew(
                false,
                false,
                false,
                false,
                null,
                true,
                [],
            ), null);

        Vue.component('Cmscrudbuttonswidgetcomponent', () => import('./widgets/cms_crud_buttons_widget/CMSCrudButtonsWidgetComponent'));
        Vue.component('Cmscrudbuttonswidgetoptionscomponent', () => import('./widgets/cms_crud_buttons_widget/options/CMSCrudButtonsWidgetOptionsComponent'));
    }

    private async initializeWidget_TemplateConsultation_VisionneusePdf() {
        const CMSVisionneusePdf = new DashboardWidgetVO();

        CMSVisionneusePdf.default_height = 5;
        CMSVisionneusePdf.default_width = 2;
        CMSVisionneusePdf.name = DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf;
        CMSVisionneusePdf.widget_component = 'CMSVisionneusePdfwidgetcomponent';
        CMSVisionneusePdf.options_component = 'CMSVisionneusePdfwidgetoptionscomponent';
        CMSVisionneusePdf.weight = 3;
        CMSVisionneusePdf.default_background = '#f5f5f5';
        CMSVisionneusePdf.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-file-pdf'></i>
        </div>
        `;
        CMSVisionneusePdf.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSVisionneusePdf, () =>
            CMSVisionneusePdfWidgetOptionsVO.createNew(
                null,
                true,
                null,
            ), null);

        Vue.component('CMSVisionneusePdfwidgetcomponent', () => import('./widgets/cms_visionneuse_pdf/CMSVisionneusePdfWidgetComponent'));
        Vue.component('CMSVisionneusePdfwidgetoptionscomponent', () => import('./widgets/cms_visionneuse_pdf/options/CMSVisionneusePdfWidgetOptionsComponent'));
    }

    private async initializeWidget_TemplateConsultation_LinkButton() {
        const CMSLinkButton = new DashboardWidgetVO();

        CMSLinkButton.default_height = 5;
        CMSLinkButton.default_width = 2;
        CMSLinkButton.name = DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton;
        CMSLinkButton.widget_component = 'CMSLinkButtonwidgetcomponent';
        CMSLinkButton.options_component = 'CMSLinkButtonwidgetoptionscomponent';
        CMSLinkButton.weight = 3;
        CMSLinkButton.default_background = '#f5f5f5';
        CMSLinkButton.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-link'></i>
        </div>
        `;
        CMSLinkButton.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSLinkButton, () =>
            CMSLinkButtonWidgetOptionsVO.createNew(
                null,
                null,
                '#003c7d',
                '#ffffff',
                false,
                0,
                null,
                "",
                true,
                [],
                "",
                false,
            ), null);

        Vue.component('CMSLinkButtonwidgetcomponent', () => import('./widgets/cms_link_button_widget/CMSLinkButtonWidgetComponent'));
        Vue.component('CMSLinkButtonwidgetoptionscomponent', () => import('./widgets/cms_link_button_widget/options/CMSLinkButtonWidgetOptionsComponent'));
    }

    private async initializeWidget_TemplateConsultation_Image() {
        const CMSImage = new DashboardWidgetVO();

        CMSImage.default_height = 5;
        CMSImage.default_width = 2;
        CMSImage.name = DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image;
        CMSImage.widget_component = 'CMSImagewidgetcomponent';
        CMSImage.options_component = 'CMSImagewidgetoptionscomponent';
        CMSImage.weight = 3;
        CMSImage.default_background = '#f5f5f5';
        CMSImage.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-image'></i>
        </div>
        `;
        CMSImage.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSImage, () =>
            CMSImageWidgetOptionsVO.createNew(
                null,
                0,
                true,
                null,
                CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE,
                CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR,
            ), null);

        Vue.component('CMSImagewidgetcomponent', () => import('./widgets/cms_image_widget/CMSImageWidgetComponent'));
        Vue.component('CMSImagewidgetoptionscomponent', () => import('./widgets/cms_image_widget/options/CMSImageWidgetOptionsComponent'));
    }

    private async initializeWidget_TemplateConsultation_BlocText() {
        const CMSBlocText = new DashboardWidgetVO();

        CMSBlocText.default_height = 5;
        CMSBlocText.default_width = 2;
        CMSBlocText.name = DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext;
        CMSBlocText.widget_component = 'CMSBlocTextwidgetcomponent';
        CMSBlocText.options_component = 'CMSBlocTextwidgetoptionscomponent';
        CMSBlocText.weight = 3;
        CMSBlocText.default_background = '#f5f5f5';
        CMSBlocText.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-text'></i>
        </div>
        `;
        CMSBlocText.is_filter = false;

        await WidgetOptionsVOManager.register_widget_type(CMSBlocText, () =>
            CMSBlocTextWidgetOptionsVO.createNew(
                "",
                "",
                "",
                "",
                true,
                null,
                null,
                null,
                null,
                false,
                false,
                false,
                false,
                "",
                "",
                "",
                "",
                "",
            ), null);

        Vue.component('CMSBlocTextwidgetcomponent', () => import('./widgets/cms_bloc_text_widget/CMSBlocTextWidgetComponent'));
        Vue.component('CMSBlocTextwidgetoptionscomponent', () => import('./widgets/cms_bloc_text_widget/options/CMSBlocTextWidgetOptionsComponent'));
    }

}