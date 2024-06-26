import { Scale } from "chart.js";
import { cloneDeep, forEach, isEqual } from "lodash";
import { Component, Prop, Watch } from "vue-property-decorator";
import VarChartScalesOptionsVO from "../../../../../../../../shared/modules/DashboardBuilder/vos/VarChartScalesOptionsVO";
import ThrottleHelper from "../../../../../../../../shared/tools/ThrottleHelper";
import VueComponentBase from "../../../../../VueComponentBase";
import './VarWidgetOptionsElementsComponent.scss';
import VarWidgetOptionsElementsVO from "../../../../../../../../shared/modules/DashboardBuilder/vos/VarWidgetOptionsElementsVO";
import WidgetFilterOptionsComponent from "../filters/WidgetFilterOptionsComponent";
import VarsController from "../../../../../../../../shared/modules/Var/VarsController";
import VarDataBaseVO from "../../../../../../../../shared/modules/Var/vos/VarDataBaseVO";
import ModuleVar from "../../../../../../../../shared/modules/Var/ModuleVar";
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from "../../../../page/DashboardPageStore";
import FieldFiltersVO from "../../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";
import ContextFilterVO from "../../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO";
import ObjectHandler from "../../../../../../../../shared/tools/ObjectHandler";
import ModuleTableController from "../../../../../../../../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldVO from "../../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import InlineTranslatableText from "../../../../../InlineTranslatableText/InlineTranslatableText";
import { ConditionStatement } from "../../../../../../../../shared/tools/ConditionHandler";

@Component({
    template: require('./VarWidgetOptionsElementsComponent.pug'),
    components: {
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class VarWidgetOptionsElementsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget_id: number;

    @Prop({ default: null })
    private element: VarWidgetOptionsElementsVO;

    @Prop({ default: null })
    private elements_array: VarWidgetOptionsElementsVO[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    @ModuleDashboardPageAction
    private set_custom_filters: (custom_filters: string[]) => void;

    private var_id: number = null;
    private filter_type: string = null;
    private filter_additional_params: string = null;
    private selected_position: string = null;
    private style: object = null;
    private positions = ['top', 'right', 'bottom', 'left'];
    private current_element: VarWidgetOptionsElementsVO = null;
    private id: number = null;
    private custom_filter_names: { [field_id: string]: string } = {};
    private types: string[] = ['icon', 'var', 'title'];
    private selected_type: string = null;
    private selected_var_name: string = null;
    private tmp_selected_var_name: string = null;
    private icon_text: string = null;
    private var_params: VarDataBaseVO = null;
    private filter_custom_field_filters: { [field_id: string]: string } = null;
    private custom_filter_name: string = null;
    private show_title: boolean = false;
    private title_bg_color: string = null;
    private title_text_color: string = null;
    private title_font_size: number = null;
    private title_position: string = null;
    private text_positions = ['center', 'right', 'left'];
    private icon_size: number = null;
    private dimension_custom_filter_name: string = null;
    private conditional_colors: Array<{ value: string, condition: string, color: { bg: string, text: string }, targets: VarWidgetOptionsElementsVO[] }> = [];
    private selectionable_color_conditions: Array<{ value: string, label: string }> = [];
    private selectionable_elements: Array<VarWidgetOptionsElementsVO> = [];
    private hide_options: boolean = false;
    private throttled_update_conditional_colors = ThrottleHelper.declare_throttle_without_args(
        this.update_conditional_colors.bind(this),
        800,
        { leading: false, trailing: true }
    );
    private throttled_emit_changes = ThrottleHelper.declare_throttle_without_args(this.emit_change.bind(this), 50, { leading: false, trailing: true });

    @Watch('element', { immediate: true, deep: true })
    private on_input_element_changed() {
        if (isEqual(this.element, this.current_element)) {
            return;
        }

        this.current_element = this.element ? new VarWidgetOptionsElementsVO().from(this.element) : null
    }

    @Watch('elements_array', { immediate: true, deep: true })
    private on_input_elements_array_changed() {
        if (isEqual(this.elements_array, this.selectionable_elements)) {
            return;
        }
        this.selectionable_elements = [];
        forEach(this.elements_array, (element) => {
            if (element.type) {
                this.selectionable_elements.push(new VarWidgetOptionsElementsVO().from(element));
            }
        });
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

        if (this.selected_type != this.current_element.type) {
            this.selected_type = this.current_element.type;
        }

        if (this.icon_text != this.current_element.icon_text) {
            this.icon_text = this.current_element.icon_text;
        }

        if (this.tmp_selected_var_name != (this.current_element.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.current_element.var_id)))) {
            this.tmp_selected_var_name = this.current_element.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.current_element.var_id));
        }

        if (this.var_params != this.current_element.var_params) {
            this.var_params = this.current_element.var_params;
        }

        if (this.custom_filter_names != this.current_element.custom_filter_name) {
            this.custom_filter_names = this.current_element.custom_filter_name;
        }

        if (this.show_title != this.current_element.show_title) {
            this.show_title = this.current_element.show_title;
        }

        if (this.dimension_custom_filter_name != this.current_element.dimension_custom_filter_name) {
            this.dimension_custom_filter_name = this.current_element.dimension_custom_filter_name;
        }

        if (this.hide_options != this.current_element.hide_options) {
            this.hide_options = this.current_element.hide_options;
        }

        if (this.conditional_colors != this.current_element.conditional_colors) {
            this.conditional_colors = cloneDeep(this.current_element.conditional_colors);
        }

        if (this.selectionable_color_conditions.length == 0) {
            for (const i in ConditionStatement) {
                const condition = ConditionStatement[i];

                this.selectionable_color_conditions.push({
                    value: condition,
                    label: condition,
                });
            }
        }

        if ((this.current_element.title_style)) {
            if (this.title_bg_color != this.current_element.title_style.bg_color) {
                this.title_bg_color = this.current_element.title_style.bg_color;
            }
            if (this.title_text_color != this.current_element.title_style.text_color) {
                this.title_text_color = this.current_element.title_style.text_color;
            }
            if (this.title_font_size != this.current_element.title_style.font_size) {
                this.title_font_size = this.current_element.title_style.font_size;
            }
            if (this.title_position != this.current_element.title_style.text_align) {
                this.title_position = this.current_element.title_style.text_align;
            }
        }

        if ((this.current_element.icon_style)) {
            if (this.icon_size != this.current_element.icon_style.icon_size) {
                this.icon_size = this.current_element.icon_style.icon_size;
            }
        }
    }

    private async add_target_element(index: number, element: VarWidgetOptionsElementsVO) {
        let found = false;
        forEach(this.conditional_colors[index].targets, (target) => {
            if (target.id == element.id) {
                found = true;
            }
        });

        if (!found) {
            this.conditional_colors[index].targets.push(element);

        }
        await this.throttled_update_conditional_colors();
    }

    private async update_additional_options(additional_options: string) {
        this.filter_additional_params = additional_options;
        await this.update_var_params();
        await this.throttled_emit_changes();
    }

    private async update_filter_type(filter_type: string) {
        this.filter_type = filter_type;
        await this.update_var_params();
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

    @Watch('selected_type')
    private async handle_selected_type_change() {
        if (this.selected_type != '') {
            await this.throttled_emit_changes();
        }
    }

    @Watch('icon_text')
    private async handle_icon_text_change() {
        await this.throttled_emit_changes();
    }

    @Watch('title_position')
    private async handle_title_position_change() {
        await this.throttled_emit_changes();
    }

    @Watch('tmp_selected_var_name')
    private async handle_tmp_selected_var_name_change() {
        if (!this.tmp_selected_var_name) {
            return;
        }

        const var_id = parseInt(this.tmp_selected_var_name.split(' | ')[0]);
        this.current_element.var_id = var_id;
        await this.throttled_emit_changes();

        await this.update_var_params();
    }

    @Watch('title_font_size')
    private async update_font_size() {
        await this.throttled_emit_changes();
    }

    /**
     * handle_remove_conditional_cell_color
     *  - remove the color at the given index
     *
     * @param {number} index
     * @returns {void}
     */
    private async handle_remove_conditional_color(index: number) {
        this.conditional_colors.splice(index, 1);

        await this.throttled_update_conditional_colors();
    }

    private async handle_remove_target(index: number) {
        this.conditional_colors[index].targets.splice(index, 1);

        await this.throttled_update_conditional_colors();
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
        this.current_element.type = this.selected_type;
        this.current_element.icon_text = this.icon_text;
        this.current_element.var_id = this.var_id;
        this.current_element.var_params = this.var_params;
        this.current_element.custom_filter_name = this.custom_filter_names;
        this.current_element.show_title = this.show_title;
        this.current_element.title_style.bg_color = this.title_bg_color;
        this.current_element.title_style.text_color = this.title_text_color;
        this.current_element.title_style.font_size = this.title_font_size;
        this.current_element.title_style.text_align = this.title_position;
        this.current_element.icon_style.icon_size = this.icon_size;
        this.current_element.dimension_custom_filter_name = this.dimension_custom_filter_name;
        this.current_element.conditional_colors = this.conditional_colors;
        this.current_element.hide_options = this.hide_options;
        this.$emit('on_change', this.current_element);
    }

    get var_custom_filters(): { [var_param_field_name: string]: string } {
        if (!this.current_element) {
            return null;
        }

        return ObjectHandler.hasAtLeastOneAttribute(this.filter_custom_field_filters) ? this.filter_custom_field_filters : null;
    }

    private async switch_hide_options() {
        this.hide_options = !this.hide_options;
        await this.throttled_emit_changes();
    }

    @Watch('icon_size')
    private async update_icon_size() {
        await this.throttled_emit_changes();
    }

    @Watch('title_bg_color')
    private async update_title_bg_color() {
        await this.throttled_emit_changes();
    }

    @Watch('title_text_color')
    private async update_title_text_color() {
        await this.throttled_emit_changes();
    }

    public static get_var_custom_filters(
        var_custom_filters: { [var_param_field_name: string]: string },
        get_active_field_filters: FieldFiltersVO
    ): { [var_param_field_name: string]: ContextFilterVO } {

        /**
         * On crée le custom_filters
         */
        const custom_filters: { [var_param_field_name: string]: ContextFilterVO } = {};

        for (const var_param_field_name in var_custom_filters) {
            const custom_filter_name = var_custom_filters[var_param_field_name];

            if (!custom_filter_name) {
                continue;
            }

            const custom_filter = get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE] ? get_active_field_filters[ContextFilterVO.CUSTOM_FILTERS_TYPE][custom_filter_name] : null;

            if (!custom_filter) {
                continue;
            }

            custom_filters[var_param_field_name] = custom_filter;
        }

        return custom_filters;
    }

    private async change_custom_filter(field_id: string, custom_filter: string) {

        if (!this.current_element) {
            return;
        }

        this.custom_filter_names[field_id] = custom_filter;
        this.filter_custom_field_filters = this.custom_filter_names;
        this.dimension_custom_filter_name = custom_filter;

        if (this.get_custom_filters && (this.get_custom_filters.indexOf(custom_filter) < 0)) {
            const custom_filters = Array.from(this.get_custom_filters);
            custom_filters.push(custom_filter);
            this.set_custom_filters(custom_filters);
        }
        await this.throttled_emit_changes();
    }

    @Watch('custom_filter_names')
    private async onchange_custom_filter_names() {
        if (!this.current_element) {
            return;
        }

        if (this.current_element.custom_filter_name != this.custom_filter_names) {
            await this.throttled_emit_changes();
        }
    }
    private async update_var_params() {
        const custom_filters: { [var_param_field_name: string]: ContextFilterVO } = VarWidgetOptionsElementsComponent.get_var_custom_filters(this.custom_filter_names, this.get_active_field_filters);

        if (!this.var_id) {
            this.var_params = null;
            await this.emit_change();
            return;
        }


        this.var_params = await ModuleVar.getInstance().getVarParamFromContextFilters(
            VarsController.var_conf_by_id[this.var_id].name,
            this.get_active_field_filters,
            custom_filters,
            this.get_dashboard_api_type_ids,
            this.get_discarded_field_paths)

        await this.emit_change();
    }

    private async handle_add_conditional_color() {
        this.conditional_colors.push({ value: null, condition: null, color: { bg: null, text: null }, targets: [] });
        await this.throttled_emit_changes();
    }

    private async update_conditional_colors() {
        if (isEqual(this.current_element.conditional_colors, this.conditional_colors)) {
            return;
        }

        await this.throttled_emit_changes();
    }
    private async switch_show_title() {
        this.show_title = !this.show_title;
        await this.throttled_emit_changes();
    }

    get fields_that_could_get_custom_filter(): string[] {
        const res: string[] = [];

        if (!this.current_element || (!this.current_element.var_id) || (!VarsController.var_conf_by_id[this.current_element.var_id])) {
            return null;
        }

        const var_param_type = VarsController.var_conf_by_id[this.current_element.var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names) {
            this.custom_filter_names = {};
        }

        const fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (const i in fields) {
            const field = fields[i];

            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names[field.field_id] === "undefined") {
                    this.custom_filter_names[field.field_id] = null;
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

            if (a_ < b_) {
                return -1;
            }
            if (a_ > b_) {
                return 1;
            }

            return 0;
        });
        return res;
    }

    get title_name_code_text(): string {
        if (!this.current_element) {
            return null;
        }

        return this.current_element.get_title_name_code_text(this.page_widget_id);
    }
}
