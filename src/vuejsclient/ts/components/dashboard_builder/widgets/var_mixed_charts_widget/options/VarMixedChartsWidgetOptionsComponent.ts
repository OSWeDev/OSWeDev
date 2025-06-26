import { Scale } from 'chart.js';
import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VarChartOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarChartScalesOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import VarMixedChartWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import VarChartsOptionsComponent from '../../var_chart_options/VarChartsOptionsComponent';
import VarChartScalesOptionsComponent from '../../var_chart_scales_options/VarChartScalesOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import './VarMixedChartsWidgetOptionsComponent.scss';

/**
 * Composant lié au template VarMixedChartsWidgetOptionsComponent.pug
 * Gère l'édition des options pour un widget de type VarMixedChart
 */
@Component({
    template: require('./VarMixedChartsWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Varchartsoptionscomponent: VarChartsOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Varchartscalesoptionscomponent: VarChartScalesOptionsComponent
    }
})
export default class VarMixedChartsWidgetOptionsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    // --------------------------------------------------------------------------
    // Props et injections du store
    // --------------------------------------------------------------------------

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;


    // --------------------------------------------------------------------------
    // Sections repliables pour l'UX (accordions)
    // --------------------------------------------------------------------------
    private sectionsOpen = {
        widgetTitle: false,
        chartBasic: false,
        chartTitle: false,
        chartLegend: false,
        dataOptions: false,
        scaleXOptions: false,
        yAxisOptions: false
    };

    // --------------------------------------------------------------------------
    // Données de travail
    // --------------------------------------------------------------------------

    /**
     * Copie de l'objet d'options à mettre à jour (optimisation pour la throttle)
     */
    private next_update_options: VarMixedChartWidgetOptionsVO = null;

    /**
     * Mécanismes pour limiter la fréquence de reload/update
     */
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(
        'VarMixedChartsWidgetOptionsComponent.throttled_reload_options',
        this.reload_options.bind(this), 50, false
    );

    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(
        'VarMixedChartsWidgetOptionsComponent.throttled_update_options',
        this.update_options.bind(this), 50, false
    );

    private throttled_update_colors = ThrottleHelper.declare_throttle_without_args(
        'VarMixedChartsWidgetOptionsComponent.throttled_update_colors',
        this.update_colors.bind(this), 800, false
    );

    // --- Champs partagés / toggles / inputs
    private dimension_custom_filter_name: string = null;
    private bg_color: string = null;
    private legend_font_color: string = null;
    private title_font_color: string = null;

    private legend_display: boolean = false;
    private legend_use_point_style: boolean = false;
    private title_display: boolean = false;
    private has_dimension: boolean = true;
    private detailed: boolean = true;
    private tooltip_by_index: boolean = false;
    private sort_dimension_by_asc: boolean = false;
    private hide_filter: boolean = false;
    private dimension_is_vo_field_ref: boolean = false;

    // --- Tailles / paddings (string pour la saisie, parseInt derrière)
    private legend_font_size: string = null;
    private legend_box_width: string = null;
    private legend_padding: string = null;
    private title_font_size: string = null;
    private title_padding: string = null;
    private max_dimension_values: string = null;
    private max_dataset_values: string = null;

    // --- Options complexes
    private var_charts_options?: VarChartOptionsVO[] = [];
    private var_chart_scales_options?: VarChartScalesOptionsVO[] = [];

    // --- Échelles (chart.js) => X & Y
    private scale_y_title: string = null;
    private scale_x_title: string = null;
    private show_scale_x: boolean = false;
    private show_scale_y: boolean = false;
    private scale_options_x?: Partial<Scale> = null;
    private scale_options_y?: Partial<Scale> = null;

    // --- Sélections temporaires (multiselect)
    private tmp_selected_legend_position: string = null;
    private tmp_selected_custom_filter: string = null;
    private tmp_selected_dimension_custom_filter_segment_type: string = null;

    /**
     * Objet principal d'options du widget
     */
    private widget_options: VarMixedChartWidgetOptionsVO = null;

    // --- Types de segment pour la dimension (TimeSegment)
    private dimension_custom_filter_segment_types: { [index: number]: string } = {
        [TimeSegment.TYPE_YEAR]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_YEAR),
        [TimeSegment.TYPE_MONTH]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MONTH),
        [TimeSegment.TYPE_DAY]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_DAY),
        [TimeSegment.TYPE_HOUR]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_HOUR),
        [TimeSegment.TYPE_MINUTE]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MINUTE),
        [TimeSegment.TYPE_SECOND]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_SECOND)
    };

    private dimension_custom_filter_segment_types_values: string[] = Object.values(this.dimension_custom_filter_segment_types);

    // --- Positions possibles de la légende
    private legend_positions: string[] = [
        'top',
        'left',
        'bottom',
        'right'
    ];


    // --------------------------------------------------------------------------
    // Getters
    // --------------------------------------------------------------------------

    get get_custom_filters() {
        return this.vuexGet<string[]>(reflect<this>().get_custom_filters);
    }


    /**
     * Retourne les échelles (var_chart_scales_options) disponibles
     */
    get fields_that_could_get_scales_filter(): VarChartScalesOptionsVO[] {
        return this.var_chart_scales_options;
    }

    /**
     * Titre de l'axe X (code text)
     */
    get scale_x_code_text(): string {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_scale_x_code_text(this.page_widget?.id);
    }

    /**
     * VOFieldRefVO - multiple dataset
     */
    get multiple_dataset_vo_field_ref(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;
        if ((!options) || (!options.multiple_dataset_vo_field_ref)) {
            return null;
        }
        return Object.assign(new VOFieldRefVO(), options.multiple_dataset_vo_field_ref);
    }

    /**
     * VOFieldRefVO - dimension
     */
    get dimension_vo_field_ref(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;
        if ((!options) || (!options.dimension_vo_field_ref)) {
            return null;
        }
        return Object.assign(new VOFieldRefVO(), options.dimension_vo_field_ref);
    }

    /**
     * VOFieldRefVO - tri de dimension
     */
    get sort_dimension_by_vo_field_ref(): VOFieldRefVO {
        const options: VarMixedChartWidgetOptionsVO = this.widget_options;
        if ((!options) || (!options.sort_dimension_by_vo_field_ref)) {
            return null;
        }
        return Object.assign(new VOFieldRefVO(), options.sort_dimension_by_vo_field_ref);
    }

    // --------------------------------------------------------------------------
    // Watchers (pour recharger quand la prop page_widget change, etc.)
    // --------------------------------------------------------------------------

    @Watch('page_widget', { immediate: true, deep: true })
    private async onchange_page_widget() {
        await this.throttled_reload_options();
    }

    /**
     * Si le widget_options change depuis l'extérieur, on reload.
     */
    @Watch('widget_options', { deep: true })
    private async onchange_widget_options() {
        await this.throttled_reload_options();
    }

    /**
     * Watch sur scale_x_code_text : on met à jour widget_options.scale_x_title
     */
    @Watch('scale_x_code_text')
    private async onchange_scale_x_code_text() {
        if (!this.widget_options) {
            return;
        }
        if (!this.scale_x_code_text) {
            // Supprime le titre X si on vide scale_x_code_text
            if (this.widget_options.scale_x_title) {
                this.widget_options.scale_x_title = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            if (this.widget_options.scale_x_title !== this.scale_x_code_text) {
                this.next_update_options = this.widget_options;
                this.next_update_options.scale_x_title = this.scale_x_code_text;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    /**
     * Sélecteur de type segment => on met à jour TimeSegment.TYPE_*
     */
    @Watch('tmp_selected_dimension_custom_filter_segment_type')
    private async onchange_tmp_selected_dimension_custom_filter_segment_type() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_dimension_custom_filter_segment_type) {
            if (this.widget_options.dimension_custom_filter_segment_type) {
                this.widget_options.dimension_custom_filter_segment_type = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const newType = this.get_dimension_custom_filter_segment_type_from_selected_option(
                this.tmp_selected_dimension_custom_filter_segment_type
            );
            if (this.widget_options.dimension_custom_filter_segment_type !== newType) {
                this.next_update_options = this.widget_options;
                this.next_update_options.dimension_custom_filter_segment_type = newType;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    /**
     * Sélecteur position de légende
     */
    @Watch('tmp_selected_legend_position')
    private async onchange_tmp_selected_legend_position() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_legend_position) {
            if (this.widget_options.legend_position) {
                this.widget_options.legend_position = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            if (this.widget_options.legend_position !== this.tmp_selected_legend_position) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_position = this.tmp_selected_legend_position;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // --------------------------------------------------------------------------
    // Watchers simplifiés pour les propriétés numériques
    // --------------------------------------------------------------------------

    @Watch('legend_font_size')
    private watch_legend_font_size() {
        this.watchNumericProperty('legend_font_size', 'legend_font_size', 12, 100);
    }

    @Watch('legend_box_width')
    private watch_legend_box_width() {
        this.watchNumericProperty('legend_box_width', 'legend_box_width', 40, 400);
    }

    @Watch('legend_padding')
    private watch_legend_padding() {
        this.watchNumericProperty('legend_padding', 'legend_padding', 10);
    }

    @Watch('title_font_size')
    private watch_title_font_size() {
        this.watchNumericProperty('title_font_size', 'title_font_size', 16, 100);
    }

    @Watch('title_padding')
    private watch_title_padding() {
        this.watchNumericProperty('title_padding', 'title_padding', 10);
    }

    @Watch('max_dimension_values')
    private async watch_max_dimension_values() {
        // Logique un peu différente (valeur > 0 si !dimension_is_vo_field_ref)
        if (!this.widget_options) {
            return;
        }
        if (!this.max_dimension_values) {
            if (this.widget_options.max_dimension_values) {
                this.widget_options.max_dimension_values = 10;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const parsed = parseInt(this.max_dimension_values);
            if (this.widget_options.max_dimension_values !== parsed) {
                if (this.widget_options.dimension_is_vo_field_ref) {
                    // dimension_is_vo_field_ref => >= 0
                    if (parsed >= 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = parsed;
                    }
                } else {
                    // custom filter => > 0
                    if (parsed > 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = parsed;
                    } else {
                        this.snotify.error('Un custom filter doit avoir un maximum de valeurs > 0');
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = 10;
                    }
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('max_dataset_values')
    private async watch_max_dataset_values() {
        // Logique similaire à max_dimension_values
        if (!this.widget_options) {
            return;
        }
        if (!this.max_dataset_values) {
            if (this.widget_options.max_dataset_values) {
                this.widget_options.max_dataset_values = 10;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const parsed = parseInt(this.max_dataset_values);
            if (this.widget_options.max_dataset_values !== parsed) {
                if (this.widget_options.dimension_is_vo_field_ref) {
                    if (parsed >= 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dataset_values = parsed;
                    }
                } else {
                    if (parsed > 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dataset_values = parsed;
                    } else {
                        this.snotify.error('Un custom filter doit avoir un maximum de valeurs > 0');
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dataset_values = 10;
                    }
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    /**
     * Sélection d'un custom_filter dimension
     */
    @Watch('tmp_selected_custom_filter')
    private async watch_tmp_custom_filter_dimension(): Promise<void> {
        if (!this.widget_options) {
            return;
        }
        this.prepareNextOptions();

        this.dimension_custom_filter_name = this.tmp_selected_custom_filter;
        this.next_update_options.dimension_custom_filter_name = this.tmp_selected_custom_filter;

        await this.throttled_update_options();
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }

    /**
     * Permet de replier/déplier une section
     * @param section Nom de la section dans sectionsOpen
     */
    private toggleSection(section: keyof typeof this.sectionsOpen) {
        this.sectionsOpen[section] = !this.sectionsOpen[section];
    }

    /**
     * watchNumericProperty : factorise la logique d'un parseInt sur un champ local => widget_options
     */
    private async watchNumericProperty(localPropName: string, widgetOptionName: string, defaultValue: number, maxValue?: number) {
        if (!this.widget_options) {
            return;
        }
        const localValStr = (this as any)[localPropName];
        if (!localValStr) {
            if ((this.widget_options as any)[widgetOptionName]) {
                (this.widget_options as any)[widgetOptionName] = defaultValue;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const parsed = parseInt(localValStr);
            const currentVal = (this.widget_options as any)[widgetOptionName];

            if (currentVal !== parsed) {
                if (maxValue != null && parsed > maxValue) {
                    // On borne
                    (this as any)[localPropName] = maxValue.toString();
                    (this.widget_options as any)[widgetOptionName] = maxValue;
                } else {
                    (this.widget_options as any)[widgetOptionName] = parsed;
                }
                this.next_update_options = this.widget_options;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // --------------------------------------------------------------------------
    // Méthodes "switch" (toggles) pour mettre à jour le widget_options
    // --------------------------------------------------------------------------

    private async switch_show_scale_x() {
        this.prepareNextOptions();
        this.next_update_options.show_scale_x = !this.next_update_options.show_scale_x;
        await this.throttled_update_options();
    }

    private async switch_show_scale_y() {
        this.prepareNextOptions();
        this.next_update_options.show_scale_y = !this.next_update_options.show_scale_y;
        await this.throttled_update_options();
    }

    private async switch_legend_display() {
        this.prepareNextOptions();
        this.next_update_options.legend_display = !this.next_update_options.legend_display;
        await this.throttled_update_options();
    }

    private async switch_dimension_is_vo_field_ref() {
        this.prepareNextOptions();
        this.next_update_options.dimension_is_vo_field_ref = !this.next_update_options.dimension_is_vo_field_ref;
        await this.throttled_update_options();
    }

    private async switch_sort_dimension_by_asc() {
        this.prepareNextOptions();
        this.next_update_options.sort_dimension_by_asc = !this.next_update_options.sort_dimension_by_asc;
        await this.throttled_update_options();
    }

    private async switch_hide_filter() {
        this.prepareNextOptions();
        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;
        await this.throttled_update_options();
    }

    private async switch_tooltip_by_index() {
        this.prepareNextOptions();
        this.tooltip_by_index = !this.tooltip_by_index;
        this.next_update_options.tooltip_by_index = this.tooltip_by_index;
        await this.throttled_update_options();
    }

    private async switch_detailed() {
        this.prepareNextOptions();
        this.detailed = !this.detailed;
        this.next_update_options.detailed = this.detailed;
        await this.throttled_update_options();
    }

    private async switch_title_display() {
        this.prepareNextOptions();
        this.next_update_options.title_display = !this.next_update_options.title_display;
        await this.throttled_update_options();
    }

    private async switch_legend_use_point_style() {
        this.prepareNextOptions();
        this.next_update_options.legend_use_point_style = !this.next_update_options.legend_use_point_style;
        await this.throttled_update_options();
    }

    // --------------------------------------------------------------------------
    // Méthodes pour manipuler les VOFieldRef (dimension, tri, dataset, etc.)
    // --------------------------------------------------------------------------

    private async remove_dimension_vo_field_ref() {
        this.prepareNextOptions();
        if (!this.next_update_options.dimension_vo_field_ref) {
            return;
        }
        this.next_update_options.dimension_vo_field_ref = null;
        await this.throttled_update_options();
    }

    private async add_dimension_vo_field_ref(api_type_id: string, field_id: string) {
        this.prepareNextOptions();
        const vof = new VOFieldRefVO();
        vof.api_type_id = api_type_id;
        vof.field_id = field_id;
        vof.weight = 0;

        this.next_update_options.dimension_vo_field_ref = vof;
        await this.throttled_update_options();
    }

    private async remove_sort_dimension_by_vo_field_ref() {
        this.prepareNextOptions();
        if (!this.next_update_options.sort_dimension_by_vo_field_ref) {
            return;
        }
        this.next_update_options.sort_dimension_by_vo_field_ref = null;
        await this.throttled_update_options();
    }

    private async add_sort_dimension_by_vo_field_ref(api_type_id: string, field_id: string) {
        this.prepareNextOptions();
        const vof = new VOFieldRefVO();
        vof.api_type_id = api_type_id;
        vof.field_id = field_id;
        vof.weight = 0;

        this.next_update_options.sort_dimension_by_vo_field_ref = vof;
        await this.throttled_update_options();
    }

    private async remove_multiple_dataset_vo_field_ref() {
        this.prepareNextOptions();
        if (!this.next_update_options.multiple_dataset_vo_field_ref) {
            return;
        }
        this.next_update_options.multiple_dataset_vo_field_ref = null;
        await await this.throttled_update_options();
    }

    private async add_multiple_dataset_vo_field_ref(api_type_id: string, field_id: string) {
        this.prepareNextOptions();
        const vof = new VOFieldRefVO();
        vof.api_type_id = api_type_id;
        vof.field_id = field_id;
        vof.weight = 0;

        this.next_update_options.multiple_dataset_vo_field_ref = vof;
        await await this.throttled_update_options();
    }

    // --------------------------------------------------------------------------
    // Méthodes utilitaires
    // --------------------------------------------------------------------------

    /**
     * Initialise next_update_options avec widget_options si besoin
     */
    private prepareNextOptions() {
        if (!this.widget_options) {
            this.widget_options = this.get_default_options();
        }
        if (!this.next_update_options) {
            this.next_update_options = this.widget_options;
        }
    }

    /**
     * Permet de récupérer la traduction de la position de la légende
     * @param position
     * @returns
     */
    private get_legend_position_label(position: string) {
        return this.label(`var_mixed_charts_widget_options_component.legend_position.${position}`);
    }

    /**
     * Renvoie un VarMixedChartWidgetOptionsVO par défaut
     */
    private get_default_options(): VarMixedChartWidgetOptionsVO {
        return VarMixedChartWidgetOptionsVO.createDefault();
    }

    /**
     * Callback quand on modifie l'axe X (ChartJsScaleOptions)
     */
    private async handle_scale_options_x_change(options: Partial<Scale>) {
        this.scale_options_x = options;
        this.prepareNextOptions();

        if (this.scale_options_x && this.scale_options_x.type !== '') {
            this.next_update_options.scale_options_x = options;
        }
        await this.throttled_update_options();
    }

    /**
     * Callback quand on modifie l'axe Y
     */
    private async handle_scale_options_y_change(options: Partial<Scale>) {
        this.scale_options_y = options;
        this.prepareNextOptions();

        if (this.scale_options_y && this.scale_options_y.type !== '') {
            this.next_update_options.scale_options_y = options;
        }
        await this.throttled_update_options();
    }

    /**
     * Quand on modifie la liste des var_charts_options (ex: ajout/suppression de variables à afficher)
     */
    private async handle_var_charts_options_change(var_charts_options: VarChartOptionsVO[]) {
        if (!this.widget_options) {
            return;
        }
        this.prepareNextOptions();

        this.var_charts_options = var_charts_options;
        this.next_update_options.var_charts_options = this.var_charts_options;
        await this.throttled_update_options();
    }

    /**
     * Quand on modifie la liste des échelles
     */
    private async handle_var_chart_scales_options_change(var_chart_scales_options: VarChartScalesOptionsVO[]) {
        if (!this.widget_options) {
            return;
        }
        this.prepareNextOptions();

        this.var_chart_scales_options = var_chart_scales_options;
        this.next_update_options.var_chart_scales_options = this.var_chart_scales_options;
        await this.throttled_update_options();
    }

    /**
     * ex: update_filter_type si on veut modifier un type de filtre global
     */
    private async update_filter_type(filter_type: string): Promise<void> {
        if (!this.widget_options) {
            return;
        }
        this.prepareNextOptions();
        this.next_update_options.filter_type = filter_type;
        await this.throttled_update_options();
    }

    /**
     * update_colors, throttle 800ms
     */
    private async update_colors() {
        if (!this.widget_options) {
            return;
        }
        this.prepareNextOptions();

        this.next_update_options.legend_font_color = this.legend_font_color;
        this.next_update_options.title_font_color = this.title_font_color;
        this.next_update_options.bg_color = this.bg_color;

        await await this.throttled_update_options();
    }


    /**
     * Convertit la valeur sélectionnée (string) en TimeSegment.TYPE_*
     */
    private get_dimension_custom_filter_segment_type_from_selected_option(selected_option: string): number {
        if (this.dimension_custom_filter_segment_types) {
            for (const key of Object.keys(this.dimension_custom_filter_segment_types)) {
                if (this.dimension_custom_filter_segment_types[+key] === selected_option) {
                    const numericKey = parseInt(key);
                    return numericKey >= 0 ? numericKey : null;
                }
            }
        }
        return null;
    }

    /**
     * reload_options : charge la config JSON du widget (page_widget.json_options)
     */
    private reload_options(): void {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {
            let options: VarMixedChartWidgetOptionsVO = null;
            try {
                if (this.page_widget.json_options) {
                    options = JSON.parse(this.page_widget.json_options) as VarMixedChartWidgetOptionsVO;
                    if (this.widget_options && isEqual(this.widget_options, options)) {
                        options = null;
                    }
                    options = options ? new VarMixedChartWidgetOptionsVO().from(options) : null;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }

            if (options && this.page_widget.json_options) {
                if (!ObjectHandler.are_equal(this.widget_options, options)) {
                    this.widget_options = options;
                }
            } else if (this.widget_options && !this.page_widget.json_options) {
                this.widget_options = null;
            }
        }

        // Si on n'a pas de widget_options => on met des valeurs par défaut
        if (!this.widget_options) {
            this.next_update_options = null;
            this.bg_color = null;

            // Valeurs par défaut légende
            this.legend_display = true;
            this.tmp_selected_legend_position = 'top';
            this.legend_font_color = '#666';
            this.legend_font_size = '12';
            this.legend_box_width = '40';
            this.legend_padding = '10';
            this.legend_use_point_style = false;

            // Valeurs par défaut du titre
            this.title_display = false;
            this.detailed = true;
            this.tooltip_by_index = false;
            this.title_font_color = '#666';
            this.title_font_size = '16';
            this.title_padding = '10';

            // Dimension
            this.has_dimension = true;
            this.max_dimension_values = '10';
            this.max_dataset_values = '10';
            this.sort_dimension_by_asc = true;
            this.hide_filter = false;
            this.dimension_is_vo_field_ref = true;
            this.dimension_custom_filter_name = null;
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[0];

            // varCharts
            this.var_charts_options = [];
            this.var_chart_scales_options = [];

            // Échelles X / Y
            this.show_scale_x = false;
            this.show_scale_y = false;
            this.scale_x_title = null;
            this.scale_y_title = null;
            this.scale_options_x = null;
            this.scale_options_y = null;
            return;
        }

        // Sinon on "resynchronise" toutes les propriétés locales
        if (this.legend_display !== this.widget_options.legend_display) {
            this.legend_display = this.widget_options.legend_display;
        }
        if (
            ((!this.widget_options.legend_font_size) && this.legend_font_size) ||
            (this.widget_options.legend_font_size && (this.legend_font_size !== this.widget_options.legend_font_size.toString()))
        ) {
            this.legend_font_size = this.widget_options.legend_font_size?.toString() || null;
        }
        if (
            ((!this.widget_options.legend_box_width) && this.legend_box_width) ||
            (this.widget_options.legend_box_width && (this.legend_box_width !== this.widget_options.legend_box_width.toString()))
        ) {
            this.legend_box_width = this.widget_options.legend_box_width?.toString() || null;
        }
        if (
            ((!this.widget_options.legend_padding) && this.legend_padding) ||
            (this.widget_options.legend_padding && (this.legend_padding !== this.widget_options.legend_padding.toString()))
        ) {
            this.legend_padding = this.widget_options.legend_padding?.toString() || null;
        }
        if (this.legend_use_point_style !== this.widget_options.legend_use_point_style) {
            this.legend_use_point_style = this.widget_options.legend_use_point_style;
        }

        if (this.title_display !== this.widget_options.title_display) {
            this.title_display = this.widget_options.title_display;
        }
        if (this.detailed !== this.widget_options.detailed) {
            this.detailed = this.widget_options.detailed;
        }
        if (this.tooltip_by_index !== this.widget_options.tooltip_by_index) {
            this.tooltip_by_index = this.widget_options.tooltip_by_index;
        }
        if (
            ((!this.widget_options.title_font_size) && this.title_font_size) ||
            (this.widget_options.title_font_size && (this.title_font_size !== this.widget_options.title_font_size.toString()))
        ) {
            this.title_font_size = this.widget_options.title_font_size?.toString() || null;
        }
        if (
            ((!this.widget_options.title_padding) && this.title_padding) ||
            (this.widget_options.title_padding && (this.title_padding !== this.widget_options.title_padding.toString()))
        ) {
            this.title_padding = this.widget_options.title_padding?.toString() || null;
        }

        if (this.has_dimension !== this.widget_options.has_dimension) {
            this.has_dimension = this.widget_options.has_dimension;
        }
        if (
            ((!this.widget_options.max_dimension_values) && this.max_dimension_values) ||
            (this.widget_options.max_dimension_values && (this.max_dimension_values !== this.widget_options.max_dimension_values.toString()))
        ) {
            this.max_dimension_values = this.widget_options.max_dimension_values?.toString() || null;
        }
        if (
            ((!this.widget_options.max_dataset_values) && this.max_dataset_values) ||
            (this.widget_options.max_dataset_values && (this.max_dataset_values !== this.widget_options.max_dataset_values.toString()))
        ) {
            this.max_dataset_values = this.widget_options.max_dataset_values?.toString() || null;
        }
        if (this.sort_dimension_by_asc !== this.widget_options.sort_dimension_by_asc) {
            this.sort_dimension_by_asc = this.widget_options.sort_dimension_by_asc;
        }
        if (this.hide_filter !== this.widget_options.hide_filter) {
            this.hide_filter = this.widget_options.hide_filter;
        }
        if (this.dimension_is_vo_field_ref !== this.widget_options.dimension_is_vo_field_ref) {
            this.dimension_is_vo_field_ref = this.widget_options.dimension_is_vo_field_ref;
        }
        if (this.dimension_custom_filter_name !== this.widget_options.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.widget_options.dimension_custom_filter_name;
            this.tmp_selected_custom_filter = this.dimension_custom_filter_name;
        }

        // Légende : position
        if (this.tmp_selected_legend_position !== this.widget_options.legend_position) {
            this.tmp_selected_legend_position = this.widget_options.legend_position;
        }

        // dimension_custom_filter_segment_type
        const wantedSegmentType = this.get_dimension_custom_filter_segment_type_from_selected_option(
            this.tmp_selected_dimension_custom_filter_segment_type
        );
        if (wantedSegmentType !== this.widget_options.dimension_custom_filter_segment_type) {
            this.tmp_selected_dimension_custom_filter_segment_type =
                this.dimension_custom_filter_segment_types[this.widget_options.dimension_custom_filter_segment_type];
        }

        // Couleurs
        if (this.bg_color !== this.widget_options.bg_color) {
            this.bg_color = this.widget_options.bg_color;
        }
        if (this.legend_font_color !== this.widget_options.legend_font_color) {
            this.legend_font_color = this.widget_options.legend_font_color;
        }
        if (this.title_font_color !== this.widget_options.title_font_color) {
            this.title_font_color = this.widget_options.title_font_color;
        }

        // varCharts
        if (!isEqual(this.var_charts_options, this.widget_options.var_charts_options)) {
            this.var_charts_options = cloneDeep(this.widget_options.var_charts_options);
        }
        if (!isEqual(this.var_chart_scales_options, this.widget_options.var_chart_scales_options)) {
            this.var_chart_scales_options = cloneDeep(this.widget_options.var_chart_scales_options);
        }

        // Échelles
        if (this.show_scale_x !== this.widget_options.show_scale_x) {
            this.show_scale_x = this.widget_options.show_scale_x;
        }
        if (this.show_scale_y !== this.widget_options.show_scale_y) {
            this.show_scale_y = this.widget_options.show_scale_y;
        }
        if (this.scale_x_title !== this.widget_options.scale_x_title) {
            this.scale_x_title = this.widget_options.scale_x_title;
        }
        if (this.scale_y_title !== this.widget_options.scale_y_title) {
            this.scale_y_title = this.widget_options.scale_y_title;
        }
        if (!isEqual(this.scale_options_x, this.widget_options.scale_options_x)) {
            this.scale_options_x = cloneDeep(this.widget_options.scale_options_x);
        }
        if (!isEqual(this.scale_options_y, this.widget_options.scale_options_y)) {
            this.scale_options_y = cloneDeep(this.widget_options.scale_options_y);
        }

        if (this.next_update_options !== this.widget_options) {
            this.next_update_options = this.widget_options;
        }
    }

    /**
     * Sauvegarde des options en BDD (via ModuleDAO)
     */
    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);

        // On informe le store
        this.set_page_widget(this.page_widget);
        // On émet si besoin
        this.$emit('update_layout_widget', this.page_widget);
    }
}
