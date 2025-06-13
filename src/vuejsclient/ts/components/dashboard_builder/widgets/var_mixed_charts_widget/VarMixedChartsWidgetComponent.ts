import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';

import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';

import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';

import VarChartOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarChartScalesOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VarMixedChartWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';

import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';

import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarMixedChartDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarMixedChartDataSetDescriptor';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';

import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import Filters from '../../../../../../shared/tools/Filters';
import ObjectHandler, { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';

import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { IChartOptions } from '../../../Var/components/mixed-chart/VarMixedChartComponent';
import VueComponentBase from '../../../VueComponentBase';

import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';

import './VarMixedChartsWidgetComponent.scss';


@Component({
    template: require('./VarMixedChartsWidgetComponent.pug')
})
export default class VarMixedChartsWidgetComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    // --------------------------------------------------------------------------
    //  Props et injections du store
    // --------------------------------------------------------------------------
    @ModuleTranslatableTextGetter private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null }) private all_page_widget: DashboardPageWidgetVO[];
    @Prop({ default: null }) private page_widget: DashboardPageWidgetVO;
    @Prop({ default: null }) private dashboard: DashboardVO;
    @Prop({ default: null }) private dashboard_page: DashboardPageVO;

    // --------------------------------------------------------------------------
    //  Données "internes"
    // --------------------------------------------------------------------------

    /**
     * Message d'erreur générique (i18n code)
     */
    private ERROR_MESSAGE = 'var_mixed_charts_widget.error_message';

    /**
     * Permet de limiter la fréquence (debounce) des updates
     */
    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

    /**
     * Suivi de l'ordre des dimensions (dans le cas dimension_is_vo_field_ref)
     */
    private ordered_dimension: number[] = null;

    /**
     * label_by_index : pour chaque VarDataBaseVO.id, on stocke la liste des labels (ex : [ 'label1', 'label2' ])
     */
    private label_by_index: { [index: string]: string[] } = null;

    /**
     * charts_var_params_by_dimension : un objet par chart_id => dimension_value => VarDataBaseVO
     */
    private charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = null;

    /**
     * Compteur interne pour savoir si on est toujours sur la dernière requête
     */
    private last_calculation_cpt: number = 0;

    /**
     * Données courantes (mises à jour par watchers) pour les chart
     */
    private current_charts_var_dataset_descriptor: { [chart_id: string]: VarMixedChartDataSetDescriptor } = null;
    private current_charts_var_params: { [chart_id: string]: VarDataBaseVO[] } = null;
    private current_options: IChartOptions = null;
    private current_charts_scales_options: { [chart_id: string]: VarChartScalesOptionsVO } = null;

    /**
     * Liste finale des "datasets" (par ex. pour un multi-dataset)
     */
    private datasets: any[] = [];

    /**
     * Temporaire pour tracking d'une scale en cours d'édition (a priori)
     */
    private temp_current_scale: VarChartScalesOptionsVO = null;

    /**
     * isValid : si "false", on a détecté qu'il n'y avait pas de param var
     */
    private isValid: boolean = true;

    private chart_result_nb: { [chart_id: string]: number } = null;
    private chart_result_txt: string = null;

    // --------------------------------------------------------------------------
    //  Getters
    // --------------------------------------------------------------------------

    /**
     * Raccourci : renvoie l'instance VarMixedChartWidgetOptionsVO (décodée) du page_widget
     */
    get widget_options(): VarMixedChartWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }
        let options: VarMixedChartWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                const parsed = JSON.parse(this.page_widget.json_options) as VarMixedChartWidgetOptionsVO;
                options = parsed ? new VarMixedChartWidgetOptionsVO().from(parsed) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
        return options;
    }

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_dashboard_api_type_ids);
    }

    get get_discarded_field_paths(): { [vo_type: string]: { [field_id: string]: boolean } } {
        return this.vuexGet<{ [vo_type: string]: { [field_id: string]: boolean } }>(reflect<this>().get_discarded_field_paths);
    }

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }

    get get_custom_filters(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_custom_filters);
    }


    /**
     * Filtre Var => s'il est défini (var_filter)
     */
    get var_filter(): () => string {
        if (!this.widget_options) {
            return null;
        }
        if (this.widget_options.filter_type == 'none') {
            return null;
        }
        return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
    }

    /**
     * charts_scales_options_filtered
     * Renvoie un objet (chart_id => boolean) utilisé pour savoir si la scale est activée ou non
     */
    get chart_scales_options_filtered(): { [chart_id: string]: boolean } {
        if (!this.widget_options) {
            return null;
        }
        const res = {};
        for (let i = 0; i < this.widget_options.var_chart_scales_options.length; i++) {
            const current_scale = this.widget_options.var_chart_scales_options[i];
            if (res[current_scale.chart_id] === undefined) {
                res[current_scale.chart_id] = false;
            }
        }
        return res;
    }

    /**
     * charts_scales_options
     * Regroupe (chart_id_dataset => VarChartScalesOptionsVO) en fonction de "detailed" ou non
     */
    get charts_scales_options(): { [chart_id: string]: VarChartScalesOptionsVO } {
        if (!this.widget_options) {
            return null;
        }

        const res = {};
        if (this.widget_options.detailed) {
            // Mode "détaillé"
            for (const j in this.datasets) {
                const dataset = this.datasets[j];
                for (let i = 0; i < this.widget_options.var_charts_options.length; i++) {
                    const var_chart_option: VarChartOptionsVO = this.widget_options.var_charts_options[i];
                    if (var_chart_option.selected_filter_id == undefined) {
                        return;
                    }
                    const current_scale = new VarChartScalesOptionsVO().from(
                        this.widget_options.var_chart_scales_options.find((scale) => scale.chart_id == var_chart_option.selected_filter_id)
                    );
                    let var_chart_id_dataset = var_chart_option.chart_id + '_' + dataset;
                    if (dataset == 'NULL') {
                        var_chart_id_dataset = var_chart_option.chart_id.toString();
                    }

                    if (res[var_chart_id_dataset] == undefined) {
                        res[var_chart_id_dataset] = current_scale;
                    }
                }
            }
        } else {
            // Mode "simple"
            for (const j in this.datasets) {
                const dataset = this.datasets[j];
                for (let i = 0; i < this.widget_options.var_charts_options.length; i++) {
                    const var_chart_option: VarChartOptionsVO = this.widget_options.var_charts_options[i];
                    if (var_chart_option.selected_filter_id == undefined) {
                        return;
                    }
                    const current_scale = new VarChartScalesOptionsVO().from(
                        this.widget_options.var_chart_scales_options.find((scale) => scale.chart_id == var_chart_option.selected_filter_id)
                    );
                    let var_chart_id_dataset = var_chart_option.chart_id + '_' + dataset;
                    if (dataset == 'NULL') {
                        var_chart_id_dataset = var_chart_option.chart_id.toString();
                    }
                    // On force l'absence de titre
                    current_scale.show_scale_title = false;
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
     * Retourne la configuration VarMixedChartDataSetDescriptor pour chaque chart + dataset
     *
     * 2 cas majeurs :
     *  - has_dimension = false => on fait un descriptor par var
     *  - has_dimension = true => on gère un descriptor par dimension + palette
     */
    get charts_var_dataset_descriptor(): { [chart_id: string]: VarMixedChartDataSetDescriptor } {

        if (!this.widget_options) {
            return null;
        }

        // Vérif qu'on a bien des var_id
        if (
            !this.widget_options?.var_charts_options?.length ||
            !this.widget_options.var_charts_options.every((opt) => !!VarsController.var_conf_by_id[opt.var_id])
        ) {
            return null;
        }

        const mixed_charts_dataset_descriptor: { [chart_id: string]: VarMixedChartDataSetDescriptor } = {};

        // ----------------------------------------------------------------------
        // CAS has_dimension = false
        // ----------------------------------------------------------------------
        if (!this.widget_options.has_dimension) {
            for (const j in this.datasets) {
                const dataset = this.datasets[j];
                let show_point = true; // si "detailed" => line + points
                for (const key in this.widget_options.var_charts_options) {
                    const var_chart_options = this.widget_options.var_charts_options[key];
                    if (!var_chart_options) {
                        continue;
                    }
                    // On vérifie que la var est valide
                    if (!var_chart_options.var_id || !VarsController.var_conf_by_id[var_chart_options.var_id]) {
                        return null;
                    }

                    let var_chart_id_dataset = var_chart_options.chart_id + '_' + dataset;
                    if (dataset == 'NULL') {
                        var_chart_id_dataset = var_chart_options.chart_id.toString();
                    }

                    // Label
                    let label_translatable_code: string = '';
                    if (this.datasets.length > 1) {
                        // Plusieurs datasets => on prend "dataset" comme label ?
                        label_translatable_code = dataset;
                    } else {
                        // Sinon on prend le code text pour la var
                        const codeText = this.widget_options.get_var_name_code_text(this.page_widget.id, var_chart_options.var_id, var_chart_options.chart_id);
                        const translated = this.t(codeText);
                        label_translatable_code = translated !== codeText ? translated : '';
                    }

                    // Couleurs
                    let backgroundColor = var_chart_options.bg_color;
                    let borderColor = var_chart_options.border_color;

                    // Mode "simple" => on rend le chart plus "flat", sans point, etc.
                    if (!this.widget_options.detailed) {
                        show_point = false;
                        var_chart_options.show_values = false;

                        // On unifie la couleur de bordure avec la bg
                        borderColor = backgroundColor;
                        // On convertit le # en RGBA si besoin
                        backgroundColor = this.adaptColorForSimpleMode(backgroundColor, var_chart_options.type);
                    }

                    mixed_charts_dataset_descriptor[var_chart_id_dataset] = new VarMixedChartDataSetDescriptor(
                        VarsController.var_conf_by_id[var_chart_options.var_id].name,
                        label_translatable_code
                    )
                        .set_backgrounds([backgroundColor])
                        .set_gradients([var_chart_options.has_gradient])
                        .set_bordercolors([borderColor])
                        .set_borderwidths([var_chart_options.border_width])
                        .set_value_label_size(var_chart_options.value_label_size)
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

        // ----------------------------------------------------------------------
        // CAS has_dimension = true
        // ----------------------------------------------------------------------
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

                // Génération du tableau de couleurs (autant d'entries que de dimensions)
                const { colorArray, borderColorArray } =
                    this.generateColorsForDimension(var_chart_options, key, j);

                // Label
                let label_translatable_code: string = '';
                if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
                    // multi dataset => on prend dataset comme label
                    label_translatable_code = dataset;
                } else {
                    // label = code text => var chart
                    const codeText = this.widget_options.get_var_name_code_text(
                        this.page_widget.id,
                        var_chart_options.var_id,
                        var_chart_options.chart_id
                    );
                    const translated = this.t(codeText);
                    label_translatable_code = translated !== codeText ? translated : '';
                }

                // Mode "simple" => on simplifie couleurs, on enlève points, etc.
                if (!this.widget_options.detailed) {
                    var_chart_options.show_values = false;
                    show_point = false;
                    // On réadapte color & border pour chaque dimension
                    this.adaptColorArrayForSimpleMode(var_chart_options, colorArray, borderColorArray);
                } else {
                    // En mode "detailed", si var_chart_options.color_palette n'est pas défini, on utilise border_color
                    if (!var_chart_options.color_palette && var_chart_options.border_color) {
                        // On duplique la border en fonction du nombre de dimension
                        for (let i = 0; i < colorArray.length; i++) {
                            borderColorArray[i] = var_chart_options.border_color;
                        }
                    }
                }

                // On construit le dataset descriptor
                let var_chart_id_dataset = var_chart_options.chart_id + '_' + dataset;
                if (dataset == 'NULL') {
                    var_chart_id_dataset = var_chart_options.chart_id.toString();
                }
                mixed_charts_dataset_descriptor[var_chart_id_dataset] = new VarMixedChartDataSetDescriptor(
                    VarsController.var_conf_by_id[var_chart_options.var_id].name,
                    label_translatable_code
                )
                    .set_backgrounds(colorArray)
                    .set_bordercolors(borderColorArray)
                    .set_borderwidths([var_chart_options.border_width])
                    .set_value_label_size(var_chart_options.value_label_size)
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

    /**
     * charts_var_params : renvoie chart_id => VarDataBaseVO[]
     *  => On lit le charts_var_params_by_dimension pour reconstituer l'ordre de la dimension
     */
    get charts_var_params(): { [chart_id: string]: VarDataBaseVO[] } {
        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.has_dimension) {
            return null;
        }

        if (
            !this.charts_var_params_by_dimension ||
            !this.ordered_dimension
        ) {
            // On n'a pas un mapping complet => on sort
            return null;
        }

        // for (const chart_id in this.charts_var_params_by_dimension) {
        //     if (!this.charts_var_params_by_dimension[chart_id]) {
        //         continue;
        //     } else {
        //         if (Object.values(this.charts_var_params_by_dimension[chart_id]).length != this.ordered_dimension.length) {
        //             return null;
        //         }
        //     }
        // }
        const res: { [chart_id: string]: VarDataBaseVO[] } = {};
        for (const chart_id in this.charts_var_params_by_dimension) {
            const chart_var_params = this.charts_var_params_by_dimension[chart_id];
            if (!this.chart_result_nb) {
                this.chart_result_nb = {};
            }
            this.chart_result_nb[(this.charts_var_dataset_descriptor[chart_id]?.label_translatable_code) ? this.charts_var_dataset_descriptor[chart_id]?.label_translatable_code : this.charts_var_dataset_descriptor[chart_id]?.var_name] = 0;

            for (const i in this.ordered_dimension) {
                const dimensionVal = this.ordered_dimension[i];
                if (!chart_var_params[dimensionVal]) {
                    continue;
                }
                if (!res[chart_id]) {
                    res[chart_id] = [];
                }

                res[chart_id].push(chart_var_params[dimensionVal]);
                this.chart_result_nb[(this.charts_var_dataset_descriptor[chart_id]?.label_translatable_code) ? this.charts_var_dataset_descriptor[chart_id]?.label_translatable_code : this.charts_var_dataset_descriptor[chart_id]?.var_name]++;
            }
        }
        return res;
    }

    /**
     * var_custom_filters : fusionne les custom_filter_names de chaque var_charts_options
     */
    get var_custom_filters(): { [chart_id: string]: { [var_param_field_name: string]: string } } {
        if (!this.widget_options) {
            return null;
        }

        const custom_filters: { [chart_id: string]: { [var_param_field_name: string]: string } } = {};
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

    /**
     * widgets_by_id : map (widget_id => widget)
     */
    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    /**
     * var_filter_additional_params : parse le JSON si besoin
     */
    get var_filter_additional_params(): [] {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.filter_additional_params
            ? ObjectHandler.try_get_json(this.widget_options.filter_additional_params)
            : undefined;
    }

    /**
     * translated_title : on essaie de traduire le titre
     */
    get translated_title(): string {
        if (!this.widget_options) {
            return null;
        }
        const codeText = this.widget_options.get_title_name_code_text(this.page_widget.id);
        const translation = this.t(codeText);
        return translation !== codeText ? translation : 'Title';
    }

    /**
     * translated_scale_x_title : idem pour l'axe X
     */
    get translated_scale_x_title(): string {
        if (!this.widget_options) {
            return null;
        }
        const codeText = this.widget_options.get_scale_x_code_text(this.page_widget.id);
        const translation = this.t(codeText);

        if (translation !== codeText) {
            return translation;
        }
        // Sinon, fallback = 'type Axis'
        if (this.widget_options.scale_options_x != null) {
            return this.widget_options.scale_options_x.type + ' Axis';
        }
    }


    /**
     * options : renvoie la config Chart.js (IChartOptions) finale
     */
    get options(): IChartOptions {
        if (!this.widget_options) {
            return null;
        }
        // On récupère var_chart_scales_options
        const var_chart_scales_options = this.widget_options.var_chart_scales_options;
        const scales = {};

        // ----------------------------------------------------------------------
        // Mode "detailed"
        // ----------------------------------------------------------------------
        if (this.widget_options.detailed) {
            // Scales (Y1, Y2, Y3...) => on boucle sur current_charts_scales_options
            if (var_chart_scales_options && var_chart_scales_options.length > 0) {
                for (const i in this.current_charts_scales_options) {
                    const current_scale = new VarChartScalesOptionsVO().from(this.current_charts_scales_options[i]);
                    this.temp_current_scale = current_scale;

                    // On récupère le "titre" (code text) => on le translate
                    const scaleTitleCode = current_scale.get_title_name_code_text(current_scale.page_widget_id, current_scale.chart_id);
                    const scaleTitleTranslated = this.t(scaleTitleCode);

                    if (scaleTitleTranslated) {
                        scales[scaleTitleTranslated] = {
                            title: {
                                display: !!current_scale.show_scale_title,
                                text: scaleTitleTranslated !== scaleTitleCode
                                    ? scaleTitleTranslated
                                    : current_scale.scale_options.type + ' Axis'
                            },
                            grid: {
                                drawOnChartArea: Object.keys(scales).length > 0 // True => on dessine ?
                            },
                            type: current_scale.scale_options ? current_scale.scale_options.type : 'linear',
                            ticks: {
                                callback: this.get_scale_ticks_callback(current_scale),
                            },
                            axis: 'y',
                            position: current_scale.selected_position ? current_scale.selected_position : 'left',
                            fill: current_scale.fill || false,
                        };
                    }
                }
            }
            // Échelle X => scale_options_x
            if (this.widget_options.scale_options_x) {
                scales['x'] = this.widget_options.scale_options_x;
                scales['x']['title'] = {
                    display: !!this.widget_options.show_scale_x,
                    text: this.translated_scale_x_title || '',
                };
                // On check si "stacked" (si au moins un scale est stacked)
                scales['x']['stacked'] = this.widget_options.var_chart_scales_options.some((opt) => opt.stacked);
            }

            // Éventuelle échelle R
            if (this.widget_options.scale_options_r) {
                scales['r'] = this.widget_options.scale_options_r;
            }

            // Interaction (dans le cas où on a au moins une scale)
            let interaction_option = {};
            if (Object.keys(scales).length > 0) {
                interaction_option = {
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                };
            }

            // Plugins (titre, tooltip, legend, etc.)
            const obj = {
                inflateAmount: false,
                borderRadius: 0,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: this.get_bool_option('title_display', true),
                        text: this.translated_title || '',
                        color: this.widget_options.title_font_color || '#666',
                        font: {
                            size: this.widget_options.title_font_size || 16,
                        },
                        padding: this.widget_options.title_padding || 10,
                    },
                    tooltip: {
                        enabled: true,
                        axis: 'xy',
                        mode: this.widget_options.tooltip_by_index ? 'index' : 'nearest',
                    },
                    datalabels: {
                        display: false,
                    },
                    legend: {
                        display: this.get_bool_option('legend_display', true),
                        position: this.widget_options.legend_position || 'bottom',
                        labels: {
                            font: { size: this.widget_options.legend_font_size || 12 },
                            color: this.widget_options.legend_font_color || '#666',
                            boxWidth: this.widget_options.legend_box_width || 40,
                            padding: this.widget_options.legend_padding || 10,
                            usePointStyle: this.get_bool_option('legend_use_point_style', false),
                        },
                    },
                },
                tooltip: {
                    enabled: true,
                    axis: 'xy',
                    mode: this.widget_options.tooltip_by_index ? 'index' : 'nearest',
                },
                scales: scales,
                detailed: this.widget_options.detailed,
            };
            return Object.assign({}, obj, interaction_option);
        }

        // ----------------------------------------------------------------------
        // Mode "simple"
        // ----------------------------------------------------------------------
        scales['x'] = {
            display: true,
            grid: { display: false },
        };
        scales['y'] = {
            display: false,
            grid: { display: false },
        };

        if (var_chart_scales_options && var_chart_scales_options.length > 0) {
            for (const i in this.current_charts_scales_options) {
                const current_scale = new VarChartScalesOptionsVO().from(this.current_charts_scales_options[i]);
                this.temp_current_scale = current_scale;

                const scaleTitleCode = current_scale.get_title_name_code_text(current_scale.page_widget_id, current_scale.chart_id);
                const scaleTitleTranslated = this.t(scaleTitleCode);

                if (scaleTitleTranslated) {
                    scales[scaleTitleTranslated] = {
                        display: false,
                        title: { display: false },
                        grid: {
                            display: false,
                            drawOnChartArea: false
                        },
                        type: current_scale.scale_options?.type || 'linear',
                        ticks: {
                            callback: this.get_scale_ticks_callback(current_scale),
                        },
                        axis: 'y',
                        position: current_scale.selected_position || 'left',
                        fill: this.widget_options.var_charts_options.some((opt) => opt.type == 'line')
                            ? (current_scale.fill || false)
                            : false,
                    };
                }
            }
        }

        // Plugins
        const obj = {
            inflateAmount: true,
            borderRadius: 10,
            responsive: true,
            tension: this.widget_options.var_charts_options.some((opt) => opt.type == 'line') ? 0.2 : 0,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: this.get_bool_option('title_display', true),
                    text: this.translated_title || '',
                    color: this.widget_options.title_font_color || '#666',
                    font: { size: this.widget_options.title_font_size || 16 },
                    padding: this.widget_options.title_padding || 10,
                },
                tooltip: {
                    enabled: true,
                    axis: 'xy',
                    mode: this.widget_options.tooltip_by_index ? 'index' : 'nearest',
                },
                datalabels: { display: false },
                legend: {
                    display: this.get_bool_option('legend_display', true),
                    position: this.widget_options.legend_position || 'bottom',
                    labels: {
                        font: { size: this.widget_options.legend_font_size || 12 },
                        color: this.widget_options.legend_font_color || '#666',
                        boxWidth: this.widget_options.legend_box_width || 40,
                        padding: this.widget_options.legend_padding || 10,
                        usePointStyle: this.get_bool_option('legend_use_point_style', false),
                    },
                },
            },
            scales: scales,
            detailed: this.widget_options.detailed,
        };

        return obj;
    }

    // --------------------------------------------------------------------------
    //  Watchers
    // --------------------------------------------------------------------------

    /**
     * Watch sur le titre de l'axe X traduit => update des options
     */
    @Watch('translated_scale_x_title')
    private async onchange_translated_scale_x_title() {
        await this.throttled_update_visible_options();
    }


    @Watch('chart_result_nb')
    private async onchange_chart_result_nb() {

        let chart_result_txt = '';
        for (const i in this.chart_result_nb) {

            if (this.chart_result_nb[i] != this.ordered_dimension.length) {
                chart_result_txt += '- ' + i + ' : ' + this.chart_result_nb[i] + ' / ' + this.ordered_dimension.length + ' données trouvées \n';
            }
        }

        if (chart_result_txt != '') {
            this.chart_result_txt = chart_result_txt;
        } else {
            this.chart_result_txt = null;
        }
    }

    /**
     * Watchers sur la config => si un de ces éléments change, on refait la liaison
     */
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

    /**
     * Les filtres actifs changent => on met à jour
     */
    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    /**
     * Le widget_options change => on met à jour
     */
    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        await this.throttled_update_visible_options();
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    // --------------------------------------------------------------------------
    //  Hooks
    // --------------------------------------------------------------------------

    /**
     * mounted : on s'enregistre pour la validation des filtres (si un widget de validation l'exige)
     */
    private async mounted() {
        await ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page.dashboard_id,
            this.dashboard_page.id,
            this.page_widget.id,
            this.throttle_do_update_visible_options.bind(this)
        );
    }

    // --------------------------------------------------------------------------
    //  Méthodes
    // --------------------------------------------------------------------------

    /**
     * get_bool_option : évite d'avoir des checks "typeof === 'boolean'" partout
     */
    private get_bool_option(option: string, default_value: boolean): boolean {
        if (!this.widget_options) {
            return default_value;
        }
        const val = (this.widget_options as any)[option];
        return (typeof val === 'boolean') ? val : default_value;
    }

    /**
     * getlabel : renvoie le label par rapport à la structure label_by_index
     */
    private getlabel(var_param: VarDataBaseVO) {
        if (!this.label_by_index || !this.label_by_index[var_param.id]) {
            return null;
        }
        if (this.label_by_index[var_param.id].length > 1) {
            return this.label_by_index[var_param.id][0];
        }
        return this.label_by_index[var_param.id];
    }

    /**
     * Update visible options : vérifie si on a un widget "validation filtres". Si oui, on attend son signal
     */
    private async update_visible_options(force: boolean = false) {
        if (!force && this.has_widget_validation_filtres()) {
            return;
        }
        await this.throttle_do_update_visible_options();
    }

    /**
     * has_widget_validation_filtres : on check si un widget "is_validation_filters" existe
     */
    private has_widget_validation_filtres(): boolean {
        if (!this.all_page_widget) {
            return false;
        }
        for (const i in this.all_page_widget) {
            const page_w = this.all_page_widget[i];
            const widget: DashboardWidgetVO = this.widgets_by_id[page_w.widget_id];
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
     * do_update_visible_options : méthode "coeur" qui se lance après debounce
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

        // Récupération des custom filters
        const custom_filters = {};
        this.widget_options.var_charts_options?.forEach((vco) => {
            if (this.var_custom_filters && this.get_active_field_filters) {
                const cf = VarWidgetComponent.get_var_custom_filters(
                    this.var_custom_filters[vco.chart_id],
                    this.get_active_field_filters
                );
                custom_filters[vco.chart_id] = cf;
            }
        });

        // On gère le multi-dataset => remplit this.datasets
        await this.set_datasets();

        // Si has_dimension => on va construire charts_var_params_by_dimension
        if (this.widget_options.has_dimension) {
            await this.set_charts_var_params_by_dimension(custom_filters, launch_cpt);
        }
    }

    /**
     * set_datasets : si on a un multiple_dataset_vo_field_ref, on fait une requête pour récupérer la liste
     */
    private async set_datasets() {
        const res = [];

        if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
            // On query le "champ dataset"
            const q = query(this.widget_options.multiple_dataset_vo_field_ref.api_type_id)
                .set_limit(this.widget_options.max_dataset_values)
                .using(this.get_dashboard_api_type_ids)
                .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                    FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
                ));
            FieldValueFilterWidgetManager.add_discarded_field_paths(q, this.get_discarded_field_paths);

            const datasets_vos = await q.select_vos();
            for (const i in datasets_vos) {
                const dataset = datasets_vos[i];
                const dataset_label = dataset[this.widget_options.multiple_dataset_vo_field_ref.field_id];
                if (dataset_label != null) {
                    res.push(dataset_label);
                }
            }
        } else {
            // Sinon un seul dataset "NULL"
            res.push('NULL');
        }
        this.datasets = res;
    }

    /**
     * set_charts_var_params_by_dimension : calcule charts_var_params_by_dimension
     */
    private async set_charts_var_params_by_dimension(
        custom_filters: { [chart_id: string]: { [var_param_field_name: string]: ContextFilterVO } },
        launch_cpt: number
    ) {
        let charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = {};

        if (this.widget_options.dimension_is_vo_field_ref) {
            // On gère le cas "dimension sur un champ de ref"
            charts_var_params_by_dimension =
                await this.get_charts_var_params_by_dimension_when_dimension_is_vo_field_ref(custom_filters);
        } else {
            // Cas "dimension = custom filter"
            charts_var_params_by_dimension =
                await this.get_charts_var_params_by_dimension_when_dimension_is_custom_filter(custom_filters);
        }

        // Si, entre temps, un autre do_update_visible_options a été lancé
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.charts_var_params_by_dimension = charts_var_params_by_dimension;
    }

    /**
     * get_charts_var_params_by_dimension_when_dimension_is_vo_field_ref
     * => On requête la table dimension_vo_field_ref.api_type_id pour récupérer les différentes valeurs
     * => On remplit charts_var_params_by_dimension
     */
    private async get_charts_var_params_by_dimension_when_dimension_is_vo_field_ref(
        custom_filters: { [chart_id: string]: { [var_param_field_name: string]: ContextFilterVO } }
    ): Promise<{ [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } }> {

        // Vérif basique
        if (
            !this.widget_options.dimension_vo_field_ref ||
            !this.widget_options.var_charts_options?.length ||
            !this.widget_options.var_charts_options.every((vco) => !!VarsController.var_conf_by_id[vco.var_id])
        ) {
            return null;
        }

        this.isValid = true;

        // On prépare l'objet final
        const charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = {};

        // On construit une query pour récupérer les objets dimension
        const context_query = query(this.widget_options.dimension_vo_field_ref.api_type_id)
            .set_limit(this.widget_options.max_dimension_values)
            .using(this.get_dashboard_api_type_ids)
            .field(this.widget_options.dimension_vo_field_ref.field_id)
            .set_query_distinct()
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query, this.get_discarded_field_paths);

        // Tri si besoin
        if (this.widget_options.sort_dimension_by_vo_field_ref) {
            context_query.set_sort(new SortByVO(
                this.widget_options.sort_dimension_by_vo_field_ref.api_type_id,
                this.widget_options.sort_dimension_by_vo_field_ref.field_id,
                this.widget_options.sort_dimension_by_asc
            ));
        }

        const dimensions = await context_query.select_vos();
        if (!dimensions?.length) {
            this.charts_var_params_by_dimension = null;
            return;
        }

        // On prépare label_by_index
        const label_by_index: { [index: string]: string[] } = {};
        const ordered_dimension: number[] = [];
        const promises = [];

        const dimension_table = (this.widget_options.dimension_is_vo_field_ref && this.widget_options.dimension_vo_field_ref.api_type_id)
            ? ModuleTableController.module_tables_by_vo_type[this.widget_options.dimension_vo_field_ref.api_type_id]
            : null;

        let cpt_for_var = 0;

        // On boucle sur chaque dataset + var_chart_options + dimension => on calcule le param
        for (const j in this.datasets) {
            const dataset = this.datasets[j];

            for (const key in this.widget_options.var_charts_options) {
                const var_chart_options = this.widget_options.var_charts_options[key];
                const var_chart_id = var_chart_options.chart_id;
                let var_chart_id_dataset = var_chart_id + '_' + dataset;
                if (dataset == 'NULL') {
                    var_chart_id_dataset = var_chart_id.toString();
                }
                const custom_filter = custom_filters[var_chart_id];

                for (const i in dimensions) {
                    const dim_obj: any = dimensions[i];
                    let dimension_value = dim_obj[this.widget_options.dimension_vo_field_ref.field_id];
                    if (!dimension_value) {
                        dimension_value = '[NULL]';
                    }

                    // On remplit ordered_dimension
                    if (!ordered_dimension.includes(dimension_value)) {
                        ordered_dimension.push(dimension_value);
                    }

                    promises.push((async () => {
                        // Copie du filter
                        const active_field_filters = cloneDeep(this.get_active_field_filters) || {};
                        if (!active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id]) {
                            active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id] = {};
                        }

                        // Selon type "string" ou "number"
                        switch (typeof dimension_value) {
                            case 'string':
                                active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id][this.widget_options.dimension_vo_field_ref.field_id] =
                                    filter(
                                        this.widget_options.dimension_vo_field_ref.api_type_id,
                                        this.widget_options.dimension_vo_field_ref.field_id
                                    ).by_text_has(dimension_value);
                                break;
                            case 'number':
                                active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id][this.widget_options.dimension_vo_field_ref.field_id] =
                                    filter(
                                        this.widget_options.dimension_vo_field_ref.api_type_id,
                                        this.widget_options.dimension_vo_field_ref.field_id
                                    ).by_num_has([dimension_value]);
                                break;
                        }

                        if (!charts_var_params_by_dimension[var_chart_id_dataset]) {
                            charts_var_params_by_dimension[var_chart_id_dataset] = {};
                        }

                        // Si multi dataset => on ajoute un filter supplémentaire
                        if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
                            if (!active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id]) {
                                active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id] = {};
                            }
                            switch (typeof dataset) {
                                case 'string':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] =
                                        filter(
                                            this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                            this.widget_options.multiple_dataset_vo_field_ref.field_id
                                        ).by_text_has(dataset);
                                    break;
                                case 'number':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] =
                                        filter(
                                            this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                            this.widget_options.multiple_dataset_vo_field_ref.field_id
                                        ).by_num_has([dataset]);
                                    break;
                            }
                        }

                        // On calcule le VarParam
                        const dim_value = await ModuleVar.getInstance().getVarParamFromContextFilters(
                            VarsController.var_conf_by_id[var_chart_options.var_id].name,
                            active_field_filters,
                            custom_filter,
                            this.get_dashboard_api_type_ids,
                            this.get_discarded_field_paths
                        );

                        // Si pas de VarParam, c'est qu'on a pas réussi à le construire, donc sûrement que le chemin demandé est impossible
                        if (!dim_value) {
                            // dim_value = new VarDataBaseVO();
                            return;
                        }

                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value] = dim_value;
                        // On assigne un ID unique
                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value].id = cpt_for_var;

                        // On gère le label
                        let label = 'NULL';
                        if (this.widget_options.dimension_vo_field_ref.field_id && dim_obj[this.widget_options.dimension_vo_field_ref.field_id]) {
                            label = dim_obj[this.widget_options.dimension_vo_field_ref.field_id];
                        } else if (dimension_table && dimension_table.default_label_field) {
                            label = dim_obj[dimension_table.default_label_field.field_id];
                        } else if (dimension_table && dimension_table.table_label_function) {
                            label = dimension_table.table_label_function(dim_obj);
                        }

                        if (!label_by_index[cpt_for_var]) {
                            label_by_index[cpt_for_var] = [];
                        }
                        label_by_index[cpt_for_var].push(label);
                        cpt_for_var++;
                    })());
                }
            }
        }

        // On exécute toutes les promesses
        await all_promises(promises);

        this.ordered_dimension = ordered_dimension;
        this.label_by_index = label_by_index;

        return charts_var_params_by_dimension;
    }

    /**
     * get_charts_var_params_by_dimension_when_dimension_is_custom_filter
     * => dimension = custom filter (souvent date). On segmente par TimeSegment
     */
    private async get_charts_var_params_by_dimension_when_dimension_is_custom_filter(
        custom_filters: { [chart_id: string]: { [var_param_field_name: string]: ContextFilterVO } }
    ): Promise<{ [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } }> {
        if (
            !this.widget_options?.var_charts_options?.length ||
            !this.widget_options.var_charts_options.every((opt) => !!VarsController.var_conf_by_id[opt.var_id])
        ) {
            return null;
        }

        const charts_var_params_by_dimension: { [chart_id: string]: { [dimension_value: number]: VarDataBaseVO } } = {};
        this.isValid = true;

        if (!this.widget_options.dimension_custom_filter_name) {
            this.charts_var_params_by_dimension = null;
            return;
        }

        // On check si var_charts_options[x].custom_filter_names => contiennent dimension_custom_filter_name
        const found: { [chart_id: string]: boolean } = {};
        for (const i in this.widget_options.var_charts_options) {
            const var_chart_options = this.widget_options.var_charts_options[i];
            for (const j in var_chart_options.custom_filter_names) {
                if (var_chart_options.custom_filter_names[j] == this.widget_options.dimension_custom_filter_name) {
                    found[var_chart_options.chart_id] = true;
                }
            }
        }
        if (!Object.values(found).every((v) => v)) {
            this.charts_var_params_by_dimension = null;
            return;
        }

        // On récupère la liste des TS (dimension_values)
        const dimension_values: number[] = this.get_dimension_values();
        if (!dimension_values?.length) {
            this.charts_var_params_by_dimension = null;
            this.ordered_dimension = null;
            this.label_by_index = null;
            return;
        }
        this.ordered_dimension = dimension_values;

        const label_by_index: { [index: string]: string[] } = {};
        const promises = [];
        let cpt_for_var = 0;

        // On boucle dataset + var_chart_options + dimension
        for (const j in this.datasets) {
            const dataset = this.datasets[j];

            for (const key in this.widget_options.var_charts_options) {
                const var_chart_options = this.widget_options.var_charts_options[key];
                const var_chart_id = var_chart_options.chart_id;
                let var_chart_id_dataset = var_chart_id + '_' + dataset;
                if (dataset == 'NULL') {
                    var_chart_id_dataset = var_chart_id.toString();
                }
                const custom_filter = custom_filters[var_chart_id];

                for (const i in dimension_values) {
                    const dimension_value: number = dimension_values[i];

                    promises.push((async () => {
                        // Copie du filter
                        const active_field_filters = cloneDeep(this.get_active_field_filters);
                        active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name] = filter(
                            ContextFilterVO.CUSTOM_FILTERS_TYPE,
                            this.widget_options.dimension_custom_filter_name
                        ).by_date_x_ranges([
                            RangeHandler.create_single_elt_TSRange(dimension_value, this.widget_options.dimension_custom_filter_segment_type)
                        ]);

                        // On fusionne
                        let update_custom_filters = cloneDeep(custom_filter);

                        if (
                            this.get_active_field_filters &&
                            this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] &&
                            this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name]
                        ) {
                            for (const field_name in var_chart_options.custom_filter_names) {
                                const cfn = var_chart_options.custom_filter_names[field_name];
                                if (!cfn) {
                                    return;
                                }
                                if (cfn == this.widget_options.dimension_custom_filter_name) {
                                    if (!update_custom_filters) {
                                        update_custom_filters = {};
                                    }
                                    update_custom_filters[field_name] =
                                        active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name];
                                }
                            }
                        }

                        // Multi dataset => on ajoute un filter
                        if (this.widget_options.multiple_dataset_vo_field_ref?.field_id) {
                            if (!active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id]) {
                                active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id] = {};
                            }
                            switch (typeof dataset) {
                                case 'string':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] =
                                        filter(
                                            this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                            this.widget_options.multiple_dataset_vo_field_ref.field_id
                                        ).by_text_has(dataset);
                                    break;
                                case 'number':
                                    active_field_filters[this.widget_options.multiple_dataset_vo_field_ref.api_type_id][this.widget_options.multiple_dataset_vo_field_ref.field_id] =
                                        filter(
                                            this.widget_options.multiple_dataset_vo_field_ref.api_type_id,
                                            this.widget_options.multiple_dataset_vo_field_ref.field_id
                                        ).by_num_has([dataset]);
                                    break;
                            }
                        }

                        if (!charts_var_params_by_dimension[var_chart_id_dataset]) {
                            charts_var_params_by_dimension[var_chart_id_dataset] = {};
                        }

                        // Calcul du VarParam
                        charts_var_params_by_dimension[var_chart_id_dataset][dimension_value] =
                            await ModuleVar.getInstance().getVarParamFromContextFilters(
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

                        // Label
                        if (!label_by_index[cpt_for_var]) {
                            label_by_index[cpt_for_var] = [];
                        }
                        label_by_index[cpt_for_var].push(
                            Dates.format_segment(dimension_value, this.widget_options.dimension_custom_filter_segment_type)
                        );

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
     * get_dimension_values : remonte la liste des timestamps (dates) en fonction de la segmentation TimeSegment + la range filtrée
     */
    private get_dimension_values(): number[] {
        if (!this.widget_options.dimension_custom_filter_name) {
            return null;
        }
        const root_context_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE]
            ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name]
            : null;

        if (!root_context_filter) {
            // pas de filtre => impossible de déterminer
            return null;
        }

        // On récupère les ranges
        const ts_ranges = ContextFilterVOHandler.get_ts_ranges_from_context_filter_root(
            root_context_filter,
            this.widget_options.dimension_custom_filter_segment_type,
            this.widget_options.max_dimension_values,
            this.widget_options.sort_dimension_by_asc
        );

        const dimension_values: number[] = [];
        RangeHandler.foreach_ranges_sync(
            ts_ranges,
            (d: number) => {
                dimension_values.push(d);
            },
            this.widget_options.dimension_custom_filter_segment_type,
            null,
            null,
            !this.widget_options.sort_dimension_by_asc
        );

        return dimension_values;
    }

    /**
     * getLabelsForScale : callback pour afficher un label "custom" (ex: format monétaire) sur la scale
     */
    private getLabelsForScale(value, current_scale: VarChartScalesOptionsVO) {
        if (!this.temp_current_scale) {
            return value;
        }
        if (current_scale.filter_type == Filters.FILTER_TYPE_none) {
            return value;
        }

        const filter_read = current_scale.filter_type
            ? this.const_filters[current_scale.filter_type].read
            : undefined;
        const filter_additional_params = current_scale.filter_additional_params
            ? ObjectHandler.try_get_json(current_scale.filter_additional_params)
            : undefined;

        if (filter_read) {
            return filter_read.apply(this, [value, ...(filter_additional_params || [])]);
        }
        return value;
    }

    /**
     * get_scale_ticks_callback : génère la fonction callback pour la scale
     */
    private get_scale_ticks_callback(current_scale: VarChartScalesOptionsVO) {
        return (value, index, values) => {
            return this.getLabelsForScale(value, current_scale);
        };
    }

    /**
     * getLabelsForTooltip : si besoin d'un label custom dans la tooltip
     */
    private getLabelsForTooltip(context) {
        const value = context.raw;
        const axisID = context.dataset.yAxisID;
        const scale = Object.values(this.current_charts_scales_options).find((s) => {
            if (axisID == this.t(s.get_title_name_code_text(s.page_widget_id, s.chart_id))) {
                return s;
            }
        });

        if (!scale || scale.filter_type == Filters.FILTER_TYPE_none) {
            return value;
        }

        const filter_read = scale.filter_type ? this.const_filters[scale.filter_type].read : undefined;
        const filter_additional_params = scale.filter_additional_params
            ? ObjectHandler.try_get_json(scale.filter_additional_params)
            : undefined;

        if (filter_read) {
            return filter_read.apply(this, [value, ...(filter_additional_params || [])]);
        }
        return value;
    }

    /**
     * adaptColorForSimpleMode : convertit un hex (#xxxxxx) en rgba( ... ), etc.
     */
    private adaptColorForSimpleMode(color: string, chartType: string): string {
        if (!color) {
            color = this.getDefaultColor();
        }
        if (color.startsWith('#')) {
            // On convertit en "rgba(r,g,b,...)"
            let rgbaBase = this.hexToRgbA(color, false); // ex: "rgba(12,12,12,"
            // On ferme la parenthèse
            if (chartType === 'line') {
                rgbaBase += '1)'; // line => opaque
            } else {
                rgbaBase += '0.6)'; // bar => un peu transparent
            }
            return rgbaBase;
        }
        // Si c'est déjà du rgb(...) ou rgba(...), on l'adapte
        const temp_bgcol = color.split(',');
        if (chartType === 'line') {
            return temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',1)';
        } else {
            return temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',0.6)';
        }
    }

    /**
     * generateColorsForDimension : génère un tableau de couleurs (autant d'entries que la dimension "ordered_dimension")
     */
    private generateColorsForDimension(var_chart_options: VarChartOptionsVO, key: string, j: string) {
        let is_rbga = true;
        let base_color: string = '';
        const colors: string[] = [];
        const border_colors: string[] = [];

        // Cas : has_gradient + type != 'line' => on essaye de faire un dégradé
        if (var_chart_options.has_gradient && var_chart_options.type != 'line') {
            if (var_chart_options.bg_color?.startsWith('#')) {
                base_color = this.hexToRgbA(var_chart_options.bg_color, false);
                base_color = base_color.slice(0, base_color.lastIndexOf(','));
                is_rbga = true;
            } else if (var_chart_options.bg_color?.startsWith('rgb(')) {
                base_color = 'rgba(' + var_chart_options.bg_color.substring(4, var_chart_options.bg_color.length - 2);
                is_rbga = true;
            } else if (var_chart_options.bg_color?.startsWith('rgba(')) {
                base_color = var_chart_options.bg_color.slice(0, var_chart_options.bg_color.lastIndexOf(','));
                is_rbga = true;
            }

            if (!base_color) {
                base_color = 'rgba(0,0,0';
                is_rbga = true;
            }

            for (const i in this.ordered_dimension) {
                const nb = parseInt(i);
                let color = base_color;
                if (is_rbga) {
                    // On modifie l'opacité en fonction de i
                    color += ',' + (1 - (1 / this.ordered_dimension.length) * nb) + ')';
                } else {
                    // Hypothèse : on n'a jamais un code "non-rgba" dans ce bloc
                    color += Math.floor(255 * (1 - (1 / this.ordered_dimension.length) * nb)).toString(16);
                }
                colors.push(color);
            }
        } else {
            // Cas normal
            if (!var_chart_options.color_palette) {
                // Pas de palette => on garde la même couleur ou random
                let color = var_chart_options.bg_color;
                // Si multiple dataset => color random
                if ((this.datasets.length > 1) || !color) {
                    color = this.getDefaultColor();
                }
                for (const i in this.ordered_dimension) {
                    colors.push(color);
                }
            } else {
                // On pioche dans la palette
                const index_for_color: number = parseInt(key) + parseInt(j);
                let color = var_chart_options.color_palette.colors ? var_chart_options.color_palette.colors[index_for_color] : null;
                let border_color = var_chart_options.color_palette.border_colors ? var_chart_options.color_palette.border_colors[index_for_color] : null;
                if (!border_color) {
                    border_color = this.getDefaultColor();
                }
                if (!color) {
                    color = this.getDefaultColor();
                }
                if (border_color.startsWith('#')) {
                    border_color = this.hexToRgbA(border_color, true); // opaque
                }
                if (color.startsWith('#')) {
                    color = this.hexToRgbA(color, true); // opaque
                }
                colors.push(color);
                border_colors.push(border_color);
            }
        }

        // Border color = ...
        if (border_colors.length == 0) {
            border_colors.push('rgba(0, 0, 0, 0)');
        }
        return { colorArray: colors, borderColorArray: border_colors };
    }

    /**
     * adaptColorArrayForSimpleMode : si "simple" => on rend la palette plus transparente
     */
    private adaptColorArrayForSimpleMode(
        var_chart_options: VarChartOptionsVO,
        colors: string[],
        borderColor: string[]
    ) {
        for (const i in colors) {
            let c = colors[i];
            if (c.startsWith('#')) {
                c = this.hexToRgbA(c, false);
                if (var_chart_options.type === 'line') {
                    c += '1)'; // line => opaque
                    borderColor[i] = var_chart_options.border_color;
                } else {
                    c += '0.6)'; // bar => transparent
                    borderColor[i] = this.hexToRgbA(colors[i], false) + '1)';
                }
                colors[i] = c;
            } else {
                // C'est déjà rgb(...) ou rgba(...)
                const temp_bgcol = c.split(',');
                if (var_chart_options.type === 'bar' && !var_chart_options.has_gradient) {
                    c = temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',0.6)';
                    borderColor[i] = temp_bgcol[0] + ',' + temp_bgcol[1] + ',' + temp_bgcol[2] + ',1)';
                    colors[i] = c;
                } else {
                    // line => border color par défaut
                    borderColor[i] = var_chart_options.border_color;
                }
            }
        }
    }

    /**
     * hexToRgbA : convertit un hex type "#112233" en "rgba(r,g,b," (sans l'opacité si opacity_definitive=false)
     */
    private hexToRgbA(hex: string, opacity_definitive = false): string {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            const base = 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',';
            // Si on veut direct l'opacité "1)"
            if (opacity_definitive) {
                return base + '1)';
            }
            return base; // on laisse la parenthèse ouverte
        }
        throw new Error('Bad Hex');
    }

    /**
     * getDefaultColor : couleur grise en rgba( r, g, b, 1 )
     */
    private getDefaultColor() {
        const color = 'rgba(128,128,128,1)';
        return color;
    }
}
