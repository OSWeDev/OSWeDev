// import { cloneDeep, debounce } from 'lodash';
// import Component from 'vue-class-component';
// import { Prop, Watch } from 'vue-property-decorator';
// import ContextFilterVOHandler from '../../../../../../shared/modules/ContextFilter/handler/ContextFilterVOHandler';
// import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
// import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
// import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
// import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
// import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
// import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
// import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
// import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
// import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
// import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
// import VarPieDataSetDescriptor from '../../../../../../shared/modules/Var/graph/VarPieDataSetDescriptor';
// import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
// import VarsController from '../../../../../../shared/modules/Var/VarsController';
// import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
// import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
// import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
// import ObjectHandler from '../../../../../../shared/tools/ObjectHandler';
// import { all_promises } from '../../../../../../shared/tools/PromiseTools';
// import RangeHandler from '../../../../../../shared/tools/RangeHandler';
// import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
// import VueComponentBase from '../../../VueComponentBase';
// import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
// import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
// import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
// import VarWidgetComponent from '../var_widget/VarWidgetComponent';
// import VarBarLineChartWidgetOptions from './options/VarBarLineChartWidgetOptions';
// import './VarBarLineChartWidgetComponent.scss';

// @Component({
//     template: require('./VarBarLineChartWidgetComponent.pug'),
// })
// export default class VarBarLineChartWidgetComponent extends VueComponentBase {

//     @ModuleDashboardPageGetter
//     private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

//     @ModuleDashboardPageGetter
//     private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

//     @ModuleTranslatableTextGetter
//     private get_flat_locale_translations: { [code_text: string]: string };

//     @ModuleDashboardPageGetter
//     private get_custom_filters: string[];

//     @Prop({ default: null })
//     private all_page_widget: DashboardPageWidgetVO[];

//     @Prop({ default: null })
//     private page_widget: DashboardPageWidgetVO;

//     @Prop({ default: null })
//     private dashboard: DashboardVO;

//     @Prop({ default: null })
//     private dashboard_page: DashboardPageVO;

//     private throttled_update_visible_options = debounce(this.update_visible_options.bind(this), 500);
//     private throttle_do_update_visible_options = debounce(this.do_update_visible_options.bind(this), 500);

//     private ordered_dimension: number[] = null;
//     private label_by_index: { [index: string]: string } = null;
//     private var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = null;
//     private var_params_1_et_2: { [dimension_value: number]: VarDataBaseVO } = null;

//     private last_calculation_cpt: number = 0;

//     get var_filter(): () => string {
//         if (!this.widget_options) {
//             return null;
//         }

//         return this.widget_options.filter_type ? this.const_filters[this.widget_options.filter_type].read : undefined;
//     }

//     get var_filter_additional_params(): [] {
//         if (!this.widget_options) {
//             return null;
//         }

//         return this.widget_options.filter_additional_params ? JSON.parse(this.widget_options.filter_additional_params) : undefined;
//     }

//     get translated_title(): string {

//         if (!this.widget_options) {
//             return null;
//         }
//         return this.t(this.widget_options.get_title_name_code_text(this.page_widget.id));
//     }

//     get options() {
//         let self = this;
//         return {
//             responsive: true,
//             maintainAspectRatio: false,
//             tooltips: {
//                 callbacks: {
//                     label: function (tooltipItem, data) {
//                         var label = data.datasets[tooltipItem.datasetIndex].label || '';

//                         if (label) {
//                             label += ': ';
//                         }
//                         label += self.const_filters.amount.read(tooltipItem.yLabel);
//                         return label;
//                     }
//                 }
//             },
//             legend: {
//                 position: 'bottom',
//                 labels: {
//                     fontColor: '#002454',
//                 }
//             },
//             scales: {
//                 xAxes: [{
//                     ticks: {
//                         autoSkip: false
//                     },
//                     scaleLabel: {
//                         display: true,
//                         fontColor: '#002454',
//                     },
//                     gridLines: {
//                         display: false,
//                     }
//                 }],
//                 yAxes: [{
//                     id: 'y-axe',
//                     position: 'left',
//                     scaleLabel: {
//                         display: true,
//                         fontColor: '#002454',
//                     },
//                     ticks: {
//                         callback: function (value, index, values) {
//                             return self.const_filters.amount.read(value);
//                         }
//                     },
//                     gridLines: {
//                         display: false,
//                     }
//                 }]
//             }
//         };
//     }

//     get options() {
//         let self = this;
//         return {
//             responsive: true,
//             maintainAspectRatio: false,

//             title: {
//                 display: self.widget_options.title_display ? self.widget_options.title_display : true,
//                 text: self.translated_title ? self.translated_title : '',
//                 fontColor: self.widget_options.title_font_color ? self.widget_options.title_font_color : '#666',
//                 fontSize: self.widget_options.title_font_size ? self.widget_options.title_font_size : 16,
//                 padding: self.widget_options.title_padding ? self.widget_options.title_padding : 10,
//             },

//             tooltips: {
//                 callbacks: {
//                     label: function (tooltipItem, data) {
//                         let label = data.labels[tooltipItem.index] || '';

//                         if (label) {
//                             label += ': ';
//                         }

//                         if (!self.var_filter) {
//                             return label + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
//                         }

//                         let params = [data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]];

//                         if (!!self.var_filter_additional_params) {
//                             params = params.concat(self.var_filter_additional_params);
//                         }

//                         return label + self.var_filter.apply(null, params);
//                     }
//                 }
//             },

//             legend: {
//                 display: self.widget_options.legend_display ? self.widget_options.legend_display : true,
//                 position: self.widget_options.legend_position ? self.widget_options.legend_position : 'bottom',

//                 labels: {
//                     fontColor: self.widget_options.legend_font_color ? self.widget_options.legend_font_color : '#666',
//                     fontSize: self.widget_options.legend_font_size ? self.widget_options.legend_font_size : 12,
//                     boxWidth: self.widget_options.legend_box_width ? self.widget_options.legend_box_width : 40,
//                     padding: self.widget_options.legend_padding ? self.widget_options.legend_padding : 10,
//                     usePointStyle: self.widget_options.legend_use_point_style ? self.widget_options.legend_use_point_style : false
//                 },
//             },

//             cutoutPercentage: (self.widget_options.cutout_percentage == null) ? "50%" : self.widget_options.cutout_percentage,
//             rotation: (self.widget_options.rotation == null) ? 270 : self.widget_options.rotation,
//             circumference: (self.widget_options.circumference == null) ? 180 : self.widget_options.circumference
//         };
//     }

//     get var_dataset_descriptors(): VarsBarDataSetDescriptor[] {
//         return [
//             new VarsBarDataSetDescriptor(
//                 (this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME),
//                 'crescendo_ca_pr_graph.var_dataset_descriptors.VarDayCAHTRealiseController_AM1.label_translatable_code',
//                 'y-axe',
//                 this.var_params_by_label_by_descriptor[(this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME) + 'am1'],
//                 null,
//                 this.math_round
//             ).set_bg_color('#888'),
//             new VarsBarDataSetDescriptor(
//                 (this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME),
//                 'crescendo_ca_pr_graph.var_dataset_descriptors.VarDayCAHTRealiseController.label_translatable_code',
//                 'y-axe',
//                 this.var_params_by_label_by_descriptor[(this.get_has_filter_code_ccs ? VarsNamesHolder.VarDayCAHTRealiseCCSController_VAR_NAME : VarsNamesHolder.VarDayCAHTRealiseController_VAR_NAME)],
//                 null,
//                 this.math_round
//             ).set_bg_color('#002454')];
//     }

//     get labels(): string[] {

//         if (!this.ordered_dimension) {
//             return [];
//         }

//         if (!this.label_by_index) {
//             return [];
//         }

//         if (!this.var_params_by_dimension) {
//             return [];
//         }

//         let res: string[] = [];

//         for (let i in this.ordered_dimension) {
//             let dimension = this.ordered_dimension[i];
//             let var_param: VarDataBaseVO = this.var_params_by_dimension[dimension];

//             if (!var_param) {
//                 continue;
//             }

//             res.push(this.label_by_index[var_param.index]);
//         }
//         return res;
//     }

//     /**
//      * 2 cas : soit on a 2 vars, soit on a 1 var et une dimension sur laquelle on déploie la var
//      */
//     get var_dataset_descriptor(): VarPieDataSetDescriptor {

//         if (!this.widget_options) {
//             return null;
//         }

//         if (this.widget_options.has_dimension) {
//             if (this.widget_options.var_id_1 && VarsController.var_conf_by_id[this.widget_options.var_id_1]) {

//                 // tentative de faire un dégradé automatique de couleur pour les dimensions.
//                 // à voir comment on peut proposer de paramétrer cette partie
//                 let colors = [];
//                 let base_color = '';
//                 let is_rbga = false;
//                 if (this.widget_options.bg_color_1.startsWith('#')) {
//                     base_color = this.widget_options.bg_color_1;
//                 } else if (this.widget_options.bg_color_1.startsWith('rgb(')) {
//                     base_color = 'rgba(' + this.widget_options.bg_color_1.substring(4, this.widget_options.bg_color_1.length - 2);
//                     is_rbga = true;
//                 }

//                 for (let i in this.ordered_dimension) {
//                     let nb = parseInt(i);
//                     let color = base_color;
//                     if (is_rbga) {
//                         color += ',' + Math.floor(1 - (1 / this.ordered_dimension.length) * nb) + ')';
//                     } else {
//                         color += Math.floor(255 * (1 - (1 / this.ordered_dimension.length) * nb)).toString(16);
//                     }
//                     colors.push(color);
//                 }

//                 return new VarPieDataSetDescriptor(
//                     VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
//                     this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)))
//                     .set_backgrounds(colors)
//                     .set_bordercolors([this.widget_options.border_color_1])
//                     .set_borderwidths([this.widget_options.border_width_1]);
//             }
//             return null;
//         } else {
//             if (this.widget_options.var_id_1 && VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
//                 return new VarPieDataSetDescriptor(
//                     VarsController.var_conf_by_id[this.widget_options.var_id_1].name, // ?? flou le var_name à utiliser ici
//                     this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1))) // ?? flou le label à utiliser ici
//                     .set_backgrounds([this.widget_options.bg_color_1, this.widget_options.bg_color_2])
//                     .set_bordercolors([this.widget_options.border_color_1, this.widget_options.border_color_2])
//                     .set_borderwidths([this.widget_options.border_width_1, this.widget_options.border_width_2]);
//             }
//             return null;
//         }
//     }

//     get var_params(): VarDataBaseVO[] {

//         if (!this.widget_options) {
//             return null;
//         }

//         let res: VarDataBaseVO[] = [];
//         if (this.widget_options.has_dimension) {
//             if ((!this.var_params_by_dimension) || (!this.ordered_dimension) ||
//                 (Object.keys(this.var_params_by_dimension).length != this.ordered_dimension.length)) {
//                 return null;
//             }

//             for (let i in this.ordered_dimension) {
//                 let dimension = this.ordered_dimension[i];

//                 if (!this.var_params_by_dimension[dimension]) {
//                     return null;
//                 }

//                 res.push(this.var_params_by_dimension[dimension]);
//             }
//             return res;
//         } else {
//             if ((!this.var_params_1_et_2) || (!this.ordered_dimension) ||
//                 (Object.keys(this.var_params_1_et_2).length != this.ordered_dimension.length)) {
//                 return null;
//             }

//             for (let i in this.ordered_dimension) {
//                 let dimension = this.ordered_dimension[i];

//                 if (!this.var_params_1_et_2[dimension]) {
//                     return null;
//                 }

//                 res.push(this.var_params_1_et_2[dimension]);
//             }
//             return res;
//         }
//     }

//     @Watch('get_active_field_filters', { deep: true })
//     private async onchange_active_field_filters() {
//         await this.throttled_update_visible_options();
//     }

//     get var_custom_filters_1(): { [var_param_field_name: string]: string } {
//         if (!this.widget_options) {
//             return null;
//         }

//         return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters_1) ? this.widget_options.filter_custom_field_filters_1 : null;
//     }

//     get var_custom_filters_2(): { [var_param_field_name: string]: string } {
//         if (!this.widget_options) {
//             return null;
//         }

//         return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters_2) ? this.widget_options.filter_custom_field_filters_2 : null;
//     }

//     private async update_visible_options(force: boolean = false) {

//         // Si j'ai mon bouton de validation des filtres qui est actif, j'attends que ce soit lui qui m'appelle
//         if ((!force) && this.has_widget_validation_filtres()) {
//             return;
//         }


//         await this.throttle_do_update_visible_options();
//     }

//     get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
//         return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
//     }

//     private has_widget_validation_filtres(): boolean {

//         if (!this.all_page_widget) {
//             return false;
//         }

//         for (let i in this.all_page_widget) {
//             let widget: DashboardWidgetVO = this.widgets_by_id[this.all_page_widget[i].widget_id];

//             if (!widget) {
//                 continue;
//             }

//             if (widget.is_validation_filters) {
//                 return true;
//             }
//         }

//         return false;
//     }

//     private async mounted() {
//         await ValidationFiltersWidgetController.getInstance().register_updater(
//             this.dashboard_page.dashboard_id,
//             this.dashboard_page.id,
//             this.page_widget.id,
//             this.throttle_do_update_visible_options.bind(this),
//         );
//     }

//     private async get_var_params_by_dimension_when_dimension_is_vo_field_ref(custom_filters_1: { [var_param_field_name: string]: ContextFilterVO })
//         : Promise<{ [dimension_value: number]: VarDataBaseVO }> {

//         if ((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
//             return null;
//         }

//         let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};

//         /**
//          * Si la dimension est un champ de référence, on va chercher les valeurs possibles du champs en fonction des filtres actifs
//          */
//         let query_: ContextQueryVO = query(this.widget_options.dimension_vo_field_ref.api_type_id)
//             .set_limit(this.widget_options.max_dimension_values)
//             .using(this.dashboard.api_type_ids)
//             .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
//                 FieldFilterManager.clean_field_filters_for_request(this.get_active_field_filters)
//             ));

//         //On évite les jointures supprimées.
//         for (let vo_type in this.get_discarded_field_paths) {
//             let discarded_field_paths_vo_type = this.get_discarded_field_paths[vo_type];

//             for (let field_id in discarded_field_paths_vo_type) {
//                 query_.discard_field_path(vo_type, field_id); //On annhile le chemin possible depuis la cellule source de champs field_id
//             }
//         }

//         if (this.widget_options.sort_dimension_by_vo_field_ref) {
//             query_.set_sort(new SortByVO(
//                 this.widget_options.sort_dimension_by_vo_field_ref.api_type_id,
//                 this.widget_options.sort_dimension_by_vo_field_ref.field_id,
//                 this.widget_options.sort_dimension_by_asc
//             ));
//         }

//         let dimensions = await query_.field(this.widget_options.dimension_vo_field_ref.field_id).select_vos();

//         if ((!dimensions) || (!dimensions.length)) {
//             this.var_params_by_dimension = null;
//             return;
//         }

//         let promises = [];
//         let ordered_dimension: number[] = [];
//         let label_by_index: { [index: string]: string } = {};
//         let dimension_table = (this.widget_options.dimension_is_vo_field_ref && this.widget_options.dimension_vo_field_ref.api_type_id) ?
//             VOsTypesManager.moduleTables_by_voType[this.widget_options.dimension_vo_field_ref.api_type_id] : null;
//         for (let i in dimensions) {
//             let dimension: any = dimensions[i];
//             let dimension_value: number = dimension[this.widget_options.dimension_vo_field_ref.field_id];

//             ordered_dimension.push(dimension_value);

//             promises.push((async () => {

//                 /**
//                  * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
//                  */
//                 let active_field_filters = cloneDeep(this.get_active_field_filters);
//                 if (!active_field_filters) {
//                     active_field_filters = {};
//                 }

//                 if (!active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id]) {
//                     active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id] = {};
//                 }

//                 active_field_filters[this.widget_options.dimension_vo_field_ref.api_type_id][this.widget_options.dimension_vo_field_ref.field_id] = filter(
//                     this.widget_options.dimension_vo_field_ref.api_type_id, this.widget_options.dimension_vo_field_ref.field_id
//                 ).by_num_has([dimension_value]);

//                 var_params_by_dimension[dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
//                     VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
//                     active_field_filters,
//                     custom_filters_1,
//                     this.dashboard.api_type_ids,
//                     this.get_discarded_field_paths);

//                 if (!var_params_by_dimension[dimension_value]) {
//                     // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
//                     ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
//                     return;
//                 }

//                 let label = null;

//                 if (dimension_table && dimension_table.default_label_field) {
//                     label = dimension[dimension_table.default_label_field.field_id];
//                 } else if (dimension_table && dimension_table.table_label_function) {
//                     label = dimension_table.table_label_function(dimension);
//                 }

//                 label_by_index[var_params_by_dimension[dimension_value].index] = label;

//             })());
//         }
//         await all_promises(promises);

//         this.ordered_dimension = ordered_dimension;
//         this.label_by_index = label_by_index;
//         return var_params_by_dimension;
//     }

//     private async get_var_params_by_dimension_when_dimension_is_custom_filter(custom_filters_1: { [var_param_field_name: string]: ContextFilterVO })
//         : Promise<{ [dimension_value: number]: VarDataBaseVO }> {

//         if ((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) {
//             return null;
//         }

//         let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};

//         /**
//          * Sinon on se base sur la liste des valeurs possibles pour la dimension segmentée
//          */
//         if (!this.widget_options.dimension_custom_filter_name) {
//             this.var_params_by_dimension = null;
//             return;
//         }

//         if (!this.widget_options.filter_custom_field_filters_1) {
//             this.var_params_by_dimension = null;
//             return;
//         }

//         /**
//          * On checke qu'on a bien une dimension de la var dont la correspondance en filtrage spécifique est le filtre de dimension
//          */
//         let found: boolean = false;
//         for (let field_id in this.widget_options.filter_custom_field_filters_1) {
//             let custom_filter_1 = this.widget_options.filter_custom_field_filters_1[field_id];

//             if (custom_filter_1 == this.widget_options.dimension_custom_filter_name) {
//                 found = true;
//                 break;
//             }
//         }

//         if (!found) {
//             this.var_params_by_dimension = null;
//             return;
//         }

//         /**
//          * On défini ensuite la liste des valeurs possibles pour la dimension
//          *  on est sur des dates, donc on cherche à savoir les dates valides suivant les filtrages actuels (les ranges valides)
//          *  puis on itère sur ces ranges en fonction de la segmentation sélectionnée
//          *  en limitant au nombre max de valeurs de dimension
//          */
//         let dimension_values: number[] = this.get_dimension_values();

//         if ((!dimension_values) || (!dimension_values.length)) {
//             this.var_params_by_dimension = null;
//             this.ordered_dimension = null;
//             this.label_by_index = null;
//             return;
//         }

//         this.ordered_dimension = dimension_values;

//         let promises = [];
//         let label_by_index: { [index: string]: string } = {};
//         for (let i in dimension_values) {
//             let dimension_value: number = dimension_values[i];

//             promises.push((async () => {

//                 /**
//                  * Si on a pas de filtre actuellement on le crée, sinon on le remplace avec un filtre sur valeur exacte
//                  */
//                 let active_field_filters = cloneDeep(this.get_active_field_filters);
//                 active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name] = filter(
//                     ContextFilterVO.CUSTOM_FILTERS_TYPE,
//                     this.widget_options.dimension_custom_filter_name
//                 ).by_date_x_ranges([RangeHandler.create_single_elt_TSRange(dimension_value, this.widget_options.dimension_custom_filter_segment_type)]);

//                 let update_custom_filters_1 = cloneDeep(custom_filters_1);
//                 if (this.get_active_field_filters && this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] &&
//                     this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name]) {

//                     for (let field_name in this.widget_options.filter_custom_field_filters_1) {

//                         let custom_filter_name = this.widget_options.filter_custom_field_filters_1[field_name];
//                         if (custom_filter_name == this.widget_options.dimension_custom_filter_name) {
//                             if (!update_custom_filters_1) {
//                                 update_custom_filters_1 = {};
//                             }
//                             update_custom_filters_1[field_name] = active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name];
//                         }
//                     }
//                 }

//                 var_params_by_dimension[dimension_value] = await ModuleVar.getInstance().getVarParamFromContextFilters(
//                     VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
//                     active_field_filters,
//                     update_custom_filters_1,
//                     this.dashboard.api_type_ids,
//                     this.get_discarded_field_paths);

//                 if (!var_params_by_dimension[dimension_value]) {
//                     // Peut arriver si on attend un filtre custom par exemple et qu'il n'est pas encore renseigné
//                     ConsoleHandler.log('Pas de var_params pour la dimension ' + dimension_value);
//                     return;
//                 }

//                 label_by_index[var_params_by_dimension[dimension_value].index] = Dates.format_segment(dimension_value, this.widget_options.dimension_custom_filter_segment_type);
//             })());
//         }

//         await all_promises(promises);

//         this.label_by_index = label_by_index;
//         return var_params_by_dimension;
//     }

//     /**
//      * A voir si c'est la bonne méthode pas évident.
//      *  Pour le moment on prend les filtres potentiels en diminuant la granularité petit à petit
//      *  on est sur du custom filter
//      * @returns
//      */
//     private get_dimension_values(): number[] {

//         // On récupère le root du filtrage
//         let root_context_filter: ContextFilterVO = null;
//         if (!this.widget_options.dimension_custom_filter_name) {
//             return null;
//         }
//         root_context_filter = this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? this.get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][this.widget_options.dimension_custom_filter_name] : null;

//         /** Si on a pas de filtre, on peut pas connaître les bornes, donc on refuse */
//         if (!root_context_filter) {
//             return null;
//         }

//         let year_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_YEAR);
//         let month_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_MONTH);
//         let dom_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_DOM);
//         let dow_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_DOW);
//         let week_filter = ContextFilterVOHandler.find_context_filter_by_type(root_context_filter, ContextFilterVO.TYPE_DATE_WEEK);

//         /**
//          * Pour l'instant on ne gère que mois et année, avec obligation de saisir l'année et possibilité de filtrer sur le mois
//          */
//         if (dom_filter || dow_filter || week_filter || !year_filter) {
//             throw new Error('Not implemented');
//         }

//         let ranges = [];
//         let nb_ranges = 0;
//         // Si la semgentation est annuelle, inutile/impossible de filtrer sur le mois => on prend tous les mois, est-ce qu'on devrait renvoyer une erreur ?
//         // On part du principe que les ranges sont déjà ordonnés, via une union par exemple ou une normalisation quelconque - voir si c'est ok
//         if (month_filter && (this.widget_options.dimension_custom_filter_segment_type >= TimeSegment.TYPE_MONTH)) {
//             RangeHandler.foreach_ranges_sync(year_filter.param_numranges, (year: number) => {
//                 RangeHandler.foreach_ranges_sync(month_filter.param_numranges, (month: number) => {

//                     if (nb_ranges >= this.widget_options.max_dimension_values) {
//                         return;
//                     }

//                     ranges.push(RangeHandler.create_single_elt_TSRange(Dates.month(Dates.year(0, year), month - 1), TimeSegment.TYPE_MONTH));
//                     nb_ranges++;
//                 }, TimeSegment.TYPE_MONTH, null, null, !this.widget_options.sort_dimension_by_asc);
//             }, TimeSegment.TYPE_YEAR, null, null, !this.widget_options.sort_dimension_by_asc);
//         } else {
//             ranges = year_filter.param_numranges;
//         }

//         nb_ranges = 0;
//         let dimension_values: number[] = [];
//         RangeHandler.foreach_ranges_sync(ranges, (d: number) => {

//             if (nb_ranges >= this.widget_options.max_dimension_values) {
//                 return;
//             }

//             dimension_values.push(d);
//             nb_ranges++;
//         }, this.widget_options.dimension_custom_filter_segment_type, null, null, !this.widget_options.sort_dimension_by_asc);

//         return dimension_values;
//     }

//     private async do_update_visible_options() {

//         let launch_cpt: number = (this.last_calculation_cpt + 1);

//         this.last_calculation_cpt = launch_cpt;

//         if (!this.widget_options) {
//             this.ordered_dimension = null;
//             this.label_by_index = null;
//             this.var_params_1_et_2 = null;
//             this.var_params_by_dimension = null;
//             return;
//         }

//         let custom_filters_1: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters_1, this.get_active_field_filters);
//         if (this.widget_options.has_dimension) {
//             await this.set_var_params_by_dimension(custom_filters_1, launch_cpt);
//         } else {
//             await this.set_var_params_1_et_2(custom_filters_1, launch_cpt);
//         }
//     }

//     private async set_var_params_by_dimension(
//         custom_filters_1: { [var_param_field_name: string]: ContextFilterVO },
//         launch_cpt: number
//     ) {
//         if (this.var_params_1_et_2) {
//             this.var_params_1_et_2 = null;
//         }

//         let var_params_by_dimension: { [dimension_value: number]: VarDataBaseVO } = {};
//         if (!!this.widget_options.dimension_is_vo_field_ref) {
//             var_params_by_dimension = await this.get_var_params_by_dimension_when_dimension_is_vo_field_ref(custom_filters_1);
//         } else {
//             var_params_by_dimension = await this.get_var_params_by_dimension_when_dimension_is_custom_filter(custom_filters_1);
//         }

//         // Si je ne suis pas sur la dernière demande, je me casse
//         if (this.last_calculation_cpt != launch_cpt) {
//             return;
//         }

//         this.var_params_by_dimension = var_params_by_dimension;
//     }

//     private async set_var_params_1_et_2(
//         custom_filters_1: { [var_param_field_name: string]: ContextFilterVO },
//         launch_cpt: number
//     ) {

//         if (((!this.widget_options.var_id_1) || !VarsController.var_conf_by_id[this.widget_options.var_id_1]) ||
//             ((!this.widget_options.var_id_2) || !VarsController.var_conf_by_id[this.widget_options.var_id_2])) {
//             this.var_params_by_dimension = null;
//             this.var_params_1_et_2 = null;
//             return null;
//         }

//         if (this.var_params_by_dimension) {
//             this.var_params_by_dimension = null;
//         }

//         let custom_filters_2: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetComponent.get_var_custom_filters(this.var_custom_filters_2, this.get_active_field_filters);

//         let promises = [];
//         let var_1 = null;
//         let var_2 = null;
//         promises.push((async () => {
//             var_1 = await ModuleVar.getInstance().getVarParamFromContextFilters(
//                 VarsController.var_conf_by_id[this.widget_options.var_id_1].name,
//                 this.get_active_field_filters,
//                 custom_filters_1,
//                 this.dashboard.api_type_ids,
//                 this.get_discarded_field_paths);
//         })());
//         promises.push((async () => {
//             var_2 = await ModuleVar.getInstance().getVarParamFromContextFilters(
//                 VarsController.var_conf_by_id[this.widget_options.var_id_2].name,
//                 this.get_active_field_filters,
//                 custom_filters_2,
//                 this.dashboard.api_type_ids,
//                 this.get_discarded_field_paths);
//         })());

//         await all_promises(promises);

//         // Si je ne suis pas sur la dernière demande, je me casse
//         if (this.last_calculation_cpt != launch_cpt) {
//             return;
//         }

//         this.ordered_dimension = [0, 1];
//         this.label_by_index = {
//             0: this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_1)),
//             1: this.t(this.widget_options.get_var_name_code_text(this.page_widget.id, this.widget_options.var_id_2))
//         };
//         this.var_params_1_et_2 = {
//             0: var_1,
//             1: var_2
//         };
//     }

//     @Watch('widget_options', { immediate: true })
//     private async onchange_widget_options() {

//         await this.throttled_update_visible_options();
//     }

//     get widget_options() {
//         if (!this.page_widget) {
//             return null;
//         }

//         let options: VarPieChartWidgetOptions = null;
//         try {
//             if (!!this.page_widget.json_options) {
//                 options = JSON.parse(this.page_widget.json_options) as VarPieChartWidgetOptions;
//                 options = options ? new VarPieChartWidgetOptions(
//                     options.bg_color,
//                     options.legend_display,
//                     options.legend_position,
//                     options.legend_font_color,
//                     options.legend_font_size,
//                     options.legend_box_width,
//                     options.legend_padding,
//                     options.legend_use_point_style,
//                     options.title_display,
//                     options.title_font_color,
//                     options.title_font_size,
//                     options.title_padding,
//                     options.cutout_percentage,
//                     options.rotation,
//                     options.circumference,
//                     options.has_dimension,
//                     options.max_dimension_values,
//                     options.sort_dimension_by_vo_field_ref,
//                     options.sort_dimension_by_asc,
//                     options.dimension_is_vo_field_ref,
//                     options.dimension_vo_field_ref,
//                     options.dimension_custom_filter_name,
//                     options.dimension_custom_filter_segment_type,
//                     options.filter_type,
//                     options.filter_additional_params,
//                     options.var_id_1,
//                     options.filter_custom_field_filters_1,
//                     options.bg_color_1,
//                     options.border_color_1,
//                     options.border_width_1,
//                     options.var_id_2,
//                     options.filter_custom_field_filters_2,
//                     options.bg_color_2,
//                     options.border_color_2,
//                     options.border_width_2,
//                     options.max_is_sum_of_var_1_and_2) : null;
//             }
//         } catch (error) {
//             ConsoleHandler.error(error);
//         }

//         return options;
//     }
// }