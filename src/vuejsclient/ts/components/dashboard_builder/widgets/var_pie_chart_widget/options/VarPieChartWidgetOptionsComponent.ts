import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DashboardGraphColorPaletteVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardGraphColorPaletteVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VarPieChartWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler, { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';
import './VarPieChartWidgetOptionsComponent.scss';

@Component({
    template: require('./VarPieChartWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent
    }
})
export default class VarPieChartWidgetOptionsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    /**
     * Copie des options (qui sera mise à jour via throttling)
     */
    public next_update_options: VarPieChartWidgetOptionsVO = null;

    /**
     * Mécanismes de throttle pour recharger / mettre à jour les options
     */
    public throttled_reload_options = ThrottleHelper.declare_throttle_without_args(
        'VarPieChartWidgetOptionsComponent.throttled_reload_options',
        this.reload_options.bind(this), 50, false);

    public throttled_update_options = ThrottleHelper.declare_throttle_without_args(
        'VarPieChartWidgetOptionsComponent.throttled_update_options',
        this.update_options.bind(this), 50, false);

    public throttled_update_colors = ThrottleHelper.declare_throttle_without_args(
        'VarPieChartWidgetOptionsComponent.throttled_update_colors',
        this.update_colors.bind(this), 800, false);


    // --------------------------------------------------------------------------
    // Sections repliables : on stocke un objet pour savoir ce qui est ouvert ou fermé
    // --------------------------------------------------------------------------
    public sectionsOpen = {
        widgetOptions: false,
        chartTitle: false,
        chartLabel: false,
        chartLegend: false,
        dataOptions: false,
    };


    // --------------------------------------------------------------------------
    // Champs / data divers
    // --------------------------------------------------------------------------

    // Sélections temporaires pour var_id etc.
    public tmp_selected_var_name_1: string = null;
    public tmp_selected_var_name_2: string = null;
    public tmp_selected_color_palette: string = null;

    public tmp_selected_custom_filter: string = null;

    // Custom filter names par var
    public custom_filter_names_1: { [field_id: string]: string } = {};
    public custom_filter_names_2: { [field_id: string]: string } = {};

    public dimension_custom_filter_name: string = null;

    public color_palettes_labels: string[] = [];
    public color_palettes: DashboardGraphColorPaletteVO[] = [];

    // Couleurs
    public bg_color_1: string = null;
    public bg_color_2: string = null;
    public border_color_1: string = null;
    public border_color_2: string = null;
    public bg_color: string = null;
    public bg_colors: string[] = null;
    public bg_gradient: boolean = false;
    public legend_font_color: string = null;
    public title_font_color: string = null;

    // Toggles divers
    public legend_display: boolean = false;
    public label_display: boolean = false;
    public max_is_sum_of_var_1_and_2: boolean = false;
    public legend_use_point_style: boolean = false;
    public title_display: boolean = false;
    public has_dimension: boolean = true;
    public sort_dimension_by_asc: boolean = false;
    public hide_filter: boolean = false;
    public dimension_is_vo_field_ref: boolean = false;

    // Champs numériques (saisis sous forme string parfois)
    public legend_font_size: string = null;
    public legend_box_width: string = null;
    public legend_padding: string = null;
    public title_font_size: string = null;
    public title_padding: string = null;
    public cutout_percentage: string = null;
    public rotation: string = null;
    public circumference: string = null;
    public max_dimension_values: string = null;
    public border_width_1: number = 0;
    public border_width_2: number = 0;

    public tmp_selected_legend_position: string = null;
    public tmp_selected_dimension_custom_filter_segment_type: string = null;

    // Les options du widget
    public widget_options: VarPieChartWidgetOptionsVO = null;

    // Types de segments de date (TimeSegment)
    public dimension_custom_filter_segment_types: { [index: number]: string } = {
        [TimeSegment.TYPE_YEAR]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_YEAR),
        [TimeSegment.TYPE_MONTH]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MONTH),
        [TimeSegment.TYPE_DAY]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_DAY),
        [TimeSegment.TYPE_HOUR]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_HOUR),
        [TimeSegment.TYPE_MINUTE]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_MINUTE),
        [TimeSegment.TYPE_SECOND]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_SECOND),
        [TimeSegment.TYPE_QUARTER]: this.label('VarPieChartWidgetOptionsComponent.dimension_custom_filter_segment_types.' + TimeSegment.TYPE_QUARTER),
    };

    public dimension_custom_filter_segment_types_values: string[] = Object.values(this.dimension_custom_filter_segment_types);
    public legend_positions: string[] = ['top', 'left', 'bottom', 'right'];


    // --------------------------------------------------------------------------
    // GETTERS divers
    // --------------------------------------------------------------------------

    get get_custom_filters(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_custom_filters);
    }

    get dimension_vo_field_ref(): VOFieldRefVO {
        if ((!this.widget_options) || (!this.widget_options.dimension_vo_field_ref)) {
            return null;
        }
        return Object.assign(new VOFieldRefVO(), this.widget_options.dimension_vo_field_ref);
    }

    get sort_dimension_by_vo_field_ref(): VOFieldRefVO {
        if ((!this.widget_options) || (!this.widget_options.sort_dimension_by_vo_field_ref)) {
            return null;
        }
        return Object.assign(new VOFieldRefVO(), this.widget_options.sort_dimension_by_vo_field_ref);
    }

    get fields_that_could_get_custom_filter_1(): string[] {
        const res: string[] = [];

        if (!this.widget_options || (!this.widget_options.var_id_1) || (!VarsController.var_conf_by_id[this.widget_options.var_id_1])) {
            return null;
        }
        const var_param_type = VarsController.var_conf_by_id[this.widget_options.var_id_1].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }
        if (!this.custom_filter_names_1) {
            this.custom_filter_names_1 = {};
        }
        const fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (const i in fields) {
            const field = fields[i];
            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names_1[field.field_id] === "undefined") {
                    this.custom_filter_names_1[field.field_id] = null;
                }
            }
        }
        return res;
    }

    get fields_that_could_get_custom_filter_2(): string[] {
        const res: string[] = [];
        if (!this.widget_options || !this.widget_options.var_id_2) {
            return null;
        }
        const var_param_type = VarsController.var_conf_by_id[this.widget_options.var_id_2].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }
        if (!this.custom_filter_names_2) {
            this.custom_filter_names_2 = {};
        }
        const fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (const i in fields) {
            const field = fields[i];
            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names_2[field.field_id] === "undefined") {
                    this.custom_filter_names_2[field.field_id] = null;
                }
            }
        }
        return res;
    }

    get var_names(): string[] {
        const res: string[] = [];
        for (const i in VarsController.var_conf_by_name) {
            const var_conf = VarsController.var_conf_by_name[i];
            res.push(var_conf.id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(var_conf.id)));
        }
        res.sort((a, b) => {
            const a_ = a.split(' | ')[1];
            const b_ = b.split(' | ')[1];
            if (a_ < b_) return -1;
            if (a_ > b_) return 1;
            return 0;
        });
        return res;
    }


    // --------------------------------------------------------------------------
    // WATCHERS sur page_widget, widget_options, etc.
    // --------------------------------------------------------------------------

    /**
     * Sélection d'un custom_filter dimension
     */
    @Watch(reflect<VarPieChartWidgetOptionsComponent>().tmp_selected_custom_filter)
    public async watch_tmp_custom_filter_dimension(): Promise<void> {
        if (!this.widget_options) return;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.dimension_custom_filter_name = this.tmp_selected_custom_filter;
        this.next_update_options.dimension_custom_filter_name = this.tmp_selected_custom_filter;
        await this.throttled_update_options();
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().page_widget, { immediate: true, deep: true })
    public async onchange_page_widget() {
        await this.set_palette_options();
        await this.throttled_reload_options();
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().widget_options)
    public async onchange_widget_options() {
        await this.set_palette_options();
        await this.throttled_reload_options();
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().tmp_selected_var_name_2)
    public async onchange_tmp_selected_var_name_2() {
        if (!this.widget_options) return;
        if (!this.tmp_selected_var_name_2) {
            if (this.widget_options.var_id_2) {
                this.widget_options.var_id_2 = null;
                this.custom_filter_names_2 = {};
                this.widget_options.filter_custom_field_filters_2 = {};
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const selected_var_id_2: number = parseInt(this.tmp_selected_var_name_2.split(' | ')[0]);
            if (this.widget_options.var_id_2 != selected_var_id_2) {
                this.next_update_options = this.widget_options;
                this.next_update_options.var_id_2 = selected_var_id_2;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().tmp_selected_color_palette)
    public async onchange_tmp_selected_color_palette() {
        if (!this.widget_options) return;
        if (!this.tmp_selected_color_palette) {
            if (this.widget_options.color_palette) {
                this.widget_options.color_palette = null;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const selected_palette_index = this.color_palettes_labels.indexOf(this.tmp_selected_color_palette);
            const new_palette = this.color_palettes[selected_palette_index];
            if (this.widget_options.color_palette != new_palette) {
                this.next_update_options = this.widget_options;
                this.next_update_options.color_palette = new_palette;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().tmp_selected_var_name_1)
    public async onchange_tmp_selected_var_name_1() {
        if (!this.widget_options) return;
        if (!this.tmp_selected_var_name_1) {
            if (this.widget_options.var_id_1) {
                this.widget_options.var_id_1 = null;
                this.custom_filter_names_1 = {};
                this.widget_options.filter_custom_field_filters_1 = {};
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const selected_var_id_1: number = parseInt(this.tmp_selected_var_name_1.split(' | ')[0]);
            if (this.widget_options.var_id_1 != selected_var_id_1) {
                this.next_update_options = this.widget_options;
                this.next_update_options.var_id_1 = selected_var_id_1;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().tmp_selected_dimension_custom_filter_segment_type)
    public async onchange_tmp_selected_dimension_custom_filter_segment_type() {
        if (!this.widget_options) return;
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
            if (this.widget_options.dimension_custom_filter_segment_type != newType) {
                this.next_update_options = this.widget_options;
                this.next_update_options.dimension_custom_filter_segment_type = newType;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().tmp_selected_legend_position)
    public async onchange_tmp_selected_legend_position() {
        if (!this.widget_options) return;
        if (!this.tmp_selected_legend_position) {
            if (this.widget_options.legend_position) {
                this.widget_options.legend_position = null;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            if (this.widget_options.legend_position != this.tmp_selected_legend_position) {
                this.next_update_options = this.widget_options;
                this.next_update_options.legend_position = this.tmp_selected_legend_position;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().legend_font_size)
    public async onchange_legend_font_size() {
        if (!this.widget_options) return;
        if (!this.legend_font_size) {
            if (this.widget_options.legend_font_size) {
                this.widget_options.legend_font_size = 12;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            if (this.widget_options.legend_font_size != parseInt(this.legend_font_size)) {
                if (parseInt(this.legend_font_size) <= 100 && parseInt(this.legend_font_size) >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.legend_font_size = parseInt(this.legend_font_size);
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().legend_box_width)
    public async onchange_legend_box_width() {
        if (!this.widget_options) return;
        if (!this.legend_box_width) {
            if (this.widget_options.legend_box_width) {
                this.widget_options.legend_box_width = 40;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            if (this.widget_options.legend_box_width != parseInt(this.legend_box_width)) {
                const val = parseInt(this.legend_box_width);
                if (val <= 400 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.legend_box_width = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().legend_padding)
    public async onchange_legend_padding() {
        if (!this.widget_options) return;
        if (!this.legend_padding) {
            if (this.widget_options.legend_padding) {
                this.widget_options.legend_padding = 10;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            if (this.widget_options.legend_padding != parseInt(this.legend_padding)) {
                const val = parseInt(this.legend_padding);
                if (val <= 100 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.legend_padding = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().title_font_size)
    public async onchange_title_font_size() {
        if (!this.widget_options) return;
        if (!this.title_font_size) {
            if (this.widget_options.title_font_size) {
                this.widget_options.title_font_size = 16;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const val = parseInt(this.title_font_size);
            if (this.widget_options.title_font_size != val) {
                if (val <= 100 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.title_font_size = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().title_padding)
    public async onchange_title_padding() {
        if (!this.widget_options) return;
        if (!this.title_padding) {
            if (this.widget_options.title_padding) {
                this.widget_options.title_padding = 10;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const val = parseInt(this.title_padding);
            if (this.widget_options.title_padding != val) {
                if (val <= 100 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.title_padding = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().cutout_percentage)
    public async onchange_cutout_percentage() {
        if (!this.widget_options) return;
        if (!this.cutout_percentage) {
            if (this.widget_options.cutout_percentage) {
                this.widget_options.cutout_percentage = 50;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const val = parseInt(this.cutout_percentage);
            if (this.widget_options.cutout_percentage != val) {
                if (val <= 95 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.cutout_percentage = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().rotation)
    public async onchange_rotation() {
        if (!this.widget_options) return;
        if (!this.rotation) {
            if (this.widget_options.rotation) {
                this.widget_options.rotation = 270;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const val = parseInt(this.rotation);
            if (this.widget_options.rotation != val) {
                if (val <= 360 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.rotation = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().circumference)
    public async onchange_circumference() {
        if (!this.widget_options) return;
        if (!this.circumference) {
            if (this.widget_options.circumference) {
                this.widget_options.circumference = 180;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const val = parseInt(this.circumference);
            if (this.widget_options.circumference != val) {
                if (val <= 360 && val >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.circumference = val;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().border_width_1)
    public async onchange_border_width_1() {
        if (!this.widget_options) return;
        if (!this.border_width_1) {
            if (this.widget_options.border_width_1) {
                this.widget_options.border_width_1 = null;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            if (this.widget_options.border_width_1 != this.border_width_1) {
                if (this.border_width_1 <= 10 && this.border_width_1 >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.border_width_1 = this.border_width_1;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().border_width_2)
    public async onchange_border_width_2() {
        if (!this.widget_options) return;
        if (!this.border_width_2) {
            if (this.widget_options.border_width_2) {
                this.widget_options.border_width_2 = null;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            if (this.widget_options.border_width_2 != this.border_width_2) {
                if (this.border_width_2 <= 10 && this.border_width_2 >= 0) {
                    this.next_update_options = this.widget_options;
                    this.next_update_options.border_width_2 = this.border_width_2;
                }
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch(reflect<VarPieChartWidgetOptionsComponent>().max_dimension_values)
    public async onchange_max_dimension_values() {
        if (!this.widget_options) return;
        if (!this.max_dimension_values) {
            if (this.widget_options.max_dimension_values) {
                this.widget_options.max_dimension_values = 10;
                await this.throttled_update_options();
            }
            return;
        }
        try {
            const val = parseInt(this.max_dimension_values);
            if (this.widget_options.max_dimension_values != val) {
                if (this.widget_options.dimension_is_vo_field_ref) {
                    if (val >= 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = val;
                    }
                    await this.throttled_update_options();
                } else {
                    if (val > 0) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = val;
                    } else {
                        this.snotify.error('Un custom filter doit avoir un maximum de valeurs à afficher supérieur à 0');
                        this.next_update_options = this.widget_options;
                        this.next_update_options.max_dimension_values = 10;
                    }
                    await this.throttled_update_options();
                }
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
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

    // --------------------------------------------------------------------------
    // Méthodes "utils"
    // --------------------------------------------------------------------------

    /**
     * Toggle l'ouverture d'une section => on inverse la valeur dans sectionsOpen
     */
    public toggleSection(sectionName: keyof typeof this.sectionsOpen) {
        this.sectionsOpen[sectionName] = !this.sectionsOpen[sectionName];
    }


    public async set_palette_options() {
        if (!this.widget_options) {
            return;
        }
        this.color_palettes_labels = await this.get_color_palettes_labels();
        this.bg_gradient = this.widget_options.color_palette ? false : true;
        this.tmp_selected_color_palette =
            !this.bg_gradient
                ? this.color_palettes_labels[this.searchIndexOfArray(this.widget_options.color_palette, this.color_palettes)]
                : null;
    }

    public async remove_dimension_vo_field_ref() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options || !this.next_update_options.dimension_vo_field_ref) {
            return null;
        }
        this.next_update_options.dimension_vo_field_ref = null;
        await this.throttled_update_options();
    }

    public async add_dimension_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        const dimension_vo_field_ref = new VOFieldRefVO();
        dimension_vo_field_ref.api_type_id = api_type_id;
        dimension_vo_field_ref.field_id = field_id;
        dimension_vo_field_ref.weight = 0;
        this.next_update_options.dimension_vo_field_ref = dimension_vo_field_ref;
        await this.throttled_update_options();
    }

    public async remove_sort_dimension_by_vo_field_ref() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options || !this.next_update_options.sort_dimension_by_vo_field_ref) {
            return null;
        }
        this.next_update_options.sort_dimension_by_vo_field_ref = null;
        await this.throttled_update_options();
    }

    public async add_sort_dimension_by_vo_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        const sort_dimension_by_vo_field_ref = new VOFieldRefVO();
        sort_dimension_by_vo_field_ref.api_type_id = api_type_id;
        sort_dimension_by_vo_field_ref.field_id = field_id;
        sort_dimension_by_vo_field_ref.weight = 0;
        this.next_update_options.sort_dimension_by_vo_field_ref = sort_dimension_by_vo_field_ref;
        await this.throttled_update_options();
    }

    public get_default_options(): VarPieChartWidgetOptionsVO {
        return VarPieChartWidgetOptionsVO.createDefault();
    }

    // Toggles divers

    public async switch_bg_gradient() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.bg_gradient = !this.next_update_options.bg_gradient;
        await this.throttled_update_options();
    }

    public async switch_legend_display() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.legend_display = !this.next_update_options.legend_display;
        await this.throttled_update_options();
    }

    public async switch_label_display() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.label_display = !this.next_update_options.label_display;
        await this.throttled_update_options();
    }

    public async switch_dimension_is_vo_field_ref() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.dimension_is_vo_field_ref = !this.next_update_options.dimension_is_vo_field_ref;
        await this.throttled_update_options();
    }

    public async switch_sort_dimension_by_asc() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.sort_dimension_by_asc = !this.next_update_options.sort_dimension_by_asc;
        await this.throttled_update_options();
    }

    public async switch_hide_filter() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.hide_filter = !this.next_update_options.hide_filter;
        await this.throttled_update_options();
    }

    public async switch_has_dimension() {
        if (!this.has_dimension) {
            this.snotify.error('Not implemented yet');
        }
    }

    public async switch_title_display() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.title_display = !this.next_update_options.title_display;
        await this.throttled_update_options();
    }

    public async switch_legend_use_point_style() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.legend_use_point_style = !this.next_update_options.legend_use_point_style;
        await this.throttled_update_options();
    }

    public async switch_max_is_sum_of_var_1_and_2() {
        this.next_update_options = this.widget_options;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.max_is_sum_of_var_1_and_2 = !this.next_update_options.max_is_sum_of_var_1_and_2;
        await this.throttled_update_options();
    }


    /**
     * Met à jour les couleurs => exécute un throttle de 800ms
     */
    public async update_colors() {
        if (!this.widget_options) {
            return;
        }
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.bg_color_1 = this.bg_color_1;
        this.next_update_options.bg_color_2 = this.bg_color_2;
        this.next_update_options.border_color_1 = this.border_color_1;
        this.next_update_options.border_color_2 = this.border_color_2;
        this.next_update_options.bg_color = this.bg_color;
        this.next_update_options.legend_font_color = this.legend_font_color;
        this.next_update_options.title_font_color = this.title_font_color;

        await this.throttled_update_options();
    }

    public async change_custom_filter_1(field_id: string, custom_filter: string) {
        if (!this.widget_options) return;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.custom_filter_names_1[field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters_1 = this.custom_filter_names_1;
        await this.throttled_update_options();
    }

    public async change_custom_filter_2(field_id: string, custom_filter: string) {
        if (!this.widget_options) return;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.custom_filter_names_2[field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters_2 = this.custom_filter_names_2;
        await this.throttled_update_options();
    }

    public async get_color_palettes_labels(): Promise<string[]> {
        const res: string[] = [];
        const query_res: DashboardGraphColorPaletteVO[] = await query(DashboardGraphColorPaletteVO.API_TYPE_ID).select_vos();
        for (const palette of query_res) {
            res.push(palette.name);
            this.color_palettes.push(palette);
        }
        return res;
    }

    /**
     * reload_options : recharge depuis page_widget.json_options
     */
    public reload_options() {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {
            let options: VarPieChartWidgetOptionsVO = null;
            try {
                if (this.page_widget.json_options) {
                    options = JSON.parse(this.page_widget.json_options) as VarPieChartWidgetOptionsVO;
                    if (this.widget_options &&
                        (this.widget_options.var_id_1 == options.var_id_1) &&
                        (this.widget_options.var_id_2 == options.var_id_2) &&
                        (this.widget_options.dimension_custom_filter_name == options.dimension_custom_filter_name) &&
                        (ObjectHandler.are_equal(this.widget_options.filter_custom_field_filters_1, options.filter_custom_field_filters_1)) &&
                        (ObjectHandler.are_equal(this.widget_options.filter_custom_field_filters_2, options.filter_custom_field_filters_2)) &&

                        (this.widget_options.legend_display == options.legend_display) &&
                        (this.widget_options.label_display == options.label_display) &&
                        (this.widget_options.legend_position == options.legend_position) &&
                        (this.widget_options.bg_color_1 == options.bg_color_1) &&
                        (this.widget_options.bg_color_2 == options.bg_color_2) &&
                        (this.widget_options.bg_colors == options.bg_colors) &&
                        (this.widget_options.bg_gradient == options.bg_gradient) &&
                        (this.widget_options.border_color_1 == options.border_color_1) &&
                        (this.widget_options.border_color_2 == options.border_color_2) &&
                        (this.widget_options.color_palette == options.color_palette) &&
                        (this.widget_options.bg_color == options.bg_color) &&
                        (this.widget_options.legend_font_color == options.legend_font_color) &&
                        (this.widget_options.title_font_color == options.title_font_color) &&
                        (this.widget_options.legend_font_size == options.legend_font_size) &&
                        (this.widget_options.legend_box_width == options.legend_box_width) &&
                        (this.widget_options.legend_padding == options.legend_padding) &&
                        (this.widget_options.legend_use_point_style == options.legend_use_point_style) &&
                        (this.widget_options.title_display == options.title_display) &&
                        (this.widget_options.title_font_size == options.title_font_size) &&
                        (this.widget_options.title_padding == options.title_padding) &&
                        (this.widget_options.cutout_percentage == options.cutout_percentage) &&
                        (this.widget_options.rotation == options.rotation) &&
                        (this.widget_options.circumference == options.circumference) &&
                        (this.widget_options.has_dimension == options.has_dimension) &&
                        (this.widget_options.max_dimension_values == options.max_dimension_values) &&
                        (this.widget_options.sort_dimension_by_vo_field_ref == options.sort_dimension_by_vo_field_ref) &&
                        (this.widget_options.sort_dimension_by_asc == options.sort_dimension_by_asc) &&
                        (this.widget_options.hide_filter == options.hide_filter) &&

                        (this.widget_options.dimension_is_vo_field_ref == options.dimension_is_vo_field_ref) &&
                        ObjectHandler.are_equal(this.widget_options.dimension_vo_field_ref, options.dimension_vo_field_ref) &&
                        (this.widget_options.dimension_custom_filter_name == options.dimension_custom_filter_name) &&
                        (this.widget_options.dimension_custom_filter_segment_type == options.dimension_custom_filter_segment_type) &&
                        (this.widget_options.border_width_1 == options.border_width_1) &&
                        (this.widget_options.border_width_2 == options.border_width_2) &&
                        (this.widget_options.max_is_sum_of_var_1_and_2 == options.max_is_sum_of_var_1_and_2) &&
                        (this.widget_options.filter_type == options.filter_type) &&
                        (this.widget_options.filter_additional_params == options.filter_additional_params)
                    ) {
                        options = null;
                    }

                    options = options ? new VarPieChartWidgetOptionsVO(
                        options.bg_color,
                        options.legend_display,
                        options.label_display,
                        options.legend_position,
                        options.legend_font_color,
                        options.legend_font_size,
                        options.legend_box_width,
                        options.legend_padding,
                        options.legend_use_point_style,
                        options.title_display,
                        options.title_font_color,
                        options.title_font_size,
                        options.title_padding,
                        options.cutout_percentage,
                        options.rotation,
                        options.circumference,
                        options.has_dimension,
                        options.max_dimension_values,
                        options.sort_dimension_by_vo_field_ref,
                        options.sort_dimension_by_asc,
                        options.dimension_is_vo_field_ref,
                        options.dimension_vo_field_ref,
                        options.dimension_custom_filter_name,
                        options.dimension_custom_filter_segment_type,
                        options.filter_type,
                        options.filter_additional_params,
                        options.var_id_1,
                        options.filter_custom_field_filters_1,
                        options.color_palette,
                        options.bg_colors,
                        options.bg_gradient,
                        options.bg_color_1,
                        options.border_color_1,
                        options.border_width_1,
                        options.var_id_2,
                        options.filter_custom_field_filters_2,
                        options.bg_color_2,
                        options.border_color_2,
                        options.border_width_2,
                        options.max_is_sum_of_var_1_and_2,
                        options.hide_filter,
                    ) : null;
                }
            } catch (error) {
                ConsoleHandler.error(error);
            }

            if ((!!options) && (!!this.page_widget.json_options)) {
                if (!ObjectHandler.are_equal(this.widget_options, options)) {
                    this.widget_options = options;
                }
            } else if ((!!this.widget_options) && !this.page_widget.json_options) {
                this.widget_options = null;
            }
        }

        if (!this.widget_options) {
            this.next_update_options = null;

            this.bg_color = null;

            this.legend_display = true;
            this.label_display = true;
            this.tmp_selected_legend_position = 'top';
            this.legend_font_color = '#666';
            this.legend_font_size = '12';
            this.legend_box_width = '40';
            this.legend_padding = '10';
            this.legend_use_point_style = false;

            this.title_display = false;
            this.title_font_color = '#666';
            this.title_font_size = '16';
            this.title_padding = '10';
            this.cutout_percentage = '10';
            this.rotation = '10';
            this.circumference = '360';

            this.has_dimension = true;
            this.max_dimension_values = '10';
            this.sort_dimension_by_asc = true;
            this.hide_filter = false;
            this.dimension_is_vo_field_ref = true;
            this.dimension_custom_filter_name = null;
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[0];

            this.tmp_selected_var_name_1 = null;
            this.custom_filter_names_1 = {};
            this.tmp_selected_color_palette = null;
            this.color_palettes = null;
            this.bg_colors = null;
            this.bg_gradient = false;
            this.bg_color_1 = null;
            this.border_color_1 = null;
            this.border_width_1 = 0;
            this.tmp_selected_var_name_2 = null;
            this.custom_filter_names_2 = {};
            this.bg_color_2 = null;
            this.border_color_2 = null;
            this.border_width_2 = 0;
            this.max_is_sum_of_var_1_and_2 = false;

            return;
        }

        if (this.legend_display != this.widget_options.legend_display) {
            this.legend_display = this.widget_options.legend_display;
        }
        if (this.label_display != this.widget_options.label_display) {
            this.label_display = this.widget_options.label_display;
        }
        if (((!this.widget_options.legend_font_size) && this.legend_font_size) || (this.widget_options.legend_font_size && (this.legend_font_size != this.widget_options.legend_font_size.toString()))) {
            this.legend_font_size = this.widget_options.legend_font_size ? this.widget_options.legend_font_size.toString() : null;
        }
        if (((!this.widget_options.legend_box_width) && this.legend_box_width) || (this.widget_options.legend_box_width && (this.legend_box_width != this.widget_options.legend_box_width.toString()))) {
            this.legend_box_width = this.widget_options.legend_box_width ? this.widget_options.legend_box_width.toString() : null;
        }
        if (((!this.widget_options.legend_padding) && this.legend_padding) || (this.widget_options.legend_padding && (this.legend_padding != this.widget_options.legend_padding.toString()))) {
            this.legend_padding = this.widget_options.legend_padding ? this.widget_options.legend_padding.toString() : null;
        }
        if (this.legend_use_point_style != this.widget_options.legend_use_point_style) {
            this.legend_use_point_style = this.widget_options.legend_use_point_style;
        }

        if (this.title_display != this.widget_options.title_display) {
            this.title_display = this.widget_options.title_display;
        }
        if (((!this.widget_options.title_font_size) && this.title_font_size) || (this.widget_options.title_font_size && (this.title_font_size != this.widget_options.title_font_size.toString()))) {
            this.title_font_size = this.widget_options.title_font_size ? this.widget_options.title_font_size.toString() : null;
        }
        if (((!this.widget_options.title_padding) && this.title_padding) || (this.widget_options.title_padding && (this.title_padding != this.widget_options.title_padding.toString()))) {
            this.title_padding = this.widget_options.title_padding ? this.widget_options.title_padding.toString() : null;
        }
        if (((!this.widget_options.cutout_percentage) && this.cutout_percentage) || (this.widget_options.cutout_percentage && (this.cutout_percentage != this.widget_options.cutout_percentage.toString()))) {
            this.cutout_percentage = this.widget_options.cutout_percentage ? this.widget_options.cutout_percentage.toString() : null;
        }
        if (((!this.widget_options.rotation) && this.rotation) || (this.widget_options.rotation && (this.rotation != this.widget_options.rotation.toString()))) {
            this.rotation = this.widget_options.rotation ? this.widget_options.rotation.toString() : null;
        }
        if (((!this.widget_options.circumference) && this.circumference) || (this.widget_options.circumference && (this.circumference != this.widget_options.circumference.toString()))) {
            this.circumference = this.widget_options.circumference ? this.widget_options.circumference.toString() : null;
        }

        if (this.has_dimension != this.widget_options.has_dimension) {
            this.has_dimension = this.widget_options.has_dimension;
        }
        if (((!this.widget_options.max_dimension_values) && this.max_dimension_values) || (this.widget_options.max_dimension_values && (this.max_dimension_values != this.widget_options.max_dimension_values.toString()))) {
            this.max_dimension_values = this.widget_options.max_dimension_values ? this.widget_options.max_dimension_values.toString() : null;
        }
        if (this.sort_dimension_by_asc != this.widget_options.sort_dimension_by_asc) {
            this.sort_dimension_by_asc = this.widget_options.sort_dimension_by_asc;
        }
        if (this.hide_filter != this.widget_options.hide_filter) {
            this.hide_filter = this.widget_options.hide_filter;
        }
        if (this.dimension_is_vo_field_ref != this.widget_options.dimension_is_vo_field_ref) {
            this.dimension_is_vo_field_ref = this.widget_options.dimension_is_vo_field_ref;
        }
        if (this.dimension_custom_filter_name != this.widget_options.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.widget_options.dimension_custom_filter_name;
        }

        if (((!this.widget_options.border_width_1) && this.border_width_1) || (this.widget_options.border_width_1 && (this.border_width_1 != this.widget_options.border_width_1))) {
            this.border_width_1 = this.widget_options.border_width_1 ? this.widget_options.border_width_1 : null;
        }
        if (((!this.widget_options.border_width_2) && this.border_width_2) || (this.widget_options.border_width_2 && (this.border_width_2 != this.widget_options.border_width_2))) {
            this.border_width_2 = this.widget_options.border_width_2 ? this.widget_options.border_width_2 : null;
        }
        if (this.max_is_sum_of_var_1_and_2 != this.widget_options.max_is_sum_of_var_1_and_2) {
            this.max_is_sum_of_var_1_and_2 = this.widget_options.max_is_sum_of_var_1_and_2;
        }

        if (this.tmp_selected_legend_position != this.widget_options.legend_position) {
            this.tmp_selected_legend_position = this.widget_options.legend_position;
        }
        if (this.get_dimension_custom_filter_segment_type_from_selected_option(this.tmp_selected_dimension_custom_filter_segment_type) != this.widget_options.dimension_custom_filter_segment_type) {
            this.tmp_selected_dimension_custom_filter_segment_type = this.dimension_custom_filter_segment_types[this.widget_options.dimension_custom_filter_segment_type];
        }

        if (this.tmp_selected_var_name_1 != (this.widget_options.var_id_1 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_1)))) {
            this.tmp_selected_var_name_1 = this.widget_options.var_id_1 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_1));
        }
        if (this.tmp_selected_var_name_2 != (this.widget_options.var_id_2 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_2)))) {
            this.tmp_selected_var_name_2 = this.widget_options.var_id_2 + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id_2));
        }
        if (this.custom_filter_names_1 != (this.widget_options.filter_custom_field_filters_1 ? cloneDeep(this.widget_options.filter_custom_field_filters_1) : {})) {
            this.custom_filter_names_1 = this.widget_options.filter_custom_field_filters_1 ? cloneDeep(this.widget_options.filter_custom_field_filters_1) : {};
        }
        if (this.custom_filter_names_2 != (this.widget_options.filter_custom_field_filters_2 ? cloneDeep(this.widget_options.filter_custom_field_filters_2) : {})) {
            this.custom_filter_names_2 = this.widget_options.filter_custom_field_filters_2 ? cloneDeep(this.widget_options.filter_custom_field_filters_2) : {};
        }
        if (this.dimension_custom_filter_name != this.widget_options.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.widget_options.dimension_custom_filter_name;
        }
        if (this.tmp_selected_color_palette != this.color_palettes_labels[this.searchIndexOfArray(this.widget_options.color_palette, this.color_palettes)]) {
            this.tmp_selected_color_palette = this.color_palettes_labels[this.searchIndexOfArray(this.widget_options.color_palette, this.color_palettes)];
        }
        if (this.bg_colors != this.widget_options.bg_colors) {
            this.bg_colors = this.widget_options.bg_colors;
        }
        if (this.bg_gradient != this.widget_options.bg_gradient) {
            this.bg_gradient = this.widget_options.bg_gradient;
        }
        if (this.bg_color_1 != this.widget_options.bg_color_1) {
            this.bg_color_1 = this.widget_options.bg_color_1;
        }
        if (this.bg_color_2 != this.widget_options.bg_color_2) {
            this.bg_color_2 = this.widget_options.bg_color_2;
        }
        if (this.border_color_1 != this.widget_options.border_color_1) {
            this.border_color_1 = this.widget_options.border_color_1;
        }
        if (this.border_color_2 != this.widget_options.border_color_2) {
            this.border_color_2 = this.widget_options.border_color_2;
        }
        if (this.bg_color != this.widget_options.bg_color) {
            this.bg_color = this.widget_options.bg_color;
        }
        if (this.legend_font_color != this.widget_options.legend_font_color) {
            this.legend_font_color = this.widget_options.legend_font_color;
        }
        if (this.title_font_color != this.widget_options.title_font_color) {
            this.title_font_color = this.widget_options.title_font_color;
        }

        if (this.next_update_options != this.widget_options) {
            this.next_update_options = this.widget_options;
        }
    }

    public get_dimension_custom_filter_segment_type_from_selected_option(selected_option: string): number {
        if (this.dimension_custom_filter_segment_types) {
            for (const key in Object.keys(this.dimension_custom_filter_segment_types)) {
                const dictKey = Object.keys(this.dimension_custom_filter_segment_types)[key];
                if (this.dimension_custom_filter_segment_types[dictKey] == selected_option) {
                    const res = parseInt(dictKey);
                    return res >= 0 ? res : null;
                }
            }
            return null;
        }
    }

    public searchIndexOfArray(target: any, source: any): number {
        for (let i = 0; i <= source.length; i++) {
            if (JSON.stringify(target) === JSON.stringify(source[i])) {
                return i;
            }
        }
        return -1;
    }

    public async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);
        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    public async update_title_name_code_text() {
        if (!this.widget_options) {
            return;
        }
        await this.throttled_update_options();
    }

    public async update_additional_options(additional_options: string) {
        if (!this.widget_options) return;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.filter_additional_params = additional_options;
        await this.throttled_update_options();
    }

    public async update_filter_type(filter_type: string) {
        if (!this.widget_options) return;
        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.filter_type = filter_type;
        await this.throttled_update_options();
    }
}
