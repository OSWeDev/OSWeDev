import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { cloneDeep, isEqual } from 'lodash';

import VarChartScalesOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';

import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import ChartJsScaleOptionsComponent from '../../../../chartjs/scale_options/ChartJsScaleOptionsComponent';
import WidgetFilterOptionsComponent from '../../var_widget/options/filters/WidgetFilterOptionsComponent';

import { Scale } from 'chart.js';
import './VarChartScalesOptionsItemComponent.scss';

@Component({
    template: require('./VarChartScalesOptionsItemComponent.pug'),
    components: {
        Chartjsscaleoptionscomponent: ChartJsScaleOptionsComponent,
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VarChartScalesOptionsItemComponent extends VueComponentBase {

    // -------------------------------------------------------------------------
    // Props
    // -------------------------------------------------------------------------
    @Prop({ default: () => new VarChartScalesOptionsVO(), type: Object })
    private options!: VarChartScalesOptionsVO;

    @Prop({ default: null })
    private page_widget_id!: number;

    @Prop({ default: false })
    private detailed!: boolean;

    @Prop({ default: null })
    private get_var_name_code_text?: (page_widget_id: number, var_id: number, chart_id: number) => string;

    /**
     * sectionsOpen = { scaleOptions: boolean, filterOptions: boolean }
     */
    @Prop({ default: () => ({ scaleOptions: false, filterOptions: false }) })
    private sectionsOpen: { scaleOptions: boolean; filterOptions: boolean };


    // -------------------------------------------------------------------------
    // Données internes
    // -------------------------------------------------------------------------

    /**
     * localSectionsOpen : copie locale
     */
    private localSectionsOpen: { scaleOptions: boolean; filterOptions: boolean } = {
        scaleOptions: false,
        filterOptions: false
    };



    /**
     * Copie locale de l'option, pour éviter de muter directement la prop
     */
    private options_props: VarChartScalesOptionsVO | null = null;


    // Valeurs bindées
    private show_scale_title: boolean = true;
    private scale_options: Partial<Scale> = null;
    private filter_type: string = '';
    private filter_additional_params: string = '';
    private scale_position: string[] = [ 'left', 'right' ];
    private selected_position: string = 'left';
    private stacked: boolean = false;
    private fill: boolean = false;

    /**
     * Throttle l'émission d'un event "on_change"
     */
    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(
        'VarChartScalesOptionsItemComponent.throttled_emit_changes',
        this.emit_change.bind(this),
        50,
        false
    );

    // -------------------------------------------------------------------------
    // Computed
    // -------------------------------------------------------------------------

    /**
     * chart_id local
     */
    get chart_id(): number {
        if (!this.options_props?.chart_id) {
            // fallback
            return Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        }
        return this.options_props.chart_id;
    }

    /**
     * Titre "code text" => pour InlineTranslatableText
     */
    get title_code_text(): string {
        if (!this.options_props) {
            return null;
        }
        return this.options_props.get_title_name_code_text(this.page_widget_id, this.chart_id);
    }

    // -------------------------------------------------------------------------
    // Watchers
    // -------------------------------------------------------------------------

    @Watch('options', { immediate: true, deep: true })
    private on_input_options_changed() {
        if (!this.options) {
            this.options_props = null;
            return;
        }
        // Si c'est déjà pareil, on ne fait rien
        if (isEqual(this.options_props, this.options)) {
            return;
        }
        // Sinon, on copie dans this.options_props
        this.options_props = new VarChartScalesOptionsVO().from(this.options);
    }

    @Watch('options_props', { immediate: true, deep: true })
    private async on_input_options_props_changed() {
        if (!this.options_props) {
            return;
        }
        // Mettre à jour les champs internes
        if (this.filter_type !== this.options_props.filter_type) {
            this.filter_type = this.options_props.filter_type || '';
        }
        if (this.filter_additional_params !== this.options_props.filter_additional_params) {
            this.filter_additional_params = this.options_props.filter_additional_params || '';
        }

        if (this.show_scale_title !== this.options_props.show_scale_title) {
            this.show_scale_title = !!this.options_props.show_scale_title;
        }
        if (!isEqual(this.scale_options, this.options_props.scale_options)) {
            this.scale_options = this.options_props.scale_options;
        }
        if (this.selected_position !== this.options_props.selected_position) {
            this.selected_position = this.options_props.selected_position;
        }
        if (this.stacked !== this.options_props.stacked) {
            this.stacked = !!this.options_props.stacked;
        }
        if (this.fill !== this.options_props.fill) {
            this.fill = !!this.options_props.fill;
        }
    }

    /**
     * On synchronise localSectionsOpen avec sectionsOpen
     */
    @Watch('sectionsOpen', { immediate: true, deep: true })
    private onPropSectionsOpenChanged() {
        this.localSectionsOpen = cloneDeep(this.sectionsOpen);
    }


    // -------------------------------------------------------------------------
    // Méthodes
    // -------------------------------------------------------------------------

    /**
     * Toggle l'ouverture d'une section
     */
    private toggleSection(sectionName: 'scaleOptions' | 'filterOptions') {
        this.localSectionsOpen[sectionName] = !this.localSectionsOpen[sectionName];
        this.$emit('update-sections-open', cloneDeep(this.localSectionsOpen));
    }

    private async switch_show_scale_title() {
        this.show_scale_title = !this.show_scale_title;
        await this.throttled_emit_changes();
    }
    private async switch_stacked() {
        this.stacked = !this.stacked;
        await this.throttled_emit_changes();
    }
    private async switch_fill() {
        this.fill = !this.fill;
        await this.throttled_emit_changes();
    }

    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        await this.throttled_emit_changes();
    }
    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        await this.throttled_emit_changes();
    }

    /**
     * handle_scale_options_change
     * => callback (de ChartJsScaleOptionsComponent)
     */
    private async handle_scale_options_change(options: Partial<Scale>) {
        this.scale_options = options;
        // On n'émet que si on a un type
        if (this.scale_options && this.scale_options.type !== '') {
            await this.throttled_emit_changes();
        }
    }

    private async handle_scale_position_change(position: string) {
        this.selected_position = position;
        await this.throttled_emit_changes();
    }

    /**
     * Permet de récupérer la traduction de la position de l'axe
     * @param position
     * @returns
     */
    private get_scale_position_label(position: string) {
        return this.label(`var_chart_scales_options_item_component.separator.scale_position.${position}`);
    }

    /**
     * Emet "on_change" en passant l'objet complet
     */
    private emit_change() {
        if (!this.options_props) {
            return;
        }
        this.options_props.page_widget_id = this.page_widget_id;
        this.options_props.chart_id = this.chart_id;
        this.options_props.filter_additional_params = this.filter_additional_params;
        this.options_props.filter_type = this.filter_type;
        this.options_props.show_scale_title = this.show_scale_title;
        this.options_props.scale_options = this.scale_options;
        this.options_props.selected_position = this.selected_position;
        this.options_props.stacked = this.stacked;
        this.options_props.fill = this.fill;

        this.$emit('on_change', this.options_props);
    }
}
