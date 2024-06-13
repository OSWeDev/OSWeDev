import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VarWidgetOptionsElementsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VarWidgetOptionsElementsVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import VarWidgetOptions from './VarWidgetOptions';
import './VarWidgetOptionsComponent.scss';
import VarWidgetOptionsElementsComponent from './elements/VarWidgetOptionsElementsComponent';
import WidgetFilterOptionsComponent from './filters/WidgetFilterOptionsComponent';

@Component({
    template: require('./VarWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent,
        Varwidgetoptionselementscomponent: VarWidgetOptionsElementsComponent
    }
})
export default class VarWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private next_update_options: VarWidgetOptions = null;
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_colors = ThrottleHelper.declare_throttle_without_args(this.update_colors.bind(this), 800, { leading: false, trailing: true });

    private tmp_selected_var_name: string = null;
    private custom_filter_names: { [field_id: string]: string } = {};

    private fg_color_value: string = null;
    private fg_color_text: string = null;
    private bg_color: string = null;

    private icon: string = 'fa-clouds';
    private widget_options: VarWidgetOptions = null;
    private elements_array: VarWidgetOptionsElementsVO[] = [];
    private selected_var_name: string = null;

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
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.var_id) {
            return null;
        }

        return this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id));
    }

    get fields_that_could_get_custom_filter(): string[] {
        const res: string[] = [];

        if (!this.widget_options || !this.widget_options.var_id) {
            return null;
        }

        const var_param_type = VarsController.var_conf_by_id[this.widget_options.var_id].var_data_vo_type;
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

    @Watch('icon')
    private async handle_icon_change() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }
        this.next_update_options.icon = this.icon;
        await this.throttled_update_options();
    }

    @Watch('page_widget', { immediate: true })
    @Watch('widget_options')
    private async onchange_widget_options() {
        await this.throttled_reload_options();
    }

    private get_default_next_update_options(): VarWidgetOptions {
        return new VarWidgetOptions(
            this.widget_options.var_id,
            this.widget_options.filter_type,
            this.widget_options.filter_custom_field_filters,
            this.widget_options.filter_additional_params,
            this.widget_options.bg_color,
            this.widget_options.fg_color_value,
            this.widget_options.fg_color_text,
            this.widget_options.icon,
            this.widget_options.elements_array);
    }

    private async update_colors() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }
        this.widget_options.fg_color_value = this.fg_color_value;
        this.widget_options.fg_color_text = this.fg_color_text;
        this.widget_options.bg_color = this.bg_color;
        await this.throttled_update_options();
    }

    private async change_custom_filter(field_id: string, custom_filter: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }
        this.custom_filter_names[field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters = this.custom_filter_names;
        await this.throttled_update_options();
    }

    private async update_additional_options(additional_options: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }
        this.next_update_options.filter_additional_params = additional_options;
        await this.throttled_update_options();
    }

    private async update_filter_type(filter_type: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }
        this.next_update_options.filter_type = filter_type;
        await this.throttled_update_options();
    }

    private reload_options() {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {

            let options: VarWidgetOptions = null;
            try {
                if (this.page_widget.json_options) {
                    options = JSON.parse(this.page_widget.json_options) as VarWidgetOptions;
                    if (this.widget_options &&
                        (this.widget_options.var_id == options.var_id) &&
                        (this.widget_options.filter_type == options.filter_type) &&
                        (ObjectHandler.are_equal(this.widget_options.filter_custom_field_filters, options.filter_custom_field_filters)) &&
                        (this.widget_options.filter_additional_params == options.filter_additional_params) &&
                        (this.widget_options.bg_color == options.bg_color) &&
                        (this.widget_options.fg_color_value == options.fg_color_value) &&
                        (this.widget_options.fg_color_text == options.fg_color_text) &&
                        (this.widget_options.icon == options.icon) &&
                        (this.widget_options.elements_array == options.elements_array)
                    ) {
                        options = null;
                    }

                    options = options ? new VarWidgetOptions(
                        options.var_id,
                        options.filter_type,
                        options.filter_custom_field_filters,
                        options.filter_additional_params,
                        options.bg_color,
                        options.fg_color_value,
                        options.fg_color_text,
                        options.icon,
                        options.elements_array) : null;
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
            this.tmp_selected_var_name = null;
            this.custom_filter_names = {};
            return;
        }

        if (this.tmp_selected_var_name != (this.widget_options.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id)))) {
            this.tmp_selected_var_name = this.widget_options.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_id));
        }
        if (this.custom_filter_names != (this.widget_options.filter_custom_field_filters ? cloneDeep(this.widget_options.filter_custom_field_filters) : {})) {
            this.custom_filter_names = this.widget_options.filter_custom_field_filters ? cloneDeep(this.widget_options.filter_custom_field_filters) : {};
        }
        if (this.fg_color_value != this.widget_options.fg_color_value) {
            this.fg_color_value = this.widget_options.fg_color_value;
        }
        if (this.fg_color_text != this.widget_options.fg_color_text) {
            this.fg_color_text = this.widget_options.fg_color_text;
        }
        if (this.bg_color != this.widget_options.bg_color) {
            this.bg_color = this.widget_options.bg_color;
        }
        if (this.next_update_options != this.widget_options) {
            this.next_update_options = this.widget_options;
        }
        if (this.icon != this.widget_options.icon) {
            this.icon = this.widget_options.icon;
        }
        if (this.elements_array != this.widget_options.elements_array) {
            this.elements_array = this.widget_options.elements_array;
        }
    }

    private async add_element() {
        const var_widget_options_element = new VarWidgetOptionsElementsVO().initialize();

        this.next_update_options.elements_array.push(var_widget_options_element);
        await this.throttled_update_options();
    }

    private async update_element(element: VarWidgetOptionsElementsVO) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }

        // JNE : ça compilait pas j'ai fait une modif juste pour compiler...
        this.next_update_options.elements_array = [this.next_update_options.elements_array.find(
            (el) => {
                if (el.id == element.id) {
                    el = element;
                }
            }
        )];
        await this.throttled_update_options();
    }

    private async remove_element(index: number) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_next_update_options();
        }

        this.next_update_options.elements_array = this.widget_options.elements_array.splice(index, 1);
        await this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }
}