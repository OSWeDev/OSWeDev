import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import VarMixedChartWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarMixedChartDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarMixedChartDataSetDescriptor';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';
import './VarMixedChartsWidgetComponent.scss';
import { IChartOptions } from '../../../Var/components/mixed-chart/VarMixedChartComponent';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VarChartOptionsItemComponent from '../var_chart_options/item/VarChartOptionsItemComponent';
import Filters from '../../../../../../shared/tools/Filters';
import VarChartOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import { enabled } from 'screenfull';

@Component({
    template: require('./VarMixedChartsWidgetComponent.pug')
})
export default class VarMixedChartsWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private ERROR_MESSAGE = 'var_mixed_charts_widget.error_message';
    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

    private ordered_dimension: number[] = null;
    private label_by_index: { [index: string]: string[] } = null;
    private charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = null;

    private last_calculation_cpt: number = 0;

    private current_charts_var_dataset_descriptor: { [chart_id: string]: VarMixedChartDataSetDescriptor } = null;
    private current_charts_var_params: { [chart_id: string]: VarDataBaseVO[] } = null;
    private current_options: IChartOptions = null;
    private current_charts_scales_options: { [chart_id: string]: VarChartScalesOptionsVO } = null;
    private datasets: any[] = [];

    private temp_current_scale: VarChartScalesOptionsVO = null; // Here for tracking the scale we are currently editing
    private isValid: boolean = true;

    get var_filter(): () => string {
        if (!this.widget_options) {
            return null;
        }

        if (this.widget_options.filter_type == 'none') {
            return null;
        }
        return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
    }

    get widget_options(): VarMixedChartWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: VarMixedChartWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarMixedChartWidgetOptionsVO;
                options = options ? new VarMixedChartWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get chart_scales_options_filtered(): { [chart_id: string]: boolean } {
        if (!this.widget_options) {
            return null;
        }
        const res = {};
        for (let i = 0; i < this.widget_options.var_chart_scales_options.length; i++) {
            const current_scale = this.widget_options.var_chart_scales_options[i];
            if (res[current_scale.chart_id] == undefined) {
                res[current_scale.chart_id] = false;
            }
        }
        return res;
    }

    /**
         * get options
         * - Get the options for the chart
         *
         * TODO: create an interface for this
         *
         * @returns {IChartOptions}
         */
    get options(): IChartOptions {

        if (this.widget_options.detailed) {
            const scales = {};
            const var_chart_scales_options = this.widget_options.var_chart_scales_options;
            if (var_chart_scales_options && var_chart_scales_options.length > 0) {
                for (const i in this.current_charts_scales_options) {
                    const current_scale = new VarChartScalesOptionsVO().from(this.current_charts_scales_options[i]);
                    this.temp_current_scale = current_scale;
                    const title = this.t(current_scale.get_title_name_code_text(current_scale.page_widget_id, current_scale.chart_id));
                    if (title) {
                        scales[title] = {
                            title: {
                                display: current_scale.show_scale_title ? current_scale.show_scale_title : false,
                                text: this.t(title) != title ? this.t(title) : current_scale.scale_options.type + ' Axis',
                            },
                            grid: {
                                drawOnChartArea: Object.keys(scales).length > 0 ? true : false
                            },
                            type: current_scale.scale_options ? current_scale.scale_options.type : 'linear',
                            ticks: {
                                callback: this.get_scale_ticks_callback(current_scale),
                            },
                            axis: 'y',
                            position: current_scale.selected_position ? current_scale.selected_position : 'left',
                            fill: current_scale.fill ? current_scale.fill : false,

                        };
                    }
                }
            }
            if (this.widget_options.scale_options_x) {
                scales['x'] = this.widget_options.scale_options_x;
                scales['x']['title'] = {
                    display: this.widget_options.show_scale_x ? this.widget_options.show_scale_x : false,
                    text: this.translated_scale_x_title ? this.translated_scale_x_title : '',
                };
                scales['x']['stacked'] = this.widget_options.var_chart_scales_options.some((option) => option.stacked);
            }

            if (this.widget_options.scale_options_r) {
                scales['r'] = this.widget_options.scale_options_r;
            }
            let interaction_option = {};
            if (Object.keys(scales).length > 0 ? true : false) {
                interaction_option = {
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                };
            }
            const obj = {
                inflateAmount: false,
                borderRadius: 0,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {

                    title: {
                        display: this.get_bool_option('title_display', true),
                        text: this.translated_title ? this.translated_title : '',
                        color: this.widget_options.title_font_color ? this.widget_options.title_font_color : '#666',
                        font: {
                            size: this.widget_options.title_font_size ? this.widget_options.title_font_size : 16,
                        },
                        padding: this.widget_options.title_padding ? this.widget_options.title_padding : 10,
                    },

                    tooltip: {
                        enabled: true,
                        axis: 'xy',
                        mode: this.widget_options.tooltip_by_index ? 'index' : 'nearest',
                    },
                    datalabels: {
                        display: false
                    },
                    legend: {
                        display: this.get_bool_option('legend_display', true),
                        position: this.widget_options.legend_position ? this.widget_options.legend_position : 'bottom',
                        labels: {
                            font: {
                                size: this.widget_options.legend_font_size ? this.widget_options.legend_font_size : 12,
                            },
                            color: this.widget_options.legend_font_color ? this.widget_options.legend_font_color : '#666',
                            boxWidth: this.widget_options.legend_box_width ? this.widget_options.legend_box_width : 40,
                            padding: this.widget_options.legend_padding ? this.widget_options.legend_padding : 10,
                            usePointStyle: this.get_bool_option('legend_use_point_style', false)
                        },
                    },
                },

                scales: scales
            };

            return Object.assign({}, obj, interaction_option);
        } else {
            const scales = {};

            scales['x'] = {
                display: true,
                grid: {
                    display: false
                },
            };
            scales['y'] = {
                display: false,
                grid: {
                    display: false
                },
            };

            const var_chart_scales_options = this.widget_options.var_chart_scales_options;
            if (var_chart_scales_options && var_chart_scales_options.length > 0) {
                for (const i in this.current_charts_scales_options) {
                    const current_scale = new VarChartScalesOptionsVO().from(this.current_charts_scales_options[i]);
                    this.temp_current_scale = current_scale;
                    const title = this.t(current_scale.get_title_name_code_text(current_scale.page_widget_id, current_scale.chart_id));
                    if (title) {
                        scales[title] = {
                            display:false,
                            title: {
                                display: false
                            },
                            grid: {
                                display:false,
                                drawOnChartArea: false
                            },
                            type: current_scale.scale_options ? current_scale.scale_options.type : 'linear',
                            ticks: {
                                callback: this.get_scale_ticks_callback(current_scale),
                            },
                            axis: 'y',
                            position: current_scale.selected_position ? current_scale.selected_position : 'left',
                        };
                    }
                }
            }

            const obj = {
                inflateAmount: true,
                borderRadius: 10,
                responsive: true,
                fill: this.widget_options.var_charts_options.some((option) => option.type == 'line') ? true : false,
                tension: this.widget_options.var_charts_options.some((option) => option.type == 'line') ? 0.2 : 0,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: this.get_bool_option('title_display', true),
                        text: this.translated_title ? this.translated_title : '',
                        color: this.widget_options.title_font_color ? this.widget_options.title_font_color : '#666',
                        font: {
                            size: this.widget_options.title_font_size ? this.widget_options.title_font_size : 16,
                        },
                        padding: this.widget_options.title_padding ? this.widget_options.title_padding : 10,
                    },

                    tooltip: {
                        enabled: true,
                        axis: 'xy',
                        mode: this.widget_options.tooltip_by_index ? 'index' : 'nearest',
                    },
                    datalabels: {
                        display: false
                    },
                    legend: {
                        display: this.get_bool_option('legend_display', true),
                        position: this.widget_options.legend_position ? this.widget_options.legend_position : 'bottom',
                        labels: {
                            font: {
                                size: this.widget_options.legend_font_size ? this.widget_options.legend_font_size : 12,
                            },
                            color: this.widget_options.legend_font_color ? this.widget_options.legend_font_color : '#666',
                            boxWidth: this.widget_options.legend_box_width ? this.widget_options.legend_box_width : 40,
                            padding: this.widget_options.legend_padding ? this.widget_options.legend_padding : 10,
                            usePointStyle: this.get_bool_option('legend_use_point_style', false)
                        },
                    },
                },

                scales: scales
            };

            return obj;
        }
    }

    get charts_scales_options(): { [chart_id: string]: VarChartScalesOptionsVO } {
        if (!this.widget_options) {
            return null;
        }

        const res = {};

        if(this.widget_options.detailed) {
            for (const j in this.datasets) {
                const dataset = this.datasets[j];
                for (let i = 0; i < this.widget_options.var_charts_options.length; i++) {
                    const var_chart_option: VarChartOptionsVO = this.widget_options.var_charts_options[i];
                    if (var_chart_option.selected_filter_id == undefined) {
                        return;
                    }
                    const current_scale = new VarChartScalesOptionsVO().from(this.widget_options.var_chart_scales_options.find((scale) => scale.chart_id == var_chart_option.selected_filter_id));
                    const var_chart_id_dataset = var_chart_option.chart_id + '_' + dataset;

                    if (res[var_chart_id_dataset] == undefined) {
                        res[var_chart_id_dataset] = current_scale;
                    }
                }
            }
        } else {
            for (const j in this.datasets) {
                const dataset = this.datasets[j];
                for (let i = 0; i < this.widget_options.var_charts_options.length; i++) {
                    const var_chart_option: VarChartOptionsVO = this.widget_options.var_charts_options[i];
                    if (var_chart_option.selected_filter_id == undefined) {
                        return;
                    }
                    const current_scale = new VarChartScalesOptionsVO().from(this.widget_options.var_chart_scales_options.find((scale) => scale.chart_id == var_chart_option.selected_filter_id));
                    const var_chart_id_dataset = var_chart_option.chart_id + '_' + dataset;
                    current_scale.show_scale_title = false;
                    current_scale.fill = this.widget_options.var_charts_options.some((option) => option.type == 'line') ? true : false;
                    if (res[var_chart_id_dataset] == undefined) {
                        res[var_chart_id_dataset] = current_scale;
                    }
                }
            }
        }

        return res;
    }

    /**
     * charts_var_dataset_descriptor
     * - 2 cas : soit on a 2 vars, soit on a 1 var et une dimension sur laquelle on déploie la var
     *
     * @returns {{ [chart_id: string]: VarMixedChartDataSetDescriptor }}
     */
    get charts_var_dataset_descriptor(): { [chart_id: string]: VarMixedChartDataSetDescriptor } {

        if (!this.widget_options) {
            return null;
        }

        if ((!this.widget_options?.var_charts_options?.length) ||
            !this.widget_options.var_charts_options?.every((var_chart_options) => !!VarsController.var_conf_by_id[var_chart_options.var_id])) {
            return null;
        }

        const mixed_charts_dataset_descriptor: { [chart_id: string]: VarMixedChartDataSetDescriptor } = {};

        if (!this.widget_options.has_dimension) {

            for (const j in this.datasets) {
                const dataset = this.datasets[j];
                let show_point = true;
                for (const key in this.widget_options.var_charts_options) {
                    const var_chart_options = this.widget_options.var_charts_options[key];

                    if (!var_chart_options) {
                        continue;
                    }

                    if (!var_chart_options.var_id || !VarsController.var_conf_by_id[var_chart_options.var_id]) {
                        return null;
                    }

                    const var_chart_id_dataset = var_chart_options.chart_id + '_' + dataset;

                    let label_translatable_code: string = '';
                    if (this.datasets.length > 1) {
                        label_translatable_code = dataset;
                    } else {
                        label_translatable_code = this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id)) != this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id) ? this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id)) : '';
                    }

                    let backgroundColor = var_chart_options.bg_color;
                    let borderColor = var_chart_options.border_color;
                    if (!this.widget_options.detailed) {
                        show_point = false;
                        var_chart_options.show_values = false;
                        borderColor = backgroundColor;
                        if (backgroundColor.startsWith('#')) {
                            backgroundColor = this.hexToRgbA(var_chart_options.bg_color);
                            if (var_chart_options.type == 'line') {
                                backgroundColor += ',1)';
                            } else {
                                backgroundColor += ',0.6)';
                            }
                        } else {
                            const temp_bgcol = var_chart_options.bg_color.split(',');
                            if (var_chart_options.type == 'line') {
                                backgroundColor = temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',1)';
                            } else {
                                backgroundColor = temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',0.6)';
                            }
                        }
                    }

                    mixed_charts_dataset_descriptor[var_chart_id_dataset] = new VarMixedChartDataSetDescriptor(
                        VarsController.var_conf_by_id[var_chart_options.var_id].name,
                        label_translatable_code
                    )
                        .set_backgrounds([backgroundColor])
                        .set_gradients([var_chart_options.has_gradient])
                        .set_bordercolors([borderColor])
                        .set_borderwidths([var_chart_options.border_width])
                        .set_type(var_chart_options.type)
                        .set_filters_type(var_chart_options.filter_type)
                        .set_filters_additional_params(var_chart_options.filter_additional_params)
                        .set_activate_datalabels(var_chart_options.show_values)
                        .set_show_zeros(var_chart_options.show_zeros)
                        .set_show_points(show_point);
                }
            }

            return mixed_charts_dataset_descriptor;
        }


        for (const j in this.datasets) {
            const dataset = this.datasets[j];
            let show_point = true;
            for (const key in this.widget_options.var_charts_options) {
                const var_chart_options = this.widget_options.var_charts_options[key];

                if (!var_chart_options) {
                    continue;
                }

                if (!var_chart_options.var_id || !VarsController.var_conf_by_id[var_chart_options.var_id]) {
                    return null;
                }
                let base_color = null;
                let is_rbga = true;
                let colors = [];

                if (var_chart_options.has_gradient && var_chart_options.type!= 'line') {
                    // tentative de faire un dégradé automatique de couleur pour les dimensions.
                    // à voir comment on peut proposer de paramétrer cette partie

                    if (var_chart_options.bg_color && var_chart_options.bg_color.startsWith('#')) {
                        base_color = this.hexToRgbA(var_chart_options.bg_color);
                        base_color = base_color.slice(0, base_color.lastIndexOf(','));
                        is_rbga = true;
                    } else if (var_chart_options.bg_color && var_chart_options.bg_color.startsWith('rgb(')) {
                        base_color = 'rgba(' + var_chart_options.bg_color.substring(4, var_chart_options.bg_color.length - 2);
                        is_rbga = true;
                    } else if (var_chart_options.bg_color && var_chart_options.bg_color.startsWith('rgba(')) {
                        base_color = var_chart_options.bg_color.slice(0, var_chart_options.bg_color.lastIndexOf(','));
                        is_rbga = true;
                    }

                    if (!base_color) {
                        base_color = 'rgba(0,0,0';
                        is_rbga = true;
                    }

                    for (let i in this.ordered_dimension) {
                        let nb = parseInt(i);
                        let color = base_color;
                        if (is_rbga) {
                            color += ',' + (1 - (1 / this.ordered_dimension.length) * nb) + ')';
                        } else {
                            color += Math.floor(255 * (1 - (1 / this.ordered_dimension.length) * nb)).toString(16);
                        }
                        colors.push(color);
                    }
                } else {
                    if (!var_chart_options.color_palette) {
                        let color = var_chart_options.bg_color;

                        if ((this.datasets.length > 1) || !color) {
                            color = this.getRandomColor();
                        }

                        for (const i in this.ordered_dimension) {
                            colors.push(color);
                        }
                    } else {
                        const index_for_color: number = parseInt(key) + parseInt(j);
                        let color = var_chart_options.color_palette.colors[index_for_color];

                        if (!color) {
                            color = this.getRandomColor();
                        }

                        if (color.startsWith('#')) {
                            colors.push(this.hexToRgbA(color, true));
                        } else {
                            colors.push(color);
                        }
                    }
                }


                const var_chart_id_dataset = var_chart_options.chart_id + '_' + dataset;

                let label_translatable_code: string = '';
                if (!!this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
                    label_translatable_code = dataset;
                } else {
                    label_translatable_code = this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id)) != this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id) ? this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id)) : '';
                }

                let border_color = ['rgb(0,0,0)'];

                if (!this.widget_options.detailed) {
                    var_chart_options.show_values = false;
                    show_point = false;
                    for (const i in colors) {
                        let color = colors[i];
                        if (color.startsWith('#')) {
                            color = this.hexToRgbA(color);
                            if (var_chart_options.type == 'line') {
                                color += ' 1)';
                                border_color[i] = var_chart_options.border_color;
                            } else {
                                color += ' 0.6)';
                                border_color[i] = this.hexToRgbA(colors[i]) + '1)';
                            }
                            colors[i] = color;
                        } else {
                            const temp_bgcol = color.split(',');
                            if (var_chart_options.type == 'bar') {
                                if (!var_chart_options.has_gradient) {
                                    color = temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',0.6)';
                                    border_color[i] = temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',1)';
                                    colors[i] = color;
                                }
                            } else {
                                border_color[i] = var_chart_options.border_color;
                            }
                        }
                    }
                } else {
                    if (var_chart_options.color_palette || !var_chart_options.border_color) {
                        border_color = colors;
                    } else {
                        border_color = [var_chart_options.border_color];
                    }
                }

                mixed_charts_dataset_descriptor[var_chart_id_dataset] = new VarMixedChartDataSetDescriptor(
                    VarsController.var_conf_by_id[var_chart_options.var_id].name,
                    label_translatable_code
                )
                    .set_backgrounds(colors)
                    .set_bordercolors(border_color)
                    .set_borderwidths([var_chart_options.border_width])
                    .set_type(var_chart_options.type)
                    .set_filters_type(var_chart_options.filter_type)
                    .set_filters_additional_params(var_chart_options.filter_additional_params)
                    .set_activate_datalabels(var_chart_options.show_values)
                    .set_show_zeros(var_chart_options.show_zeros)
                    .set_show_points(show_point);
            }
        }

        return mixed_charts_dataset_descriptor;
    }

    get charts_var_params(): { [chart_id: string]: VarDataBaseVO[] } {

        if (!this.widget_options) {
            return null;
        }

        const res: { [chart_id: string]: VarDataBaseVO[] } = {};

        if (!this.widget_options.has_dimension) {
            return null;
        }

        if ((!this.charts_var_params_by_dimension) || (!this.ordered_dimension) ||
            (Object.keys(this.charts_var_params_by_dimension).every((key) =>
                Object.values(this.charts_var_params_by_dimension[key]).length != this.ordered_dimension.length)
            )
        ) {
            return null;
        }

        for (const chart_id in this.charts_var_params_by_dimension) {
            const chart_var_params_by_dimension = this.charts_var_params_by_dimension[chart_id];

            for (const i in this.ordered_dimension) {
                const dimension = this.ordered_dimension[i];

                if (!chart_var_params_by_dimension[dimension]) {
                    return null;
                }

                if (!res[chart_id]) {
                    res[chart_id] = [];
                }

                res[chart_id].push(chart_var_params_by_dimension[dimension]);
            }
        }

        return res;
    }

    /**
     * var_custom_filters
     *
     * @returns {{ [var_param_field_name: string]: string }}
     */
    get var_custom_filters(): { [chart_id: string]: { [var_param_field_name: string]: string } } {
        if (!this.widget_options) {
            return null;
        }

        const custom_filters: { [chart_id: string]: { [var_param_field_name: string]: string } } = {};
        // Merge each chart custom filters
        this.widget_options.var_charts_options?.forEach((var_chart_options) => {
            if (!var_chart_options.custom_filter_names) {
                return;
            }
            const custom_filter: { [var_param_field_name: string]: string } = {};

            for (const i in var_chart_options.custom_filter_names) {
                const custom_filter_name = var_chart_options.custom_filter_names[i];

                if (!custom_filter_name) {
                    continue;
                }

                custom_filter[i] = custom_filter_name;
            }
            custom_filters[var_chart_options.chart_id] = custom_filter;
        });

        return ObjectHandler.hasAtLeastOneAttribute(custom_filters) ? custom_filters : null;
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    get var_filter_additional_params(): [] {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.filter_additional_params ? ObjectHandler.try_get_json(this.widget_options.filter_additional_params) : undefined;
    }

    get translated_title(): string {
        if (!this.widget_options) {
            return null;
        }
        if (this.t(this.widget_options.get_title_name_code_text(this.page_widget.id)) != this.widget_options.get_title_name_code_text(this.page_widget.id)) {
            return this.t(this.widget_options.get_title_name_code_text(this.page_widget.id));
        }

        return 'Title';
    }

    get translated_scale_x_title(): string {
        if (!this.widget_options) {
            return null;
        }
        if (this.t(this.widget_options.get_scale_x_code_text(this.page_widget.id)) != this.widget_options.get_scale_x_code_text(this.page_widget.id)) {
            return this.t(this.widget_options.get_scale_x_code_text(this.page_widget.id));
        }
        if (this.widget_options.scale_options_x != null) {
            return this.widget_options.scale_options_x.type + ' Axis';
        }
    }

    @Watch('translated_scale_x_title')
    private async onchange_translated_scale_x_title() {
        await this.throttled_update_visible_options();
    }

    @Watch('options')
    @Watch('charts_var_dataset_descriptor')
    @Watch('charts_var_params')
    @Watch('charts_scales_options')
    private async onchange_options() {
        if (!this.options || !this.charts_var_dataset_descriptor || !this.charts_var_params) {
            return;
        }

        this.current_charts_scales_options = this.charts_scales_options;
        this.current_charts_var_dataset_descriptor = this.charts_var_dataset_descriptor;
        this.current_charts_var_params = this.charts_var_params;
        this.current_options = this.options;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        await this.throttled_update_visible_options();
    }

    private async mounted() {
        await ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page.dashboard_id,
            this.dashboard_page.id,
            this.page_widget.id,
            this.throttle_do_update_visible_options.bind(this),
        );
    }

    private get_bool_option(option: string, default_value: boolean): boolean {
        return (this.widget_options && (typeof this.widget_options[option] === 'boolean')) ? this.widget_options[option] : default_value;
    }

    private getlabel(var_param: VarDataBaseVO) {

        if (!this.label_by_index || !this.label_by_index[var_param.id]) {
            return null;
        }
        if (this.label_by_index[var_param.id].length > 1) {
            return this.label_by_index[var_param.id][0];
        }
        return this.label_by_index[var_param.id];
    }

    private async update_visible_options(force: boolean = false) {

        // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
        if ((!force) && this.has_widget_validation_filtres()) {
            return;
        }

        await this.throttle_do_update_visible_options();
    }

    private has_widget_validation_filtres(): boolean {

        if (!this.all_page_widget) {
            return false;
        }

        for (const i in this.all_page_widget) {
            const widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_validation_filters) {
                return true;
            }
        }

        return false;
    }

    /**
     * get_charts_var_params_by_dimension_when_dimension_is_vo_field_ref
     *
     * @param {[chart_id:string]:{ [var_param_field_name: string]: ContextFilterVO }} custom_filters
     * @returns {Promise<{ [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } }>}
     */
    private async get_charts_var_params_by_dimension_when_dimension_is_vo_field_ref(
        custom_filters: { [chart_id: string]: { [var_param_field_name: string]: ContextFilterVO } }
    ): Promise<{ [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } }> {

        // Case when we have some var_charts_options and all of them are valid
        if (!this.widget_options.dimension_vo_field_ref || (!this.widget_options?.var_charts_options?.length) ||
            !this.widget_options.var_charts_options?.every((var_chart_options) => !!VarsController.var_conf_by_id[var_chart_options.var_id])) {

            return null;
        }
        this.isValid = true;
        const charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = {};
        let context_query: ContextQueryVO = null;
        /**
        * Si la dimension est un champ de référence, on va chercher les valeurs possibles du champs en fonction des filtres actifs
        */
        context_query = query(this.widget_options.dimension_vo_field_ref.api_type_id)
            .set_limit(this.widget_options.max_dimension_values)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by_vo_field_ref) {
            context_query.set_sort(new SortByVO(
                this.widget_options.sort_dimension_by_vo_field_ref.api_type_id,
                this.widget_options.sort_dimension_by_vo_field_ref.field_id,
                this.widget_options.sort_dimension_by_asc
            ));
        }

        const dimensions = await context_query.select_vos(); // on query tout l'objet pour pouvoir faire les labels des dimensions si besoin .field(this.widget_options.dimension_vo_field_ref.field_id)

        if ((!dimensions) || (!dimensions.length)) {
            this.charts_var_params_by_dimension = null;

            return;
        }

        const label_by_index: { [index: string]: string[] } = {};
        const ordered_dimension: number[] = [];
        const promises = [];

        const dimension_table = (this.widget_options.dimension_is_vo_field_ref && this.widget_options.dimension_vo_field_ref.api_type_id) ?
            ModuleTableController.module_tables_by_vo_type[this.widget_options.dimension_vo_field_ref.api_type_id] : null;

        let cpt_for_var: number = 0;

        for (const j in this.datasets) {
            const dataset = this.datasets[j];

            for (const key in this.widget_options.var_charts_options) {
                const var_chart_options = this.widget_options.var_charts_options[key];
                const var_chart_id = var_chart_options.chart_id;
                const var_chart_id_dataset = var_chart_id + '_' + dataset;
                const custom_filter = custom_filters[var_chart_id];

                for (const i in dimensions) {
                    const dimension: any = dimensions[i];
                    let dimension_value: any = dimension[this.widget_options.dimension_vo_field_ref.field_id];
                    if (!dimension_value) {
                        dimension_value = '[NULL]';
                    }

                    if (!ordered_dimension.includes(dimension_value)) {
                        ordered_dimension.push(dimension_value);
                    }

                    promises.push((async () => {

                        /**
                         * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
                         */
                        let active_field_filters = cloneDeep(this.get_active_field_filters);
                        if (!active_field_filters) {
                            active_field_filters = {};
                        }

                        if (!active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id]) {
                            active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id] = {};
                        }
                        switch (typeof dimension_value) {
                            case 'string':
                                active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id][this.widget_options.dimension_vo_field_ref.field_id] = filter(
                                    this.widget_options.dimension_vo_field_ref.api_type_id,
                                    this.widget_options.dimension_vo_field_ref.field_id
                                ).by_text_has(dimension_value);
                                break;
                            case 'number':
                                active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id][this.widget_options.dimension_vo_field_ref.field_id] = filter(
                                    this.widget_options.dimension_vo_field_ref.api_type_id,
                                    this.widget_options.dimension_vo_field_ref.field_id
                                ).by_num_has([dimension_value]);
                                break;
                        }

                        if (!charts_var_params_by_dimension[var_chart_id_dataset]) {
                            charts_var_params_by_dimension[var_chart_id_dataset] = {};
                        }

                        // Si on a un field de dataset, on doit le rajouter aux filtres
                        if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
                            if (!active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id]) {
                                active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id] = {};
                            }

                            switch (typeof dataset) {
                                case 'string':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] = filter(
                                        this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                        this.widget_options.multiple_dataset_vo_field_ref.field_id
                                    ).by_text_has(dataset);
                                    break;
                                case 'number':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] = filter(
                                        this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                        this.widget_options.multiple_dataset_vo_field_ref.field_id
                                    ).by_num_has([dataset]);
                                    break;
                            }
                        }

                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                            VarsController.var_conf_by_id[var_chart_options.var_id].name,
                            active_field_filters,
                            custom_filter,
                            this.get_dashboard_api_type_ids,
                            this.get_discarded_field_paths
                        );

                        if (!charts_var_params_by_dimension[var_chart_id_dataset][dimension_value]) {
                            if ((dimension_value !== '[NULL]') && (this.datasets.length == 1)) {
                                this.isValid = false;
                                return;
                            } else {
                                charts_var_params_by_dimension[var_chart_id_dataset][dimension_value] = new VarDataBaseVO();
                            }
                        }

                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value].id = cpt_for_var;
                        let label = 'NULL';
                        if (this.widget_options.dimension_vo_field_ref.field_id) {
                            if (dimension[this.widget_options.dimension_vo_field_ref.field_id]) {
                                label = dimension[this.widget_options.dimension_vo_field_ref.field_id];
                            }
                        } else if (dimension_table && dimension_table.default_label_field) {
                            label = dimension[dimension_table.default_label_field.field_id];
                        } else if (dimension_table && dimension_table.table_label_function) {
                            label = dimension_table.table_label_function(dimension);
                        }
                        if (label_by_index[cpt_for_var] === undefined) {
                            label_by_index[cpt_for_var] = [];
                        }
                        label_by_index[cpt_for_var].push(label);

                        cpt_for_var++;
                    })());
                }
            }
        }

        const query_res: ContextQueryVO = query(this.widget_options.dimension_vo_field_ref.api_type_id)
            .set_limit(this.widget_options.max_dimension_values)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));

        await all_promises(promises);

        this.ordered_dimension = ordered_dimension;
        this.label_by_index = label_by_index;

        return charts_var_params_by_dimension;
    }

    /**
     * get_charts_var_params_by_dimension_when_dimension_is_custom_filter
     *
     * When dimension is a custom filter, we need to get the var params for each dimension value
     *  - The custom filter is must likely a date filter
     *
     * @param {[chart_id:string]:{ [var_param_field_name: string]: ContextFilterVO }} custom_filters
     * @returns {Promise<{[dimension_value: number]: VarDataBaseVO}>}
     */
    private async get_charts_var_params_by_dimension_when_dimension_is_custom_filter(
        custom_filters: { [chart_id: string]: { [var_param_field_name: string]: ContextFilterVO } }
    ): Promise<{ [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } }> {

        if ((!this.widget_options?.var_charts_options?.length) ||
            !this.widget_options.var_charts_options?.every((var_chart_options) => !!VarsController.var_conf_by_id[var_chart_options.var_id])) {

            return null;
        }

        const charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = {};
        this.isValid = true;
        /**
         * Sinon on se base sur la liste des valeurs possibles pour la dimension segmentée
         */
        if (!this.widget_options.dimension_custom_filter_name) {
            this.charts_var_params_by_dimension = null;

            return;
        }

        // We should have a custom filter for the dimension and a list of custom filters for each var
        if (!this.widget_options.var_charts_options?.length ||
            !this.widget_options.var_charts_options?.every((var_chart_options) => !!var_chart_options.custom_filter_names)) {

            this.charts_var_params_by_dimension = null;

            return;
        }

        /**
         * On checke qu'on a bien une dimension de la var dont la correspondance en filtrage spécifique est le filtre de dimension
         */
        const found: { [chart_id: string]: boolean } = {};

        // We check that we have a custom filter for the dimension in all var_charts_options
        for (const i in this.widget_options.var_charts_options) {
            const var_chart_options = this.widget_options.var_charts_options[i];

            for (const j in var_chart_options.custom_filter_names) {
                const custom_filter_name = var_chart_options.custom_filter_names[j];

                if (custom_filter_name == this.widget_options.dimension_custom_filter_name) {
                    found[var_chart_options.chart_id] = true;
                }
            }
        }

        // TODO: maybe ask for more precision here
        // If we don't have a custom filter for the dimension in all var_charts_options, we can't continue
        if (!Object.values(found).every((v) => v)) {
            this.charts_var_params_by_dimension = null;
            return;
        }

        /**
         * On défini ensuite la liste des valeurs possibles pour la dimension
         *  on est sur des dates, donc on cherche à savoir les dates valides suivant les filtrages actuels (les ranges valides)
         *  puis on itère sur ces ranges en fonction de la segmentation sélectionnée
         *  en limitant au nombre max de valeurs de dimension
         */
        const dimension_values: number[] = this.get_dimension_values();

        if ((!dimension_values) || (!dimension_values.length)) {
            this.charts_var_params_by_dimension = null;
            this.ordered_dimension = null;
            this.label_by_index = null;

            return;
        }

        this.ordered_dimension = dimension_values;

        let label_by_index: { [index: string]: string[] } = {};
        let promises = [];
        let cpt_for_var: number = 0;

        for (const j in this.datasets) {
            const dataset = this.datasets[j];

            for (const key in this.widget_options.var_charts_options) {
                const var_chart_options = this.widget_options.var_charts_options[key];

                const var_chart_id = var_chart_options.chart_id;
                const var_chart_id_dataset = var_chart_id + '_' + dataset;
                const custom_filter = custom_filters[var_chart_id];
                for (const i in dimension_values) {
                    const dimension_value: number = dimension_values[i];

                    promises.push((async () => {

                        /**
                         * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
                         */
                        const active_field_filters = cloneDeep(this.get_active_field_filters);

                        active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name] = filter(
                            ContextFilterVO.CUSTOM_FILTERS_TYPE,
                            this.widget_options.dimension_custom_filter_name
                        ).by_date_x_ranges([RangeHandler.create_single_elt_TSRange(dimension_value, this.widget_options.dimension_custom_filter_segment_type)]);

                        let update_custom_filters = cloneDeep(custom_filter);

                        if (this.get_active_field_filters && this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] &&
                            this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name]) {

                            for (const field_name in var_chart_options.custom_filter_names) {

                                const custom_filter_name = var_chart_options.custom_filter_names[field_name];

                                if (!custom_filter_name) {
                                    return;
                                }
                                if (custom_filter_name == this.widget_options.dimension_custom_filter_name) {
                                    if (!update_custom_filters) {
                                        update_custom_filters = {};
                                    }
                                    update_custom_filters[field_name] = active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name];
                                }
                            }
                        }

                        if (!charts_var_params_by_dimension[var_chart_id_dataset]) {
                            charts_var_params_by_dimension[var_chart_id_dataset] = {};
                        }

                        // Si on a un field de dataset, on doit le rajouter aux filtres
                        if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
                            if (!active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id]) {
                                active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id] = {};
                            }

                            switch (typeof dataset) {
                                case 'string':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] = filter(
                                        this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                        this.widget_options.multiple_dataset_vo_field_ref.field_id
                                    ).by_text_has(dataset);
                                    break;
                                case 'number':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] = filter(
                                        this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                        this.widget_options.multiple_dataset_vo_field_ref.field_id
                                    ).by_num_has([dataset]);
                                    break;
                            }
                        }

                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                            VarsController.var_conf_by_id[var_chart_options.var_id].name,
                            active_field_filters,
                            update_custom_filters,
                            this.get_dashboard_api_type_ids,
                            this.get_discarded_field_paths
                        );

                        if (!charts_var_params_by_dimension[var_chart_id_dataset][dimension_value]) {
                            this.isValid = false;
                            return;
                        }

                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value].id = cpt_for_var;
                        if (label_by_index[cpt_for_var] === undefined) {
                            label_by_index[cpt_for_var] = [];
                        }
                        label_by_index[cpt_for_var].push(Dates.format_segment(dimension_value, this.widget_options.dimension_custom_filter_segment_type));

                        cpt_for_var++;
                    })());
                }
            }
        }

        await all_promises(promises);

        this.label_by_index = label_by_index;

        return charts_var_params_by_dimension;
    }

    /**
     * A voir si c'est la bonne méthode pas évident.
     *  Pour le moment on prend les filtres potentiels en diminuant la granularité petit à petit
     *  on est sur du custom filter
     *
     * @returns {number[]}
     */
    private get_dimension_values(): number[] {

        // On récupère le root du filtrage
        let root_context_filter: ContextFilterVO = null;

        if (!this.widget_options.dimension_custom_filter_name) {
            return null;
        }

        root_context_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ?
            this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name] : null;

        /** Si on a pas de filtre, on peut pas connaître les bornes, donc on refuse */
        if (!root_context_filter) {
            return null;
        }

        // Get the ranges from the root filter
        const ts_ranges = ContextFilterVOHandler.get_ts_ranges_from_context_filter_root(
            root_context_filter,
            this.widget_options.dimension_custom_filter_segment_type,
            this.widget_options.max_dimension_values,
            this.widget_options.sort_dimension_by_asc
        );

        const dimension_values: number[] = [];
        RangeHandler.foreach_ranges_sync(ts_ranges, (d: number) => {
            dimension_values.push(d);
        }, this.widget_options.dimension_custom_filter_segment_type, null, null, !this.widget_options.sort_dimension_by_asc);

        return dimension_values;
    }

    /**
     * do_update_visible_options
     *
     * @returns {Promise<void>}
     */
    private async do_update_visible_options(): Promise<void> {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if (!this.widget_options) {
            this.charts_var_params_by_dimension = null;
            this.ordered_dimension = null;
            this.label_by_index = null;

            return;
        }
        const custom_filters = {};
        this.widget_options.var_charts_options?.forEach((var_chart_options) => {

            const custom_filter: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(
                this.var_custom_filters[var_chart_options.chart_id],
                this.get_active_field_filters
            );
            custom_filters[var_chart_options.chart_id] = custom_filter;
        });


        await this.set_datasets();

        if (this.widget_options.has_dimension) {
            await this.set_charts_var_params_by_dimension(custom_filters, launch_cpt);
        }
    }

    private async set_datasets() {
        const res = [];

        // Si on cherche à avoir du multi dataset, il faut charger les données
        if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {

            const query_dataset: ContextQueryVO = query(this.widget_options.multiple_dataset_vo_field_ref.api_type_id)
                .set_limit(this.widget_options.max_dataset_values)
                .using(this.get_dashboard_api_type_ids)
                .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                    FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
                ));
            FieldValueFilterWidgetManager.add_discarded_field_paths(query_dataset, this.get_discarded_field_paths);

            const datasets_vos = await query_dataset.select_vos();

            for (const i in datasets_vos) {
                const dataset = datasets_vos[i];
                const dataset_label = dataset[this.widget_options.multiple_dataset_vo_field_ref.field_id];

                if ((dataset_label != null)) {
                    res.push(dataset_label);
                }
            }
        } else {
            res.push('NULL');
        }

        this.datasets = res;
    }

    private async set_charts_var_params_by_dimension(
        custom_filters: { [chart_id: string]: { [var_param_field_name: string]: ContextFilterVO } },
        launch_cpt: number
    ) {

        let charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = {};

        if (!!this.widget_options.dimension_is_vo_field_ref) {
            charts_var_params_by_dimension = await this.get_charts_var_params_by_dimension_when_dimension_is_vo_field_ref(custom_filters);
        } else {
            charts_var_params_by_dimension = await this.get_charts_var_params_by_dimension_when_dimension_is_custom_filter(custom_filters);
        }

        // Désactivé suite au retour de MDE sur le fait que c'est insupportable / pas nécessaire
        // if (!this.isValid) {
        //     this.snotify.error(this.t(this.ERROR_MESSAGE));
        //     return;
        // }
        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.charts_var_params_by_dimension = charts_var_params_by_dimension;
    }
    private getLabelsForScale(value, current_scale: VarChartScalesOptionsVO) {
        if (this.temp_current_scale == null) {
            return value;
        }
        if (current_scale.filter_type == Filters.FILTER_TYPE_none) {
            return value;
        }


        let filter_read = current_scale.filter_type ? this.const_filters[current_scale.filter_type].read : undefined;
        let filter_additional_params = current_scale.filter_additional_params ? ObjectHandler.try_get_json(current_scale.filter_additional_params) : undefined;
        if (filter_read != undefined) {
            if (filter_read) {
                return filter_read.apply(this, [value].concat(filter_additional_params));
            } else {
                return value;
            }
        }
    }

    private get_scale_ticks_callback(current_scale: VarChartScalesOptionsVO) {
        return (value, index, values) => {
            return this.getLabelsForScale(value, current_scale);
        };
    }

    private getLabelsForTooltip(context) {
        const value = context.raw;
        const axisID = context.dataset.yAxisID;
        const current_scale: VarChartScalesOptionsVO = Object.values(this.current_charts_scales_options).find((scale) => {
            if (axisID == this.t(scale.get_title_name_code_text(scale.page_widget_id, scale.chart_id))) {
                return scale;
            }
        });

        if (current_scale == null) {
            return value;
        }
        if (current_scale.filter_type == Filters.FILTER_TYPE_none) {
            return value;
        }

        let filter_read = current_scale.filter_type ? this.const_filters[current_scale.filter_type].read : undefined;
        let filter_additional_params = current_scale.filter_additional_params ? ObjectHandler.try_get_json(current_scale.filter_additional_params) : undefined;
        if (filter_read != undefined) {
            if (filter_read) {
                return filter_read.apply(this, [value].concat(filter_additional_params));
            } else {
                return value;
            }
        }
    }

    private hexToRgbA(hex, opacity_definitive = false) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            const str = 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',';
            if (opacity_definitive) {
                return str + '1)';
            }
            return str;
        }
        throw new Error('Bad Hex');
    }

    private getRandomColor() {
        const trans = '1';
        let color = 'rgba(';
        for (let i = 0; i < 3; i++) {
            color += Math.floor(Math.random() * 255) + ',';
        }
        color += trans + ')'; // add the transparency
        return color;
    }
}