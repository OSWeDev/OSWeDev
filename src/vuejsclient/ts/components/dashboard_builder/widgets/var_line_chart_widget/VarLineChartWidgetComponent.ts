import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import VarPieChartWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarLineDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarLineDataSetDescriptor';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
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
import './VarLineChartWidgetComponent.scss';

@Component({
    template: require('./VarLineChartWidgetComponent.pug')
})
export default class VarLineChartWidgetComponent extends VueComponentBase {

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

    private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
    private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

    private ordered_dimension: number[] = null;
    private label_by_index: { [index: string]: string } = null;
    private var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = null;
    private var_params_1_et_2: { [dimension_value: number]: VarDataBaseVO } = null;

    private last_calculation_cpt: number = 0;

    private current_var_params = null;
    private current_var_dataset_descriptor = null;
    private current_options = null;

    @Watch('options')
    @Watch('var_dataset_descriptor')
    @Watch('var_params')
    private async onOptionsChange() {
        if (!this.options || !this.var_dataset_descriptor || !this.var_params) {
            return;
        }

        this.current_options = this.options;
        this.current_var_dataset_descriptor = this.var_dataset_descriptor;
        this.current_var_params = this.var_params;
    }

    get var_filter(): () => string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
    }

    get var_filter_additional_params(): [] {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.filter_additional_params ? JSON.parse(this.widget_options.filter_additional_params) : undefined;
    }

    get translated_title(): string {

        if (!this.widget_options) {
            return null;
        }
        return this.t(this.widget_options.get_title_name_code_text(this.page_widget.id));
    }

    private get_bool_option(option: string, default_value: boolean): boolean {
        return (this.widget_options && (typeof this.widget_options[option] === 'boolean')) ? this.widget_options[option] : default_value;
    }

    get options() {
        let self = this;
        return {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                title: {
                    display: this.get_bool_option('title_display', true),
                    text: this.translated_title ? this.translated_title : '',
                    fontColor: this.widget_options.title_font_color ? this.widget_options.title_font_color : '#666',
                    fontSize: this.widget_options.title_font_size ? this.widget_options.title_font_size : 16,
                    padding: this.widget_options.title_padding ? this.widget_options.title_padding : 10,
                },

                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            let label = data.labels[tooltipItem.index] || '';

                            if (label) {
                                label += ': ';
                            }

                            if (!self.var_filter) {
                                return label + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            }

                            let params = [data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]];

                            if (!!self.var_filter_additional_params) {
                                params = params.concat(self.var_filter_additional_params);
                            }

                            return label + self.var_filter.apply(null, params);
                        }
                    }
                },

                legend: {
                    display: this.get_bool_option('legend_display', true),
                    position: self.widget_options.legend_position ? self.widget_options.legend_position : 'bottom',

                    labels: {
                        fontColor: self.widget_options.legend_font_color ? self.widget_options.legend_font_color : '#666',
                        fontSize: self.widget_options.legend_font_size ? self.widget_options.legend_font_size : 12,
                        boxWidth: self.widget_options.legend_box_width ? self.widget_options.legend_box_width : 40,
                        padding: self.widget_options.legend_padding ? self.widget_options.legend_padding : 10,
                        usePointStyle: this.get_bool_option('legend_use_point_style', false)
                    },
                },
            },

            cutout: (self.widget_options.cutout_percentage == null) ? "50%" : self.widget_options.cutout_percentage.toString() + '%',
            rotation: (self.widget_options.rotation == null) ? 270 : self.widget_options.rotation,
            circumference: (self.widget_options.circumference == null) ? 180 : self.widget_options.circumference,
        };
    }

    private getlabel(var_param: VarDataBaseVO) {

        if (!this.label_by_index) {
            return null;
        }
        return this.label_by_index[var_param.index];
    }

    /**
     * 2 cas : soit on a 2 vars, soit on a 1 var et une dimension sur laquelle on déploie la var
     */
    get var_dataset_descriptor(): VarLineDataSetDescriptor {

        if (!this.widget_options) {
            return null;
        }

        if (this.widget_options.has_dimension) {
            if (this.widget_options.var_id_1 && VarsController.var_conf_by_id[this.widget_options.var_id_1]) {

                // tentative de faire un dégradé automatique de couleur pour les dimensions.
                // à voir comment on peut proposer de paramétrer cette partie
                let base_color = null;
                let is_rbga = false;
                let colors = [];

                if (this.widget_options.bg_color_1 && this.widget_options.bg_color_1.startsWith('#')) {
                    base_color = this.widget_options.bg_color_1;
                } else if (this.widget_options.bg_color_1 && this.widget_options.bg_color_1.startsWith('rgb(')) {
                    base_color = 'rgba(' + this.widget_options.bg_color_1.substring(4, this.widget_options.bg_color_1.length - 2);
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

                return new VarLineDataSetDescriptor(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                    this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)))
                    .set_backgrounds(colors)
                    .set_bordercolors([this.widget_options.border_color_1])
                    .set_borderwidths([this.widget_options.border_width_1]);
            }
            return null;
        } else {
            if (this.widget_options.var_id_1 && VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
                return new VarLineDataSetDescriptor(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name, // ?? flou le var_name à utiliser ici
                    this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1))) // ?? flou le label à utiliser ici
                    .set_backgrounds([this.widget_options.bg_color_1, this.widget_options.bg_color_2])
                    .set_bordercolors([this.widget_options.border_color_1, this.widget_options.border_color_2])
                    .set_borderwidths([this.widget_options.border_width_1, this.widget_options.border_width_2]);
            }
            return null;
        }
    }

    get var_params(): VarDataBaseVO[] {

        if (!this.widget_options) {
            return null;
        }

        let res: VarDataBaseVO[] = [];
        if (this.widget_options.has_dimension) {
            if ((!this.var_params_by_dimension) || (!this.ordered_dimension) ||
                (Object.keys(this.var_params_by_dimension).length != this.ordered_dimension.length)) {
                return null;
            }

            for (let i in this.ordered_dimension) {
                let dimension = this.ordered_dimension[i];

                if (!this.var_params_by_dimension[dimension]) {
                    return null;
                }

                res.push(this.var_params_by_dimension[dimension]);
            }
            return res;
        } else {
            if ((!this.var_params_1_et_2) || (!this.ordered_dimension) ||
                (Object.keys(this.var_params_1_et_2).length != this.ordered_dimension.length)) {
                return null;
            }

            for (let i in this.ordered_dimension) {
                let dimension = this.ordered_dimension[i];

                if (!this.var_params_1_et_2[dimension]) {
                    return null;
                }

                res.push(this.var_params_1_et_2[dimension]);
            }
            return res;
        }
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    get var_custom_filters_1(): { [var_param_field_name: string]: string } {
        if (!this.widget_options) {
            return null;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters_1) ? this.widget_options.filter_custom_field_filters_1 : null;
    }

    get var_custom_filters_2(): { [var_param_field_name: string]: string } {
        if (!this.widget_options) {
            return null;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters_2) ? this.widget_options.filter_custom_field_filters_2 : null;
    }

    private async update_visible_options(force: boolean = false) {

        // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
        if ((!force) && this.has_widget_validation_filtres()) {
            return;
        }


        await this.throttle_do_update_visible_options();
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    private has_widget_validation_filtres(): boolean {

        if (!this.all_page_widget) {
            return false;
        }

        for (let i in this.all_page_widget) {
            let widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

            if (!widget) {
                continue;
            }

            if (widget.is_validation_filters) {
                return true;
            }
        }

        return false;
    }

    private async mounted() {
        await ValidationFiltersWidgetController.getInstance().register_updater(
            this.dashboard_page.dashboard_id,
            this.dashboard_page.id,
            this.page_widget.id,
            this.throttle_do_update_visible_options.bind(this),
        );
    }

    private async get_var_params_by_dimension_when_dimension_is_vo_field_ref(
        custom_filters_1: { [var_param_field_name: string]: ContextFilterVO }
    ): Promise<{ [dimension_value: number]: VarDataBaseVO }> {

        if ((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
            return null;
        }

        let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};

        /**
         * Si la dimension est un champ de référence, on va chercher les valeurs possibles du champs en fonction des filtres actifs
         */
        let query_: ContextQueryVO = query(this.widget_options.dimension_vo_field_ref.api_type_id)
            .set_limit(this.widget_options.max_dimension_values)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(query_, this.get_discarded_field_paths);

        if (this.widget_options.sort_dimension_by_vo_field_ref) {
            query_.set_sort(new SortByVO(
                this.widget_options.sort_dimension_by_vo_field_ref.api_type_id,
                this.widget_options.sort_dimension_by_vo_field_ref.field_id,
                this.widget_options.sort_dimension_by_asc
            ));
        }

        let dimensions = await query_.select_vos(); // on query tout l'objet pour pouvoir faire les labels des dimensions si besoin .field(this.widget_options.dimension_vo_field_ref.field_id)

        if ((!dimensions) || (!dimensions.length)) {
            this.var_params_by_dimension = null;
            return;
        }

        let promises = [];
        let ordered_dimension: number[] = [];
        let label_by_index: { [index: string]: string } = {};
        let dimension_table = (this.widget_options.dimension_is_vo_field_ref && this.widget_options.dimension_vo_field_ref.api_type_id) ?
            VOsTypesManager.moduleTables_by_voType[this.widget_options.dimension_vo_field_ref.api_type_id] : null;
        for (let i in dimensions) {
            let dimension: any = dimensions[i];
            let dimension_value: number = dimension[this.widget_options.dimension_vo_field_ref.field_id];

            ordered_dimension.push(dimension_value);

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

                active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id][this.widget_options.dimension_vo_field_ref.field_id] = filter(
                    this.widget_options.dimension_vo_field_ref.api_type_id, this.widget_options.dimension_vo_field_ref.field_id
                ).by_num_has([dimension_value]);

                var_params_by_dimension[dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                    active_field_filters,
                    custom_filters_1,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths);

                if (!var_params_by_dimension[dimension_value]) {
                    // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
                    ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
                    return;
                }

                let label = null;

                if (dimension_table && dimension_table.default_label_field) {
                    label = dimension[dimension_table.default_label_field.field_id];
                } else if (dimension_table && dimension_table.table_label_function) {
                    label = dimension_table.table_label_function(dimension);
                }

                label_by_index[var_params_by_dimension[dimension_value].index] = label;

            })());
        }
        await all_promises(promises);

        this.ordered_dimension = ordered_dimension;
        this.label_by_index = label_by_index;
        return var_params_by_dimension;
    }

    /**
     * When dimension is a custom filter, we need to get the var params for each dimension value
     *  - The custom filter is must likely a date filter
     *
     * @param {{ [var_param_field_name: string]: ContextFilterVO }} custom_filters_1
     * @returns {Promise<{[dimension_value: number]: VarDataBaseVO}>}
     */
    private async get_var_params_by_dimension_when_dimension_is_custom_filter(
        custom_filters_1: { [var_param_field_name: string]: ContextFilterVO }
    ): Promise<{ [dimension_value: number]: VarDataBaseVO }> {

        if ((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
            return null;
        }

        let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};

        /**
         * Sinon on se base sur la liste des valeurs possibles pour la dimension segmentée
         */
        if (!this.widget_options.dimension_custom_filter_name) {
            this.var_params_by_dimension = null;
            return;
        }

        if (!this.widget_options.filter_custom_field_filters_1) {
            this.var_params_by_dimension = null;
            return;
        }

        /**
         * On checke qu'on a bien une dimension de la var dont la correspondance en filtrage spécifique est le filtre de dimension
         */
        let found: boolean = false;
        for (let field_id in this.widget_options.filter_custom_field_filters_1) {
            let custom_filter_1 = this.widget_options.filter_custom_field_filters_1[field_id];

            if (custom_filter_1 == this.widget_options.dimension_custom_filter_name) {
                found = true;
                break;
            }
        }

        if (!found) {
            this.var_params_by_dimension = null;
            return;
        }

        /**
         * On défini ensuite la liste des valeurs possibles pour la dimension
         *  on est sur des dates, donc on cherche à savoir les dates valides suivant les filtrages actuels (les ranges valides)
         *  puis on itère sur ces ranges en fonction de la segmentation sélectionnée
         *  en limitant au nombre max de valeurs de dimension
         */
        let dimension_values: number[] = this.get_dimension_values();

        if ((!dimension_values) || (!dimension_values.length)) {
            this.var_params_by_dimension = null;
            this.ordered_dimension = null;
            this.label_by_index = null;
            return;
        }

        this.ordered_dimension = dimension_values;

        let promises = [];
        let label_by_index: { [index: string]: string } = {};
        for (let i in dimension_values) {
            let dimension_value: number = dimension_values[i];

            promises.push((async () => {

                /**
                 * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
                 */
                let active_field_filters = cloneDeep(this.get_active_field_filters);
                active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name] = filter(
                    ContextFilterVO.CUSTOM_FILTERS_TYPE,
                    this.widget_options.dimension_custom_filter_name
                ).by_date_x_ranges([RangeHandler.create_single_elt_TSRange(dimension_value, this.widget_options.dimension_custom_filter_segment_type)]);

                let update_custom_filters_1 = cloneDeep(custom_filters_1);
                if (this.get_active_field_filters && this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] &&
                    this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name]) {

                    for (let field_name in this.widget_options.filter_custom_field_filters_1) {

                        let custom_filter_name = this.widget_options.filter_custom_field_filters_1[field_name];
                        if (custom_filter_name == this.widget_options.dimension_custom_filter_name) {
                            if (!update_custom_filters_1) {
                                update_custom_filters_1 = {};
                            }
                            update_custom_filters_1[field_name] = active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name];
                        }
                    }
                }

                var_params_by_dimension[dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                    active_field_filters,
                    update_custom_filters_1,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths);

                if (!var_params_by_dimension[dimension_value]) {
                    // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
                    ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
                    return;
                }

                label_by_index[var_params_by_dimension[dimension_value].index] = Dates.format_segment(dimension_value, this.widget_options.dimension_custom_filter_segment_type);
            })());
        }

        await all_promises(promises);

        this.label_by_index = label_by_index;
        return var_params_by_dimension;
    }

    /**
     * A voir si c'est la bonne méthode pas évident.
     *  Pour le moment on prend les filtres potentiels en diminuant la granularité petit à petit
     *  on est sur du custom filter
     * @returns
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

        let ts_ranges = ContextFilterVOHandler.get_ts_ranges_from_context_filter_root(
            root_context_filter,
            this.widget_options.dimension_custom_filter_segment_type,
            this.widget_options.max_dimension_values,
            this.widget_options.sort_dimension_by_asc
        );

        let dimension_values: number[] = [];
        RangeHandler.foreach_ranges_sync(ts_ranges, (d: number) => {
            dimension_values.push(d);
        }, this.widget_options.dimension_custom_filter_segment_type, null, null, !this.widget_options.sort_dimension_by_asc);

        return dimension_values;
    }

    private async do_update_visible_options() {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if (!this.widget_options) {
            this.ordered_dimension = null;
            this.label_by_index = null;
            this.var_params_1_et_2 = null;
            this.var_params_by_dimension = null;
            return;
        }

        let custom_filters_1: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters_1, this.get_active_field_filters);
        if (this.widget_options.has_dimension) {
            await this.set_var_params_by_dimension(custom_filters_1, launch_cpt);
        } else {
            await this.set_var_params_1_et_2(custom_filters_1, launch_cpt);
        }
    }

    private async set_var_params_by_dimension(
        custom_filters_1: { [var_param_field_name: string]: ContextFilterVO },
        launch_cpt: number
    ) {
        if (this.var_params_1_et_2) {
            this.var_params_1_et_2 = null;
        }

        let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};
        if (!!this.widget_options.dimension_is_vo_field_ref) {
            var_params_by_dimension = await this.get_var_params_by_dimension_when_dimension_is_vo_field_ref(custom_filters_1);
        } else {
            var_params_by_dimension = await this.get_var_params_by_dimension_when_dimension_is_custom_filter(custom_filters_1);
        }

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.var_params_by_dimension = var_params_by_dimension;
    }

    private async set_var_params_1_et_2(
        custom_filters_1: { [var_param_field_name: string]: ContextFilterVO },
        launch_cpt: number
    ) {

        if (((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) ||
            ((!this.widget_options.var_id_2) || !VarsController.var_conf_by_id[this.widget_options.var_id_2])) {
            this.var_params_by_dimension = null;
            this.var_params_1_et_2 = null;
            return null;
        }

        if (this.var_params_by_dimension) {
            this.var_params_by_dimension = null;
        }

        let custom_filters_2: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters_2, this.get_active_field_filters);

        let promises = [];
        let var_1 = null;
        let var_2 = null;
        promises.push((async () => {
            var_1 = await ModuleVar.getInstance().getVarParamFromContextFilters(
                VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                this.get_active_field_filters,
                custom_filters_1,
                this.get_dashboard_api_type_ids,
                this.get_discarded_field_paths);
        })());
        promises.push((async () => {
            var_2 = await ModuleVar.getInstance().getVarParamFromContextFilters(
                VarsController.var_conf_by_id[this.widget_options.var_id_2].name,
                this.get_active_field_filters,
                custom_filters_2,
                this.get_dashboard_api_type_ids,
                this.get_discarded_field_paths);
        })());

        await all_promises(promises);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }
        if (!var_1 || !var_2) {
            this.var_params_by_dimension = null;
            this.var_params_1_et_2 = null;
            return null;
        }

        this.ordered_dimension = [0, 1];
        this.label_by_index = {
            0: this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)),
            1: this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_2))
        };
        this.var_params_1_et_2 = {
            0: var_1,
            1: var_2
        };
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {

        await this.throttled_update_visible_options();
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: VarPieChartWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarPieChartWidgetOptionsVO;
                options = options ? new VarPieChartWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}