import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

import VarChartOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';

import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';

import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import VarChartScalesOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';

import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import './VarChartOptionsItemComponent.scss';

@Component({
    template: require('./VarChartOptionsItemComponent.pug'),
    components: {
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
    }
})
export default class VarChartOptionsItemComponent extends VueComponentBase {

    @Prop({ default: () => new Object(), type: Object })
    private options!: VarChartOptionsVO;

    @Prop({ default: true })
    private detailed!: boolean;

    @Prop({ default: null })
    private page_widget!: DashboardPageWidgetVO;

    @Prop({ default: null })
    private index: number;

    @Prop({ default: null })
    private fields_that_could_get_scales_filter!: VarChartScalesOptionsVO[];

    @Prop({ default: false })
    private use_palette!: boolean;

    // Store
    @Prop({ default: null })
    private get_custom_filters!: string[];

    /**
     * Prop :sectionsOpen => { graphicalOptions: boolean; filterOptions: boolean }
     */
    @Prop({ default: () => ({ graphicalOptions: false, filterOptions: false }) })
    private sectionsOpen!: { graphicalOptions: boolean; filterOptions: boolean };

    /**
     * Copie locale des options
     */
    private options_props: VarChartOptionsVO | null = null;

    /**
     * Copie locale de sectionsOpen
     */
    private localSectionsOpen: { graphicalOptions: boolean; filterOptions: boolean } = {
        graphicalOptions: false,
        filterOptions: false
    };

    // Champs
    private selected_var_name: string | null = null;
    private custom_filter_names: { [field_id: string]: string } = {};
    private scale_filter_names: string[] = [];
    private selected_filter_name: string | null = null;
    private selected_filter_id: number | null = null;
    private chart_id: number | null = null;
    private var_id: number | null = null;
    private type: string = 'line';
    private bg_color: string = '#666';
    private border_color: string = '#666';
    private border_width: number = 0;
    private value_label_size: number = 18;
    private has_gradient: boolean = false;
    private show_values: boolean = false;
    private show_zeros: boolean = true;
    private filter_type: string = '';
    private filter_additional_params: string = '';

    // Listes de choix
    private graph_types: string[] = ['line', 'bar'];

    private scale_types_options: string[] = [
        'linear',
        'logarithmic',
        'category',
        'time',
        'radialLinear'
    ];
    private legend_positions: string[] = ['top', 'left', 'bottom', 'right'];

    /**
     * Throttle pour émettre le changement
     */
    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(
        'VarChartOptionsItemComponent.throttled_emit_changes',
        this.emit_change.bind(this),
        50,
        false
    );

    // --------------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------------

    /**
     * var_names : liste de variables
     */
    get var_names(): string[] {
        const res: string[] = [];
        for (const i in VarsController.var_conf_by_name) {
            const var_conf = VarsController.var_conf_by_name[i];
            res.push(var_conf.id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(var_conf.id)));
        }
        res.sort((a, b) => {
            const a_ = a.split(' | ')[1];
            const b_ = b.split(' | ')[1];
            return a_.localeCompare(b_);
        });
        return res;
    }

    /**
     * fields_that_could_get_custom_filter : ex. date ranges, hourrange
     */
    get fields_that_could_get_custom_filter(): string[] | null {
        if (!this.var_id || !VarsController.var_conf_by_id[this.var_id]) {
            return null;
        }
        const var_param_type = VarsController.var_conf_by_id[this.var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }
        if (!this.custom_filter_names) {
            this.custom_filter_names = {};
        }
        const fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        const res: string[] = [];
        for (const field of fields) {
            if (
                field.field_type === ModuleTableFieldVO.FIELD_TYPE_tstzrange_array ||
                field.field_type === ModuleTableFieldVO.FIELD_TYPE_hourrange_array
            ) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names[field.field_id] === 'undefined') {
                    this.custom_filter_names[field.field_id] = '';
                }
            }
        }
        return res;
    }

    // --------------------------------------------------------------------------
    // WATCHERS
    // --------------------------------------------------------------------------

    @Watch('sectionsOpen', { immediate: true, deep: true })
    private onPropSectionsOpenChanged() {
        this.localSectionsOpen = cloneDeep(this.sectionsOpen);
    }

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (isEqual(this.options_props, this.options)) {
            return;
        }
        // Mise à jour des champs
        for (const key in this.options) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                (this as any)[key] = (this.options as any)[key];
            }
        }
        // Remplit selected_var_name
        if (this.var_id) {
            const label = this.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.var_id));
            if (this.selected_var_name !== label) {
                this.selected_var_name = label;
            }
        }
        if (!this.detailed) {
            this.border_width = 0;
        }
        this.options_props = this.options;
        this.selected_filter_name = this.options_props.selected_filter_name || null;
    }

    @Watch('selected_var_name')
    private async on_change_selected_var_name() {
        if (!this.selected_var_name) {
            this.var_id = null;
            await this.throttled_emit_changes();
            return;
        }
        try {
            const selected_var_id = parseInt(this.selected_var_name.split(' | ')[0]);
            if (this.var_id !== selected_var_id) {
                this.var_id = selected_var_id;
                await this.throttled_emit_changes();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('type')
    private async on_change_type() {
        await this.throttled_emit_changes();
    }
    @Watch('bg_color')
    private async on_change_bg_color() {
        await this.throttled_emit_changes();
    }
    @Watch('border_color')
    private async on_change_border_color() {
        await this.throttled_emit_changes();
    }
    @Watch('border_width')
    private async on_change_border_width() {
        await this.throttled_emit_changes();
    }
    @Watch('value_label_size')
    private async on_change_value_label_size() {
        if (this.value_label_size < 0) {
            this.value_label_size = 0;
        }
        if (this.value_label_size > 35) {
            this.value_label_size = 35;
        }
        await this.throttled_emit_changes();
    }

    @Watch('selected_filter_name')
    private async change_selected_filter_name() {
        if (this.fields_that_could_get_scales_filter?.[this.scale_filter_names.indexOf(this.selected_filter_name!)]) {
            this.selected_filter_id = this.fields_that_could_get_scales_filter[
                this.scale_filter_names.indexOf(this.selected_filter_name!)
            ].chart_id;
        }
        await this.throttled_emit_changes();
    }

    @Watch('fields_that_could_get_scales_filter', { immediate: true, deep: true })
    private async on_change_fields_that_could_get_scales_filter() {
        if (!this.fields_that_could_get_scales_filter) {
            return;
        }
        const res: string[] = [];
        for (const [index, scale_options] of this.fields_that_could_get_scales_filter.entries()) {
            const so = new VarChartScalesOptionsVO().from(scale_options);
            const codeText = so.get_title_name_code_text(this.page_widget_id, so.chart_id);
            const translation = this.t(codeText);
            if (translation && translation !== codeText) {
                res.push(translation);
            } else {
                res.push(`Ordonnée #${index + 1}`);
            }
        }
        this.scale_filter_names = res;
        await this.throttled_emit_changes();
    }

    public async created() {
        if (!this.chart_id) {
            this.chart_id = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        }
    }

    // --------------------------------------------------------------------------
    // Méthodes
    // --------------------------------------------------------------------------

    private async on_change_gradient() {
        this.has_gradient = !this.has_gradient;
        await this.throttled_emit_changes();
    }
    private async switch_show_values() {
        this.show_values = !this.show_values;
        await this.throttled_emit_changes();
    }
    private async switch_show_zeros() {
        this.show_zeros = !this.show_zeros;
        await this.throttled_emit_changes();
    }
    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        await this.throttled_emit_changes();
    }
    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        await this.throttled_emit_changes();
    }
    /**
     * Ajout d'un custom_filter sur un champ
     */
    private async change_custom_filter(field_id: string, custom_filter: string) {
        const copy = cloneDeep(this.custom_filter_names);
        copy[field_id] = custom_filter;
        this.custom_filter_names = copy;
        await this.throttled_emit_changes();
    }

    /**
     * Permet de récupérer la traduction du type
     * @param type
     * @returns
     */
    private get_type_label(type: string) {
        return this.label(`var_chart_options_item_component.graph_type.${type}`);
    }

    /**
     * Toggle l'ouverture/fermeture d'une section
     */
    private toggleSection(sectionName: 'graphicalOptions' | 'filterOptions') {
        this.localSectionsOpen[sectionName] = !this.localSectionsOpen[sectionName];
        this.$emit('update-sections-open', cloneDeep(this.localSectionsOpen));
    }

    /**
     * Émission du changement
     */
    private async emit_change() {
        if (!this.options_props) {
            return;
        }
        // Màj
        this.options_props.chart_id = this.chart_id!;
        this.options_props.var_id = this.var_id!;
        this.options_props.type = this.type;
        this.options_props.bg_color = this.bg_color;
        this.options_props.border_color = this.border_color;
        this.options_props.border_width = this.border_width;
        this.options_props.value_label_size = this.value_label_size;
        this.options_props.custom_filter_names = this.custom_filter_names;
        this.options_props.has_gradient = this.has_gradient;
        this.options_props.show_values = this.show_values;
        this.options_props.show_zeros = this.show_zeros;
        this.options_props.filter_additional_params = this.filter_additional_params;
        this.options_props.filter_type = this.filter_type;
        this.options_props.selected_filter_id = this.selected_filter_id!;
        this.options_props.selected_filter_name = this.selected_filter_name!;

        this.$emit('on_change', this.options_props);
    }
}
