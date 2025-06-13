import { cloneDeep, debounce } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import VarRadarChartWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VarRadarChartWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarRadarDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarRadarDataSetDescriptor';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import VarWidgetComponent from '../var_widget/VarWidgetComponent';
import Filters from '../../../../../../shared/tools/Filters';
import './VarRadarChartWidgetComponent.scss';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';

@Component({
    template: require('./VarRadarChartWidgetComponent.pug')
})
export default class VarRadarChartWidgetComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

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
    private label_by_index: { [index: string]: string[] } = null;
    private var_params_by_dataset_and_dimension: { [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } } = null;
    private var_params_1_et_2_by_dataset_and_dimension: { [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } } = null;

    private last_calculation_cpt: number = 0;

    private current_var_params_by_datasets: { [dataset_label: string]: VarDataBaseVO[] } = null;
    private current_var_dataset_descriptor = null;
    private current_options = null;


    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }

    get var_filter(): () => string {
        if (!this.widget_options) {
            return null;
        }

        if (this.widget_options.filter_type == Filters.FILTER_TYPE_none) {
            return null;
        }
        return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
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

    get options() {
        let self = this;

        return {
            responsive: true,
            maintainAspectRatio: false,
            locale: 'fr-fr',

            plugins: {
                datalabels: {
                    display: false
                },
                title: {
                    display: this.get_bool_option('title_display', true),
                    text: this.translated_title ? this.translated_title : '',
                    color: this.widget_options.title_font_color ? this.widget_options.title_font_color : '#666',
                    padding: this.widget_options.title_padding ? this.widget_options.title_padding : 10,
                    font: {
                        size: this.widget_options.title_font_size ? this.widget_options.title_font_size : 16,
                    }
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

                            if (self.var_filter_additional_params) {
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
                        font: {
                            size: self.widget_options.legend_font_size ? self.widget_options.legend_font_size : 12,
                        },
                        boxWidth: self.widget_options.legend_box_width ? self.widget_options.legend_box_width : 40,
                        padding: self.widget_options.legend_padding ? self.widget_options.legend_padding : 10,
                        usePointStyle: this.get_bool_option('legend_use_point_style', false),
                        color: self.widget_options.legend_font_color ? self.widget_options.legend_font_color : '#666',
                    },
                },
            },
            scales: {
                r: {
                    ticks: {
                        callback: this.getLabels
                    },
                }
            },

        };
    }

    get snotify() {
        return this.$snotify;
    }

    /**
     * 2 cas : soit on a 2 vars, soit on a 1 var et une dimension sur laquelle on déploie la var
     */
    get var_dataset_descriptor(): VarRadarDataSetDescriptor {

        if (!this.widget_options) {
            return null;
        }

        if (this.widget_options.has_dimension) {
            if (this.widget_options.var_id_1 && VarsController.var_conf_by_id[this.widget_options.var_id_1]) {

                // tentative de faire un dégradé automatique de couleur pour les dimensions.
                // à voir comment on peut proposer de paramétrer cette partie
                // TODO : à voir si on peut proposer de paramétrer cette partie
                let base_color = null;
                let is_rbga = false;
                let colors = [];

                if (this.widget_options.bg_color_1 && this.widget_options.bg_color_1.startsWith('#')) {
                    base_color = this.widget_options.bg_color_1;
                } else if (this.widget_options.bg_color_1 && this.widget_options.bg_color_1.startsWith('rgba(')) {
                    base_color = 'rgba' + this.widget_options.bg_color_1.substring(4, this.widget_options.bg_color_1.length - 2);
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
                        color += (1 - (1 / this.ordered_dimension.length) * nb) + ')';
                    } else {
                        color += Math.floor(255 * (1 - (1 / this.ordered_dimension.length) * nb)).toString(16);
                    }
                    colors.push(color);
                }

                return new VarRadarDataSetDescriptor(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                    this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)) != this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1) ? this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)) : '')
                    .set_backgrounds(colors)
                    .set_bordercolors([this.widget_options.border_color_1])
                    .set_borderwidths([this.widget_options.border_width_1]);
            }
            return null;
        } else {
            if (this.widget_options.var_id_1 && VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
                return new VarRadarDataSetDescriptor(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name, // ?? flou le var_name à utiliser ici
                    this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)) != this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1) ? this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)) : '')
                    .set_backgrounds([this.widget_options.bg_color_1, this.widget_options.bg_color_2])
                    .set_bordercolors([this.widget_options.border_color_1, this.widget_options.border_color_2])
                    .set_borderwidths([this.widget_options.border_width_1, this.widget_options.border_width_2]);
            }
            return null;
        }
    }

    get var_params_by_datasets(): { [dataset_label: string]: VarDataBaseVO[] } {

        if (!this.widget_options) {
            return null;
        }

        let res: { [dataset_label: string]: VarDataBaseVO[] } = {};

        if (this.widget_options.has_dimension) {
            if ((!this.var_params_by_dataset_and_dimension) || (!this.ordered_dimension) ||
                (!this.var_params_by_dataset_and_dimension[Object.keys(this.var_params_by_dataset_and_dimension)[0]] || (Object.keys(this.var_params_by_dataset_and_dimension[Object.keys(this.var_params_by_dataset_and_dimension)[0]]).length != this.ordered_dimension.length))) {
                return null;
            }

            for (const dataset_label in this.var_params_by_dataset_and_dimension) {
                const var_params_by_dimension = this.var_params_by_dataset_and_dimension[dataset_label];
                res[dataset_label] = [];

                for (const i in this.ordered_dimension) {
                    let dimension = this.ordered_dimension[i];

                    if (!var_params_by_dimension[dimension]) {
                        return null;
                    }

                    res[dataset_label].push(var_params_by_dimension[dimension]);
                }
            }
        } else {
            if ((!this.var_params_1_et_2_by_dataset_and_dimension) || (!this.ordered_dimension) ||
                (!this.var_params_1_et_2_by_dataset_and_dimension[Object.keys(this.var_params_1_et_2_by_dataset_and_dimension)[0]] || (Object.keys(this.var_params_1_et_2_by_dataset_and_dimension[Object.keys(this.var_params_1_et_2_by_dataset_and_dimension)[0]]).length != this.ordered_dimension.length))) {
                return null;
            }

            for (const dataset_label in this.var_params_1_et_2_by_dataset_and_dimension) {
                const var_params_1_et_2_by_dimension = this.var_params_1_et_2_by_dataset_and_dimension[dataset_label];
                res[dataset_label] = [];

                for (const i in this.ordered_dimension) {
                    let dimension = this.ordered_dimension[i];

                    if (!var_params_1_et_2_by_dimension[dimension]) {
                        return null;
                    }

                    res[dataset_label].push(var_params_1_et_2_by_dimension[dimension]);
                }
            }
        }

        return res;
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

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: VarRadarChartWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarRadarChartWidgetOptionsVO;
                options = options ? new VarRadarChartWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        await this.throttled_update_visible_options();
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    @Watch('options')
    @Watch('var_dataset_descriptor')
    @Watch('var_params_by_datasets')
    private async onOptionsChange() {
        if (!this.options || !this.var_dataset_descriptor || !this.var_params_by_datasets) {
            return;
        }

        this.current_options = this.options;
        this.current_var_dataset_descriptor = this.var_dataset_descriptor;
        this.current_var_params_by_datasets = this.var_params_by_datasets;
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    private get_bool_option(option: string, default_value: boolean): boolean {
        return (this.widget_options && (typeof this.widget_options[option] === 'boolean')) ? this.widget_options[option] : default_value;
    }

    private getLabels(value, context) {
        if (this.var_filter) {
            return this.var_filter.apply(this, [value].concat(this.var_filter_additional_params));
        } else {
            return value;
        }
    }

    private getlabel(var_param: VarDataBaseVO) {

        if (!this.label_by_index) {
            return null;
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
    ): Promise<{ [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } }> {

        if ((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1] || !this.widget_options.dimension_vo_field_ref) {
            return null;
        }

        let var_params_by_dataset_and_dimension: { [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } } = {};

        if (this.widget_options.dimension_vo_field_ref == null) {
            return;
        }
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

        const dimensions = await query_.select_vos(); // on query tout l'objet pour pouvoir faire les labels des dimensions si besoin .field(this.widget_options.dimension_vo_field_ref.field_id)

        if ((!dimensions) || (!dimensions.length)) {
            this.var_params_by_dataset_and_dimension = null;
            return;
        }

        const datasets = [];

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
                    datasets.push(dataset_label);
                }
            }
        } else {
            if (this.var_dataset_descriptor.label_translatable_code != '') {
                datasets.push(this.t(this.var_dataset_descriptor.label_translatable_code));
            } else {
                datasets.push('Label');
            }
        }

        const promises = [];
        const ordered_dimension: number[] = [];
        const label_by_index: { [index: string]: string[] } = {};
        const dimension_table = (this.widget_options.dimension_is_vo_field_ref && this.widget_options.dimension_vo_field_ref.api_type_id) ?
            ModuleTableController.module_tables_by_vo_type[this.widget_options.dimension_vo_field_ref.api_type_id] : null;
        let cpt_for_var: number = 0;

        for (const j in datasets) {
            const dataset = datasets[j];

            var_params_by_dataset_and_dimension[dataset] = {};

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

                    var_params_by_dataset_and_dimension[dataset][dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                        VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                        active_field_filters,
                        custom_filters_1,
                        this.get_dashboard_api_type_ids,
                        this.get_discarded_field_paths);

                    if (!var_params_by_dataset_and_dimension[dataset][dimension_value]) {
                        // Si on est sur du multi dataset, on peut avoir des datasets sans données
                        if ((dimension_value !== '[NULL]') && (datasets.length == 1)) {
                            // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
                            // this.snotify.error(this.t('var_line_chart_widget.error.no_data'));
                            ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
                            return;
                        } else {
                            var_params_by_dataset_and_dimension[dataset][dimension_value] = new VarDataBaseVO();
                        }
                    }

                    var_params_by_dataset_and_dimension[dataset][dimension_value].id = cpt_for_var;

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

                    if (label_by_index[cpt_for_var].indexOf(label) < 0) {
                        label_by_index[cpt_for_var].push(label);
                    }

                    cpt_for_var++;
                })());
            }
        }

        await all_promises(promises);

        this.ordered_dimension = ordered_dimension;
        this.label_by_index = label_by_index;

        return var_params_by_dataset_and_dimension;
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
    ): Promise<{ [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } }> {

        if ((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
            return null;
        }

        let var_params_by_dataset_and_dimension: { [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } } = {};

        /**
         * Sinon on se base sur la liste des valeurs possibles pour la dimension segmentée
         */
        if (!this.widget_options.dimension_custom_filter_name) {
            this.var_params_by_dataset_and_dimension = null;
            return;
        }

        if (!this.widget_options.filter_custom_field_filters_1) {
            this.var_params_by_dataset_and_dimension = null;
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
            this.var_params_by_dataset_and_dimension = null;
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
            this.var_params_by_dataset_and_dimension = null;
            this.ordered_dimension = null;
            this.label_by_index = null;
            return;
        }

        const datasets = [];

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
                    datasets.push(dataset_label);
                }
            }
        } else {
            if (this.var_dataset_descriptor.label_translatable_code != '') {
                datasets.push(this.t(this.var_dataset_descriptor.label_translatable_code));
            } else {
                datasets.push('Label');
            }
        }

        this.ordered_dimension = dimension_values;

        const promises = [];
        const label_by_index: { [index: string]: string[] } = {};
        let cpt_for_var: number = 0;

        for (const j in datasets) {
            const dataset = datasets[j];

            var_params_by_dataset_and_dimension[dataset] = {};
            for (const i in dimension_values) {
                const dimension_value: number = dimension_values[i];

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

                    var_params_by_dataset_and_dimension[dataset][dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                        VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                        active_field_filters,
                        update_custom_filters_1,
                        this.get_dashboard_api_type_ids,
                        this.get_discarded_field_paths);

                    if (!var_params_by_dataset_and_dimension[dataset][dimension_value]) {
                        // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
                        ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
                        return;
                    }
                    var_params_by_dataset_and_dimension[dataset][dimension_value].id = cpt_for_var;
                    if (label_by_index[cpt_for_var] === undefined) {
                        label_by_index[cpt_for_var] = [];
                    }
                    label_by_index[cpt_for_var].push(Dates.format_segment(dimension_value, this.widget_options.dimension_custom_filter_segment_type));

                    cpt_for_var++;
                })());
            }
        }

        await all_promises(promises);

        this.label_by_index = label_by_index;

        return var_params_by_dataset_and_dimension;
    }

    /**
     *  A voir si c'est la bonne méthode pas évident.
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
            this.var_params_1_et_2_by_dataset_and_dimension = null;
            this.var_params_by_dataset_and_dimension = null;
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
        if (this.var_params_1_et_2_by_dataset_and_dimension) {
            this.var_params_1_et_2_by_dataset_and_dimension = null;
        }

        let var_params_by_dataset_and_dimension: { [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } } = {};
        if (!!this.widget_options.dimension_is_vo_field_ref) {
            var_params_by_dataset_and_dimension = await this.get_var_params_by_dimension_when_dimension_is_vo_field_ref(custom_filters_1);
        } else {
            var_params_by_dataset_and_dimension = await this.get_var_params_by_dimension_when_dimension_is_custom_filter(custom_filters_1);
        }

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.var_params_by_dataset_and_dimension = var_params_by_dataset_and_dimension;
    }

    private async set_var_params_1_et_2(
        custom_filters_1: { [var_param_field_name: string]: ContextFilterVO },
        launch_cpt: number
    ) {

        if (((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) ||
            ((!this.widget_options.var_id_2) || !VarsController.var_conf_by_id[this.widget_options.var_id_2])) {
            this.var_params_by_dataset_and_dimension = null;
            this.var_params_1_et_2_by_dataset_and_dimension = null;
            return null;
        }

        if (this.var_params_by_dataset_and_dimension) {
            this.var_params_by_dataset_and_dimension = null;
        }

        const custom_filters_2: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters_2, this.get_active_field_filters);
        const var_params_1_et_2_by_dataset_and_dimension: { [dataset_label: string]: { [dimension_value: number]: VarDataBaseVO } } = {};
        const promises = [];
        const datasets = [];

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
                    datasets.push(dataset_label);
                }
            }
        } else {
            if (this.var_dataset_descriptor.label_translatable_code != '') {
                datasets.push(this.t(this.var_dataset_descriptor.label_translatable_code));
            } else {
                datasets.push('Label');
            }
        }

        for (const i in datasets) {
            const dataset = datasets[i];

            var_params_1_et_2_by_dataset_and_dimension[dataset] = {};

            /**
             * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
             */
            let active_field_filters = cloneDeep(this.get_active_field_filters);

            if (!active_field_filters) {
                active_field_filters = {};
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

            promises.push((async () => {
                var_params_1_et_2_by_dataset_and_dimension[dataset][0] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
                    active_field_filters,
                    custom_filters_1,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths);
            })());
            promises.push((async () => {
                var_params_1_et_2_by_dataset_and_dimension[dataset][1] = await ModuleVar.getInstance().getVarParamFromContextFilters(
                    VarsController.var_conf_by_id[this.widget_options.var_id_2].name,
                    active_field_filters,
                    custom_filters_2,
                    this.get_dashboard_api_type_ids,
                    this.get_discarded_field_paths);
            })());
        }

        await all_promises(promises);

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
            return;
        }

        this.ordered_dimension = [0, 1];
        this.label_by_index = {
            0: [this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1))],
            1: [this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_2))]
        };

        this.var_params_1_et_2_by_dataset_and_dimension = var_params_1_et_2_by_dataset_and_dimension;
    }
}