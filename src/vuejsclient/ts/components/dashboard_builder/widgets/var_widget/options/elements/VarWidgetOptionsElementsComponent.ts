import { Scale } from "chart.js";
import { isEqual } from "lodash";
import { Component, Prop, Watch } from "vue-property-decorator";
import VarChartScalesOptionsVO from "../../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO";
import ThrottleHelper from "../../../../../../../../shared/tools/ThrottleHelper";
import VueComponentBase from "../../../../../VueComponentBase";
import './VarWidgetOptionsElementsComponent.scss';
import VarWidgetOptionsElementsVO from "../../../../../../../../shared/modules/DashboardBuilder/vos/VarWidgetOptionsElementsVO";
import WidgetFilterOptionsComponent from "../filters/WidgetFilterOptionsComponent";

@Component({
    template: require('./VarWidgetOptionsElementsComponent.pug'),
    components: {
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
    }
})
export default class VarWidgetOptionsElementsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: null })
    private element: VarWidgetOptionsElementsVO;

    private var_id: number = null;
    private filter_type: string = null;
    private filter_additional_params: string = null;
    private selected_position: string = null;
    private style: object = null;
    private positions = ['top', 'right', 'bottom', 'left'];
    private current_element: VarWidgetOptionsElementsVO = null;
    private id: number = null;

    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(this.emit_change.bind(this), 50, { leading: false, trailing: true });


    @Watch('element', { immediate: true, deep: true })
    private on_input_element_changed() {
        if (isEqual(this.element, this.current_element)) {
            return;
        }

        this.current_element = this.element ? new VarWidgetOptionsElementsVO().from(this.element) : null
    }

    @Watch('current_element', { immediate: true, deep: true })
    private async on_input_current_element_changed() {
        if (!this.current_element) {
            return;
        }

        if (this.id != this.current_element.id) {
            this.id = this.current_element.id;
        }

        if (this.filter_type != this.current_element.filter_type) {
            this.filter_type = this.current_element.filter_type;
        }

        if (this.filter_additional_params != this.current_element.filter_additional_params) {
            this.filter_additional_params = this.current_element.filter_additional_params;
        }

        if (this.style != this.current_element.style) {
            this.style = this.current_element.style;
        }

        if (this.var_id != this.current_element.var_id) {
            this.var_id = this.current_element.var_id;
        }

        if (this.selected_position != this.current_element.selected_position) {
            this.selected_position = this.current_element.selected_position;
        }
    }

    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        await this.throttled_emit_changes();
    }

    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        await this.throttled_emit_changes();
    }

    private async update_style(style: object) {
        this.style = style;
        await this.throttled_emit_changes();
    }

    private async update_var_id(var_id: number) {
        this.var_id = var_id;
        await this.throttled_emit_changes();
    }

    @Watch('selected_position')
    private async handle_selected_position_change() {
        await this.throttled_emit_changes();
    }

    private async emit_change() {
        // Set up all params fields
        this.current_element.page_widget_id = this.page_widget_id;
        this.current_element.var_id = this.var_id; // To load the var data
        this.current_element.filter_additional_params = this.filter_additional_params;
        this.current_element.filter_type = this.filter_type;
        this.current_element.selected_position = this.selected_position;
        this.current_element.style = this.style;
        this.current_element.id = this.id;
        this.$emit('on_change', this.current_element);
    }
}
