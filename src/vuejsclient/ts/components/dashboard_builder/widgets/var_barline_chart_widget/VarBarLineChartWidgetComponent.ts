import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VarPieDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarPieDataSetDescriptor';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';
import VarBarLineChartWidgetOptions from './options/VarBarLineChartWidgetOptions';
import './VarBarLineChartWidgetComponent.scss';

@Component({
    template: require('./VarBarLineChartWidgetComponent.pug'),
})
export default class VarBarLineChartWidgetComponent extends VueComponentBase {

    // @ModuleDashboardPageGetter
    // private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    // @ModuleDashboardPageGetter
    // private get_active_field_filters: FieldFiltersVO;

    // @ModuleTranslatableTextGetter
    // private get_flat_locale_translations: { [code_text: string]: string };

    // @ModuleDashboardPageGetter
    // private get_custom_filters: string[];

    // @Prop({ default: null })
    // private all_page_widget: DashboardPageWidgetVO[];

    // @Prop({ default: null })
    // private page_widget: DashboardPageWidgetVO;

    // @Prop({ default: null })
    // private dashboard: DashboardVO;

    // @Prop({ default: null })
    // private dashboard_page: DashboardPageVO;

    // private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    // private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

    // private ordered_dimension: number[] = null;
    // private label_by_index: { [index: string]: string } = null;
    // private var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = null;
    // private var_params_1_et_2: { [dimension_value: number]: VarDataBaseVO } = null;

    // private last_calculation_cpt: number = 0;

    // get var_filter(): () => string {
    //     if (!this.widget_options) {
    //         return null;
    //     }

    //     return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
    // }

    // get var_filter_additional_params(): [] {
    //     if (!this.widget_options) {
    //         return null;
    //     }

    //     return this.widget_options.filter_additional_params ? JSON.parse(this.widget_options.filter_additional_params) : undefined;
    // }

    // get translated_title(): string {

    //     if (!this.widget_options) {
    //         return null;
    //     }
    //     return this.t(this.widget_options.get_title_name_code_text(this.page_widget.id));
    // }

    // get options() {
    //     let self = this;
    //     return {
    //         responsive: true,
    //         maintainAspectRatio: false,
    //         tooltips: {
    //             callbacks: {
    //                 label: function (tooltipItem, data) {
    //                     var label = data.datasets[tooltipItem.datasetIndex].label || '';

    //                     if (label) {
    //                         label += ': ';
    //                     }
    //                     label += self.const_filters.amount.read(tooltipItem.yLabel);
    //                     return label;
    //                 }
    //             }
    //         },
    //         legend: {
    //             position: 'bottom',
    //             labels: {
    //                 fontColor: '#002454',
    //             }
    //         },
    //         scales: {
    //             xAxes: [{
    //                 ticks: {
    //                     autoSkip: false
    //                 },
    //                 scaleLabel: {
    //                     display: true,
    //                     fontColor: '#002454',
    //                 },
    //                 gridLines: {
    //                     display: false,
    //                 }
    //             }],
    //             yAxes: [{
    //                 id: 'y-axe',
    //                 position: 'left',
    //                 scaleLabel: {
    //                     display: true,
    //                     fontColor: '#002454',
    //                 },
    //                 ticks: {
    //                     callback: function (value, index, values) {
    //                         return self.const_filters.amount.read(value);
    //                     }
    //                 },
    //                 gridLines: {
    //                     display: false,
    //                 }
    //             }]
    //         }
    //     };
    // }

    // get options() {
    //     let self = this;
    //     return {
    //         responsive: true,
    //         maintainAspectRatio: false,

    //         title: {
    //             display: self.widget_options.title_display ? self.widget_options.title_display : true,
    //             text: self.translated_title ? self.translated_title : '',
    //             fontColor: self.widget_options.title_font_color ? self.widget_options.title_font_color : '#666',
    //             fontSize: self.widget_options.title_font_size ? self.widget_options.title_font_size : 16,
    //             padding: self.widget_options.title_padding ? self.widget_options.title_padding : 10,
    //         },

    //         tooltips: {
    //             callbacks: {
    //                 label: function (tooltipItem, data) {
    //                     let label = data.labels[tooltipItem.index] || '';

    //                     if (label) {
    //                         label += ': ';
    //                     }

    //                     if (!self.var_filter) {
    //                         return label + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
    //                     }

    //                     let params = [data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]];

    //                     if (!!self.var_filter_additional_params) {
    //                         params = params.concat(self.var_filter_additional_params);
    //                     }

    //                     return label + self.var_filter.apply(null, params);
    //                 }
    //             }
    //         },

    //         legend: {
    //             display: self.widget_options.legend_display ? self.widget_options.legend_display : true,
    //             position: self.widget_options.legend_position ? self.widget_options.legend_position : 'bottom',

    //             labels: {
    //                 fontColor: self.widget_options.legend_font_color ? self.widget_options.legend_font_color : '#666',
    //                 fontSize: self.widget_options.legend_font_size ? self.widget_options.legend_font_size : 12,
    //                 boxWidth: self.widget_options.legend_box_width ? self.widget_options.legend_box_width : 40,
    //                 padding: self.widget_options.legend_padding ? self.widget_options.legend_padding : 10,
    //                 usePointStyle: self.widget_options.legend_use_point_style ? self.widget_options.legend_use_point_style : false
    //             },
    //         },

    //         cutoutPercentage: self.widget_options.cutout_percentage ? self.widget_options.cutout_percentage : 50,
    //         rotation: self.widget_options.rotation ? self.widget_options.rotation : 1 * Math.PI,
    //         circumference: self.widget_options.circumference ? self.widget_options.circumference : 1 * Math.PI
    //     };
    // }

    // get var_dataset_descriptors(): VarsBarDataSetDescriptor[] {
    //     return [
    //         new VarsBarDataSetDescriptor(
    //             (this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME),
    //             'crescendo_ca_pr_graph.var_dataset_descriptors.VarDayCAHTRealiseController_AM1.label_translatable_code',
    //             'y-axe',
    //             this.var_params_by_label_by_descriptor[(this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME) + 'am1'],
    //             null,
    //             this.math_round
    //         ).set_bg_color('#888'),
    //         new VarsBarDataSetDescriptor(
    //             (this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME),
    //             'crescendo_ca_pr_graph.var_dataset_descriptors.VarDayCAHTRealiseController.label_translatable_code',
    //             'y-axe',
    //             this.var_params_by_label_by_descriptor[(this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME)],
    //             null,
    //             this.math_round
    //         ).set_bg_color('#002454')];
    // }

    // get labels(): string[] {

    //     if (!this.ordered_dimension) {
    //         return [];
    //     }

    //     if (!this.label_by_index) {
    //         return [];
    //     }

    //     if (!this.var_params_by_dimension) {
    //         return [];
    //     }

    //     let res: string[] = [];
