import Vue from 'vue';
import DashboardBuilderController from '../../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FavoritesFiltersVO from '../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import FavoritesFiltersWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import FieldValueFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import YearFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import TableWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import VOFieldRefVO from '../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../shared/modules/DataRender/vos/TimeSegment';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import AdvancedDateFilterWidgetOptions from './widgets/advanced_date_filter_widget/options/AdvancedDateFilterWidgetOptions';
import BulkOpsWidgetOptions from './widgets/bulkops_widget/options/BulkOpsWidgetOptions';
import ChecklistWidgetOptions from './widgets/checklist_widget/options/ChecklistWidgetOptions';
import DashboardBuilderWidgetsController from './widgets/DashboardBuilderWidgetsController';
import DOWFilterWidgetOptions from './widgets/dow_filter_widget/options/DOWFilterWidgetOptions';
import AdvancedStringFilter from './widgets/field_value_filter_widget/string/AdvancedStringFilter';
import MonthFilterWidgetOptions from './widgets/month_filter_widget/options/MonthFilterWidgetOptions';
import PageSwitchWidgetOptions from './widgets/page_switch_widget/options/PageSwitchWidgetOptions';
import SupervisionTypeWidgetOptions from './widgets/supervision_type_widget/options/SupervisionTypeWidgetOptions';
import SupervisionWidgetOptions from './widgets/supervision_widget/options/SupervisionWidgetOptions';
import VarPieChartWidgetOptions from './widgets/var_pie_chart_widget/options/VarPieChartWidgetOptions';
import VarWidgetOptions from './widgets/var_widget/options/VarWidgetOptions';
import WidgetOptionsVOManager from '../../../../shared/modules/DashboardBuilder/manager/WidgetOptionsVOManager';
import CurrentUserFilterWidgetOptionsVO from '../../../../shared/modules/DashboardBuilder/vos/CurrentUserFilterWidgetOptionsVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';

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

        this.routes = this.routes.concat(DashboardBuilderController.getInstance().addRouteForDashboard(
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

        this.routes = this.routes.concat(DashboardBuilderController.getInstance().addRouteForDashboard(
            url,
            main_route_name,
            () => import('./DashboardBuilderComponent'),
            true,
        ));

        await this.initializeDefaultWidgets();
    }

    private async initializeDefaultWidgets() {
        await this.initializeWidget_FieldValueFilter();

        await this.initializeWidget_DOWFilter();
        await this.initializeWidget_MonthFilter();
        await this.initializeWidget_YearFilter();
        await this.initializeWidget_AdvancedDateFilter();
        await this.initializeWidget_CurrentUserFilter();

        await this.initializeWidget_VarPieChart();

        await this.initializeWidget_Checklist();
        await this.initializeWidget_Supervision();
        await this.initializeWidget_SupervisionType();

        await this.initializeWidget_BulkOps();

        await this.initializeWidget_Var();

        await this.initializeWidget_ValueTable();
        await this.initializeWidget_DataTable();

        await this.initializeWidget_PageSwitch();

        await this.initializeWidget_ValidationFilters();

        await this.initializeWidget_ResetFilters();

        await this.initializeWidget_SaveFavoritesFilters();

        await this.initializeWidget_ShowFavoritesFilters();
    }

    private async initializeWidget_BulkOps() {
        let BulkOps = new DashboardWidgetVO();

        BulkOps.default_height = 35;
        BulkOps.default_width = 12;
        BulkOps.name = DashboardWidgetVO.WIDGET_NAME_bulkops;
        BulkOps.widget_component = 'Bulkopswidgetcomponent';
        BulkOps.options_component = 'Bulkopswidgetoptionscomponent';
        BulkOps.weight = 40;
        BulkOps.default_background = '#f5f5f5';
        BulkOps.icon_component = 'Bulkopswidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(BulkOps, () => new BulkOpsWidgetOptions(null, 10), BulkOpsWidgetOptions.get_selected_fields);

        Vue.component('Bulkopswidgetcomponent', () => import('./widgets/bulkops_widget/BulkOpsWidgetComponent'));
        Vue.component('Bulkopswidgetoptionscomponent', () => import('./widgets/bulkops_widget/options/BulkOpsWidgetOptionsComponent'));
        Vue.component('Bulkopswidgeticoncomponent', () => import('./widgets/bulkops_widget/icon/BulkOpsWidgetIconComponent'));
    }

    private async initializeWidget_Checklist() {
        let Checklist = new DashboardWidgetVO();

        Checklist.default_height = 35;
        Checklist.default_width = 12;
        Checklist.name = DashboardWidgetVO.WIDGET_NAME_checklist;
        Checklist.widget_component = 'Checklistwidgetcomponent';
        Checklist.options_component = 'Checklistwidgetoptionscomponent';
        Checklist.weight = 30;
        Checklist.default_background = '#f5f5f5';
        Checklist.icon_component = 'Checklistwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Checklist, () => new ChecklistWidgetOptions(10, null, false, true, true, true), ChecklistWidgetOptions.get_selected_fields);

        Vue.component('Checklistwidgetcomponent', () => import('./widgets/checklist_widget/ChecklistWidgetComponent'));
        Vue.component('Checklistwidgetoptionscomponent', () => import('./widgets/checklist_widget/options/ChecklistWidgetOptionsComponent'));
        Vue.component('Checklistwidgeticoncomponent', () => import('./widgets/checklist_widget/icon/ChecklistWidgetIconComponent'));
    }

    private async initializeWidget_Supervision() {
        let supervision = new DashboardWidgetVO();

        supervision.default_height = 35;
        supervision.default_width = 12;
        supervision.name = DashboardWidgetVO.WIDGET_NAME_supervision;
        supervision.widget_component = 'Supervisionwidgetcomponent';
        supervision.options_component = 'Supervisionwidgetoptionscomponent';
        supervision.weight = 31;
        supervision.default_background = '#f5f5f5';
        supervision.icon_component = 'Supervisionwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(supervision, () => new SupervisionWidgetOptions(100, [], true, true, 30, true), SupervisionWidgetOptions.get_selected_fields);

        Vue.component('Supervisionwidgetcomponent', () => import('./widgets/supervision_widget/SupervisionWidgetComponent'));
        Vue.component('Supervisionwidgetoptionscomponent', () => import('./widgets/supervision_widget/options/SupervisionWidgetOptionsComponent'));
        Vue.component('Supervisionwidgeticoncomponent', () => import('./widgets/supervision_widget/icon/SupervisionWidgetIconComponent'));
    }

    private async initializeWidget_SupervisionType() {
        let supervision_type = new DashboardWidgetVO();

        supervision_type.default_height = 5;
        supervision_type.default_width = 3;
        supervision_type.name = DashboardWidgetVO.WIDGET_NAME_supervision_type;
        supervision_type.widget_component = 'Supervisiontypewidgetcomponent';
        supervision_type.options_component = 'Supervisiontypewidgetoptionscomponent';
        supervision_type.weight = 32;
        supervision_type.default_background = '#f5f5f5';
        supervision_type.icon_component = 'Supervisiontypewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(supervision_type, () => new SupervisionTypeWidgetOptions([]), SupervisionTypeWidgetOptions.get_selected_fields);

        Vue.component('Supervisiontypewidgetcomponent', () => import('./widgets/supervision_type_widget/SupervisionTypeWidgetComponent'));
        Vue.component('Supervisiontypewidgetoptionscomponent', () => import('./widgets/supervision_type_widget/options/SupervisionTypeWidgetOptionsComponent'));
        Vue.component('Supervisiontypewidgeticoncomponent', () => import('./widgets/supervision_type_widget/icon/SupervisionTypeWidgetIconComponent'));
    }

    private async initializeWidget_DataTable() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 35;
        Table.default_width = 12;
        Table.name = DashboardWidgetVO.WIDGET_NAME_datatable;
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 21;
        Table.default_background = '#f5f5f5';
        Table.icon_component = 'Tablewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptionsVO(
            null, true, 100, null, false, true, false, true, true, true, true, true, true, true, true, false, null, false, 5, false,
            false, null, false, true, true, true, false, false, false, false, false, false, [], false, false
        ), TableWidgetOptionsVO.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import('./widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import('./widgets/table_widget/options/TableWidgetOptionsComponent'));
        Vue.component('Tablewidgeticoncomponent', () => import('./widgets/table_widget/icon/TableWidgetIconComponent'));
    }

    private async initializeWidget_ValueTable() {
        let Table = new DashboardWidgetVO();

        Table.default_height = 35;
        Table.default_width = 12;
        Table.name = DashboardWidgetVO.WIDGET_NAME_valuetable;
        Table.widget_component = 'Tablewidgetcomponent';
        Table.options_component = 'Tablewidgetoptionscomponent';
        Table.weight = 20;
        Table.default_background = '#f5f5f5';
        Table.icon_component = 'Tablewidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(Table, () => new TableWidgetOptionsVO(
            null, false, 100, null, false, false, false, false, false, true, true, true, true, true, true, false, null, false, 5, false,
            false, null, false, true, true, true, false, false, false, false, false, false, [], false, false
        ), TableWidgetOptionsVO.get_selected_fields);

        Vue.component('Tablewidgetcomponent', () => import('./widgets/table_widget/TableWidgetComponent'));
        Vue.component('Tablewidgetoptionscomponent', () => import('./widgets/table_widget/options/TableWidgetOptionsComponent'));
        Vue.component('Tablewidgeticoncomponent', () => import('./widgets/table_widget/icon/TableWidgetIconComponent'));
    }

    private async initializeWidget_FieldValueFilter() {
        let fieldValueFilter = new DashboardWidgetVO();

        fieldValueFilter.default_height = 5;
        fieldValueFilter.default_width = 3;
        fieldValueFilter.name = DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter;
        fieldValueFilter.widget_component = 'Fieldvaluefilterwidgetcomponent';
        fieldValueFilter.options_component = 'Fieldvaluefilterwidgetoptionscomponent';
        fieldValueFilter.weight = 0;
        fieldValueFilter.default_background = '#f5f5f5';
        fieldValueFilter.icon_component = 'Fieldvaluefilterwidgeticoncomponent';
        fieldValueFilter.is_filter = true;

        await DashboardBuilderWidgetsController.getInstance().registerWidget(fieldValueFilter, () => new FieldValueFilterWidgetOptionsVO(
            null, null, null, true, false, FieldValueFilterWidgetOptionsVO.CHECKBOX_COLUMNS_1, 50, false, false, null, false, AdvancedStringFilter.FILTER_TYPE_CONTIENT, false, false, null, null, null, null, null, false, false, false, null, null, null, null, false, null, false, false, false, null, null, false, false, false, null, null, null
        ), FieldValueFilterWidgetOptionsVO.get_selected_fields);

        Vue.component('Fieldvaluefilterwidgetcomponent', () => import('./widgets/field_value_filter_widget/FieldValueFilterWidgetComponent'));
        Vue.component('Fieldvaluefilterwidgetoptionscomponent', () => import('./widgets/field_value_filter_widget/options/FieldValueFilterWidgetOptionsComponent'));
        Vue.component('Fieldvaluefilterwidgeticoncomponent', () => import('./widgets/field_value_filter_widget/icon/FieldValueFilterWidgetIconComponent'));
    }

    private async initializeWidget_DOWFilter() {
        let DOWFilter = new DashboardWidgetVO();

        DOWFilter.default_height = 5;
        DOWFilter.default_width = 3;
        DOWFilter.name = DashboardWidgetVO.WIDGET_NAME_dowfilter;
        DOWFilter.widget_component = 'Dowfilterwidgetcomponent';
        DOWFilter.options_component = 'Dowfilterwidgetoptionscomponent';
        DOWFilter.weight = 1;
        DOWFilter.default_background = '#f5f5f5';
        DOWFilter.icon_component = 'Dowfilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(DOWFilter, () => new DOWFilterWidgetOptions(true, null, null), DOWFilterWidgetOptions.get_selected_fields);

        Vue.component('Dowfilterwidgetcomponent', () => import('./widgets/dow_filter_widget/DOWFilterWidgetComponent'));
        Vue.component('Dowfilterwidgetoptionscomponent', () => import('./widgets/dow_filter_widget/options/DOWFilterWidgetOptionsComponent'));
        Vue.component('Dowfilterwidgeticoncomponent', () => import('./widgets/dow_filter_widget/icon/DOWFilterWidgetIconComponent'));
    }

    private async initializeWidget_MonthFilter() {
        let MonthFilter = new DashboardWidgetVO();

        MonthFilter.default_height = 5;
        MonthFilter.default_width = 4;
        MonthFilter.name = DashboardWidgetVO.WIDGET_NAME_monthfilter;
        MonthFilter.widget_component = 'Monthfilterwidgetcomponent';
        MonthFilter.options_component = 'Monthfilterwidgetoptionscomponent';
        MonthFilter.weight = 2;
        MonthFilter.default_background = '#f5f5f5';
        MonthFilter.icon_component = 'Monthfilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(MonthFilter, () => new MonthFilterWidgetOptions(true, null, null, false, 1, 12, false, false, null, null, false, null, false), MonthFilterWidgetOptions.get_selected_fields);

        Vue.component('Monthfilterwidgetcomponent', () => import('./widgets/month_filter_widget/MonthFilterWidgetComponent'));
        Vue.component('Monthfilterwidgetoptionscomponent', () => import('./widgets/month_filter_widget/options/MonthFilterWidgetOptionsComponent'));
        Vue.component('Monthfilterwidgeticoncomponent', () => import('./widgets/month_filter_widget/icon/MonthFilterWidgetIconComponent'));
    }

    private async initializeWidget_AdvancedDateFilter() {
        let AdvancedDateFilter = new DashboardWidgetVO();

        AdvancedDateFilter.default_height = 5;
        AdvancedDateFilter.default_width = 3;
        AdvancedDateFilter.name = DashboardWidgetVO.WIDGET_NAME_advanceddatefilter;
        AdvancedDateFilter.widget_component = 'Advanceddatefilterwidgetcomponent';
        AdvancedDateFilter.options_component = 'Advanceddatefilterwidgetoptionscomponent';
        AdvancedDateFilter.weight = 4;
        AdvancedDateFilter.default_background = '#f5f5f5';
        AdvancedDateFilter.icon_component = 'Advanceddatefilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(
            AdvancedDateFilter,
            () => new AdvancedDateFilterWidgetOptions(true, null, null, null, false, null),
            AdvancedDateFilterWidgetOptions.get_selected_fields
        );

        Vue.component('Advanceddatefilterwidgetcomponent', () => import('./widgets/advanced_date_filter_widget/AdvancedDateFilterWidgetComponent'));
        Vue.component('Advanceddatefilterwidgetoptionscomponent', () => import('./widgets/advanced_date_filter_widget/options/AdvancedDateFilterWidgetOptionsComponent'));
        Vue.component('Advanceddatefilterwidgeticoncomponent', () => import('./widgets/advanced_date_filter_widget/icon/AdvancedDateFilterWidgetIconComponent'));
    }

    private async initializeWidget_CurrentUserFilter() {
        let CurrentUserFilter = new DashboardWidgetVO();

        CurrentUserFilter.default_height = 5;
        CurrentUserFilter.default_width = 2;
        CurrentUserFilter.name = DashboardWidgetVO.WIDGET_NAME_currentuserfilter;
        CurrentUserFilter.widget_component = 'Currentuserfilterwidgetcomponent';
        CurrentUserFilter.options_component = 'Currentuserfilterwidgetoptionscomponent';
        CurrentUserFilter.weight = 19;
        CurrentUserFilter.default_background = '#f5f5f5';
        CurrentUserFilter.icon_component = 'Currentuserfilterwidgeticoncomponent';
        CurrentUserFilter.is_filter = true;

        await DashboardBuilderWidgetsController.getInstance().registerWidget(
            CurrentUserFilter,
            () => new CurrentUserFilterWidgetOptionsVO(
                new VOFieldRefVO().from({
                    api_type_id: UserVO.API_TYPE_ID,
                    field_id: "id"
                }),
                true
            ),
            CurrentUserFilterWidgetOptionsVO.get_selected_fields
        );

        Vue.component('Currentuserfilterwidgetcomponent', () => import('./widgets/current_user_filter_widget/CurrentUserFilterWidgetComponent'));
        Vue.component('Currentuserfilterwidgetoptionscomponent', () => import('./widgets/current_user_filter_widget/options/CurrentUserFilterWidgetOptionsComponent'));
        Vue.component('Currentuserfilterwidgeticoncomponent', () => import('./widgets/current_user_filter_widget/icon/CurrentUserFilterWidgetIconComponent'));
    }

    private async initializeWidget_VarPieChart() {
        let VarPieChart = new DashboardWidgetVO();

        VarPieChart.default_height = 10;
        VarPieChart.default_width = 2;
        VarPieChart.name = DashboardWidgetVO.WIDGET_NAME_varpiechart;
        VarPieChart.widget_component = 'Varpiechartwidgetcomponent';
        VarPieChart.options_component = 'Varpiechartwidgetoptionscomponent';
        VarPieChart.weight = 15;
        VarPieChart.default_background = '#f5f5f5';
        VarPieChart.icon_component = 'Varpiechartwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(VarPieChart, () => new VarPieChartWidgetOptions(

            /**
             * Paramètres du widget
             */
            null,

            /**
             * Paramètres du graph
             */
            true,
            'top',
            '#666',
            12,
            40,
            10,
            false,

            false,
            '#666',
            16,
            10,

            50, // 0-100 - exemples : donut 50, camembert 0
            3.141592653589793238462643383279, // 0-2pi - exemples : donut 1 * Math.PI, camembert 0
            3.141592653589793238462643383279, // 0-2pi - exemples : donut 1 * Math.PI, camembert 0

            false,
            10, // Permet de limiter le nombre de vars affichées (par défaut 10)
            null,
            true,

            /**
             * Si on a une dimension, on défini le champ ref ou le custom filter, et le segment_type
             */
            true,
            null,
            null,
            TimeSegment.TYPE_YEAR,

            /**
             * On gère un filtre global identique en param sur les 2 vars (si pas de dimension)
             *  par ce qu'on considère qu'on devrait pas avoir 2 formats différents à ce stade
             */
            null,
            null,

            /**
             * Var 1
             */
            null,

            {},

            null,
            null,
            null,

            /**
             * Var 2 si pas de dimension
             */
            null,

            {},

            null,
            null,
            null,

            false,
        ), VarPieChartWidgetOptions.get_selected_fields);

        Vue.component('Varpiechartwidgetcomponent', () => import('./widgets/var_pie_chart_widget/VarPieChartWidgetComponent'));
        Vue.component('Varpiechartwidgetoptionscomponent', () => import('./widgets/var_pie_chart_widget/options/VarPieChartWidgetOptionsComponent'));
        Vue.component('Varpiechartwidgeticoncomponent', () => import('./widgets/var_pie_chart_widget/icon/VarPieChartWidgetIconComponent'));
    }

    private async initializeWidget_YearFilter() {
        let YearFilter = new DashboardWidgetVO();

        YearFilter.default_height = 5;
        YearFilter.default_width = 2;
        YearFilter.name = DashboardWidgetVO.WIDGET_NAME_yearfilter;
        YearFilter.widget_component = 'Yearfilterwidgetcomponent';
        YearFilter.options_component = 'Yearfilterwidgetoptionscomponent';
        YearFilter.weight = 3;
        YearFilter.default_background = '#f5f5f5';
        YearFilter.icon_component = 'Yearfilterwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(YearFilter, () => new YearFilterWidgetOptionsVO(true, null, null, true, -2, 2, true, true, 0, 0, false, null, false), YearFilterWidgetOptionsVO.get_selected_fields);

        Vue.component('Yearfilterwidgetcomponent', () => import('./widgets/year_filter_widget/YearFilterWidgetComponent'));
        Vue.component('Yearfilterwidgetoptionscomponent', () => import('./widgets/year_filter_widget/options/YearFilterWidgetOptionsComponent'));
        Vue.component('Yearfilterwidgeticoncomponent', () => import('./widgets/year_filter_widget/icon/YearFilterWidgetIconComponent'));
    }

    private async initializeWidget_ValidationFilters() {
        let ValidationFilters = new DashboardWidgetVO();

        ValidationFilters.default_height = 5;
        ValidationFilters.default_width = 2;
        ValidationFilters.name = DashboardWidgetVO.WIDGET_NAME_validationfilters;
        ValidationFilters.widget_component = 'Validationfilterswidgetcomponent';
        ValidationFilters.options_component = 'Validationfilterswidgetoptionscomponent';
        ValidationFilters.weight = 3;
        ValidationFilters.default_background = '#f5f5f5';
        ValidationFilters.icon_component = 'Validationfilterswidgeticoncomponent';
        ValidationFilters.is_validation_filters = true;
        ValidationFilters.is_filter = true;

        await DashboardBuilderWidgetsController.getInstance().registerWidget(ValidationFilters, null, null);

        Vue.component('Validationfilterswidgetcomponent', () => import('./widgets/validation_filters_widget/ValidationFiltersWidgetComponent'));
        Vue.component('Validationfilterswidgetoptionscomponent', () => import('./widgets/validation_filters_widget/options/ValidationFiltersWidgetOptionsComponent'));
        Vue.component('Validationfilterswidgeticoncomponent', () => import('./widgets/validation_filters_widget/icon/ValidationFiltersWidgetIconComponent'));
    }

    private async initializeWidget_SaveFavoritesFilters() {
        let SaveFavoritesFilters = new DashboardWidgetVO();

        SaveFavoritesFilters.default_height = 5;
        SaveFavoritesFilters.default_width = 2;
        SaveFavoritesFilters.name = DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters;
        SaveFavoritesFilters.widget_component = 'Savefavoritesfilterswidgetcomponent';
        SaveFavoritesFilters.options_component = 'Favoritesfilterswidgetoptionscomponent';
        SaveFavoritesFilters.weight = 3;
        SaveFavoritesFilters.default_background = '#f5f5f5';
        SaveFavoritesFilters.icon_component = 'Savefavoritesfilterswidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(
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
        Vue.component('Savefavoritesfilterswidgeticoncomponent', () => import('./widgets/favorites_filters_widget/save_favorites_filters_widget/icon/SaveFavoritesFiltersWidgetIconComponent'));
    }

    private async initializeWidget_ShowFavoritesFilters() {
        let ShowFavoritesFilters = new DashboardWidgetVO();

        ShowFavoritesFilters.default_height = 5;
        ShowFavoritesFilters.default_width = 2;
        ShowFavoritesFilters.name = DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters;
        ShowFavoritesFilters.widget_component = 'Showfavoritesfilterswidgetcomponent';
        ShowFavoritesFilters.options_component = 'Favoritesfilterswidgetoptionscomponent';
        ShowFavoritesFilters.weight = 3;
        ShowFavoritesFilters.default_background = '#f5f5f5';
        ShowFavoritesFilters.icon_component = 'Showfavoritesfilterswidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(
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
        Vue.component('Showfavoritesfilterswidgeticoncomponent', () => import('./widgets/favorites_filters_widget/show_favorites_filters_widget/icon/ShowFavoritesFiltersWidgetIconComponent'));
    }

    private async initializeWidget_ResetFilters() {
        let ResetFilters = new DashboardWidgetVO();

        ResetFilters.default_height = 5;
        ResetFilters.default_width = 2;
        ResetFilters.name = 'resetfilters';
        ResetFilters.widget_component = 'Resetfilterswidgetcomponent';
        ResetFilters.options_component = 'Resetfilterswidgetoptionscomponent';
        ResetFilters.weight = 3;
        ResetFilters.default_background = '#f5f5f5';
        ResetFilters.icon_component = 'Resetfilterswidgeticoncomponent';
        ResetFilters.is_filter = true;

        await DashboardBuilderWidgetsController.getInstance().registerWidget(ResetFilters, null, null);

        Vue.component('Resetfilterswidgetcomponent', () => import('./widgets/reset_filters_widget/ResetFiltersWidgetComponent'));
        Vue.component('Resetfilterswidgetoptionscomponent', () => import('./widgets/reset_filters_widget/options/ResetFiltersWidgetOptionsComponent'));
        Vue.component('Resetfilterswidgeticoncomponent', () => import('./widgets/reset_filters_widget/icon/ResetFiltersWidgetIconComponent'));
    }

    private async initializeWidget_Var() {
        let var_widget = new DashboardWidgetVO();

        var_widget.default_height = 10;
        var_widget.default_width = 1;
        var_widget.name = DashboardWidgetVO.WIDGET_NAME_var;
        var_widget.widget_component = 'Varwidgetcomponent';
        var_widget.options_component = 'Varwidgetoptionscomponent';
        var_widget.weight = 10;
        var_widget.default_background = '#f5f5f5';
        var_widget.icon_component = 'Varwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(var_widget, () => new VarWidgetOptions(null, null, null, null, null, null, null), VarWidgetOptions.get_selected_fields);

        Vue.component('Varwidgetcomponent', () => import('./widgets/var_widget/VarWidgetComponent'));
        Vue.component('Varwidgetoptionscomponent', () => import('./widgets/var_widget/options/VarWidgetOptionsComponent'));
        Vue.component('Varwidgeticoncomponent', () => import('./widgets/var_widget/icon/VarWidgetIconComponent'));
    }

    private async initializeWidget_PageSwitch() {
        let pageswitch_widget = new DashboardWidgetVO();

        pageswitch_widget.default_height = 5;
        pageswitch_widget.default_width = 2;
        pageswitch_widget.name = DashboardWidgetVO.WIDGET_NAME_pageswitch;
        pageswitch_widget.widget_component = 'Pageswitchwidgetcomponent';
        pageswitch_widget.options_component = 'Pageswitchwidgetoptionscomponent';
        pageswitch_widget.weight = 5;
        pageswitch_widget.default_background = '#f5f5f5';
        pageswitch_widget.icon_component = 'Pageswitchwidgeticoncomponent';

        await DashboardBuilderWidgetsController.getInstance().registerWidget(pageswitch_widget, () => new PageSwitchWidgetOptions(null), () => null);

        Vue.component('Pageswitchwidgetcomponent', () => import('./widgets/page_switch_widget/PageSwitchWidgetComponent'));
        Vue.component('Pageswitchwidgetoptionscomponent', () => import('./widgets/page_switch_widget/options/PageSwitchWidgetOptionsComponent'));
        Vue.component('Pageswitchwidgeticoncomponent', () => import('./widgets/page_switch_widget/icon/PageSwitchWidgetIconComponent'));
    }
}