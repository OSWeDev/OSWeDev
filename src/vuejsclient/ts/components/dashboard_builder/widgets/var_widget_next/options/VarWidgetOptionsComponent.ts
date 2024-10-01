import { add, cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableFieldVO from '../../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
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
import WidgetFilterOptionsComponent from './filters/WidgetFilterOptionsComponent';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleVar from '../../../../../../../shared/modules/Var/ModuleVar';
import VarWidgetComponent from '../VarWidgetComponent';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import { ConditionStatement } from '../../../../../../../shared/tools/ConditionHandler';

@Component({
    template: require('./VarWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent
    }
})
export default class VarWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private next_update_options: VarWidgetOptions = null;
    private throttled_reload_options = ThrottleHelper.declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_colors = ThrottleHelper.declare_throttle_without_args(this.update_colors.bind(this), 800, { leading: false, trailing: true });

    private tmp_selected_var_name_principale: string = null;
    private var_name_principale_label: string = null;
    private tmp_switch_var_name_principale_display_label: boolean = false;

    private tmp_subtitle: string = null;

    private tmp_selected_var_name_a_date: string = null;
    private var_name_a_date_label: string = null;
    private tmp_switch_var_name_a_date_display_label: boolean = false;

    private tmp_selected_var_name_complementaire: string = null;
    private var_name_complementaire_label: string = null;
    private tmp_switch_var_name_complementaire_display_label: boolean = false;

    private tmp_selected_var_name_complementaire_supp: string = null;
    private var_name_complementaire_supp_label: string = null;
    private tmp_switch_var_name_complementaire_supp_display_label: boolean = false
    private tmp_selected_var_condition: string = null;

    private custom_filter_names: { [field_id: string]: string }[] = [{}, {}, {}, {}, {}];
    private hide_widget_options: boolean = false;
    private hide_first_var_options: boolean = false;
    private hide_second_var_options: boolean = false;
    private hide_third_var_options: boolean = false;
    private hide_fourth_var_options: boolean = false;
    private hide_condition_options: boolean = false;

    private icons_by_value_and_conditions: Array<{
        value: string,
        condition: ConditionStatement,
        icon: string,
    }> = [
            { value: null, condition: null, icon: 'fa-sun' },
            { value: null, condition: null, icon: 'fa-cloud' },
            { value: null, condition: null, icon: 'fa-cloud-rain' },
        ];
    private fg_color_text: string = null;
    private bg_color: string = null;
    private style: string = null;
    private style_options: string[] = [
        "weather",
        "minimalist",
    ]
    private icon_text: string = null;
    private icon_size: number = 1;
    private vars = [];

    private widget_options: VarWidgetOptions = null;
    private tmp_selectionnable_conditions: Array<{ value: ConditionStatement, label: string }> = [];

    private async update_colors() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.widget_options.fg_color_text = this.fg_color_text;
        this.widget_options.bg_color = this.bg_color;
        this.widget_options.style = this.style;
        await this.throttled_update_options();
    }

    private async change_custom_filter(field_id: string, custom_filter: string, target_index: number) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        if (this.custom_filter_names[target_index] == null) {
            this.custom_filter_names[target_index] = {};
        }
        this.custom_filter_names[target_index][field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters = cloneDeep(this.custom_filter_names);

        await this.throttled_update_options();
    }


    private get_fields_that_could_get_custom_filter(var_name: string, index: number): string[] {
        const res: string[] = [];
        if (!this.widget_options || !this.widget_options.vars || !var_name) {
            return null;
        }
        let var_id = parseInt(var_name.split(' | ')[0]);

        if (!var_id) {
            return null;
        }

        const var_param_type = VarsController.var_conf_by_id[var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names) {
            this.custom_filter_names = [{}];
        }

        if (!this.custom_filter_names[index]) {
            this.custom_filter_names[index] = {};
        }

        const fields = ModuleTableController.module_tables_by_vo_type[var_param_type].get_fields();
        for (const i in fields) {
            const field = fields[i];

            if ((field.field_type == ModuleTableFieldVO.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableFieldVO.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names[index][field.field_id] === "undefined") {
                    this.custom_filter_names[index][field.field_id] = null;
                }
            }
        }

        return res;
    }

    private async update_additional_options(additional_options: string, id: number) {
        if (!this.widget_options) {
            return;
        }

        let index = this.widget_options.vars ? this.widget_options.vars.findIndex((var_) => var_.id == id) : -1;

        if (index == -1) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        if (this.next_update_options.vars) {
            this.next_update_options.vars[index].filter_additional_params = additional_options;
        } else {
            this.next_update_options.vars = [
                {
                    is_condition_target: false,
                    display_label: false,
                    var_id: null,
                    id: null,
                    filter_type: null,
                    filter_additional_params: additional_options
                }
            ]
        }
        await this.throttled_update_options();
    }

    private async update_filter_type(filter_type: string, id: number) {
        if (!this.widget_options) {
            return;
        }

        let index = this.widget_options.vars ? this.widget_options.vars.findIndex((var_) => var_.id == id) : -1;

        if (index == -1) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        if (this.next_update_options.vars) {
            this.next_update_options.vars[index].filter_type = filter_type;
        } else {
            this.next_update_options.vars = [
                {
                    is_condition_target: false,
                    display_label: false,
                    var_id: null,
                    id: null,
                    filter_type: filter_type,
                    filter_additional_params: null
                }
            ]
        }
        await this.throttled_update_options();
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

    get selectionnable_conditions(): Array<{ value: string, label: string }> {
        if (this.tmp_selectionnable_conditions.length > 0) {
            return this.tmp_selectionnable_conditions;
        }
        for (const i in ConditionStatement) {
            const condition: ConditionStatement = ConditionStatement[i];

            this.tmp_selectionnable_conditions.push({
                value: condition,
                label: condition,
            });
        }
        return this.tmp_selectionnable_conditions;

    }

    private reload_options() {
        if (!this.page_widget) {
            this.widget_options = null;
        } else {

            let options: VarWidgetOptions = null;
            try {
                if (this.page_widget.json_options) {
                    options = JSON.parse(this.page_widget.json_options) as VarWidgetOptions;
                    if (!options.icons_by_value_and_conditions) {
                        options.icons_by_value_and_conditions = [
                            { value: null, condition: null, icon: 'fa-sun' },
                            { value: null, condition: null, icon: 'fa-cloud' },
                            { value: null, condition: null, icon: 'fa-cloud-rain' },
                        ];
                    }
                    if (!options.vars) {
                        options.vars = [
                            {
                                is_condition_target: false,
                                display_label: false,
                                var_id: null,
                                id: Math.floor(Math.random() * 1000),
                                filter_type: null,
                                filter_additional_params: null
                            },
                            {
                                is_condition_target: false,
                                display_label: false,
                                var_id: null,
                                id: null,
                                filter_type: null,
                                filter_additional_params: null
                            },
                            {
                                is_condition_target: false,
                                display_label: false,
                                var_id: null,
                                id: Math.floor(Math.random() * 1000),
                                filter_type: null,
                                filter_additional_params: null
                            },
                            {
                                is_condition_target: false,
                                display_label: false,
                                var_id: null,
                                id: Math.floor(Math.random() * 1000),
                                filter_type: null,
                                filter_additional_params: null
                            }
                        ];
                    }
                    if (this.widget_options &&
                        (this.widget_options.subtitle == options.subtitle) &&
                        (this.widget_options.var_condition_id == options.var_condition_id) &&
                        (this.widget_options.icons_by_value_and_conditions == options.icons_by_value_and_conditions) &&
                        (this.widget_options.vars == options.vars) &&
                        (this.widget_options.filter_custom_field_filters == options.filter_custom_field_filters) &&
                        (this.widget_options.bg_color == options.bg_color) &&
                        (this.widget_options.fg_color_text == options.fg_color_text) &&
                        (this.widget_options.style == options.style) &&
                        (this.widget_options.icon_text == options.icon_text) &&
                        (this.widget_options.icon_size == options.icon_size)
                    ) {
                        options = null;
                    }

                    options = options ? new VarWidgetOptions(
                        options.var_condition_id,
                        options.icons_by_value_and_conditions,
                        options.vars,
                        options.filter_custom_field_filters,
                        options.bg_color,
                        options.fg_color_text,
                        options.style,
                        options.icon_text,
                        options.icon_size,
                        options.subtitle,
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
            this.vars = [];
            this.tmp_selected_var_name_principale = null;
            this.tmp_selected_var_name_a_date = null;
            this.tmp_selected_var_name_complementaire = null;
            this.tmp_selected_var_name_complementaire_supp = null;
            this.tmp_selected_var_condition = null;
            this.tmp_switch_var_name_principale_display_label = false;
            this.tmp_switch_var_name_a_date_display_label = false;
            this.tmp_switch_var_name_complementaire_display_label = false;
            this.tmp_switch_var_name_complementaire_supp_display_label = false;
            this.custom_filter_names = [{}];
            return;
        }

        if (this.widget_options.vars) {
            this.vars = this.widget_options.vars ? cloneDeep(this.widget_options.vars) : [];
            if (this.widget_options.vars[0]) {
                if (this.tmp_selected_var_name_principale != (this.widget_options.vars[0].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[0].var_id)))) {
                    this.tmp_selected_var_name_principale = this.widget_options.vars[0].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[0].var_id));
                }
                if (this.tmp_switch_var_name_principale_display_label != this.widget_options.vars[0].display_label) {
                    this.tmp_switch_var_name_principale_display_label = this.widget_options.vars[0].display_label;
                }
            }
            if (this.widget_options.vars[1]) {
                if (this.tmp_selected_var_name_a_date != (this.widget_options.vars[1].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[1].var_id)))) {
                    this.tmp_selected_var_name_a_date = this.widget_options.vars[1].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[1].var_id));
                }
                if (this.tmp_switch_var_name_a_date_display_label != this.widget_options.vars[1].display_label) {
                    this.tmp_switch_var_name_a_date_display_label = this.widget_options.vars[1].display_label;
                }
            }
            if (this.widget_options.vars[2]) {
                if (this.tmp_selected_var_name_complementaire != (this.widget_options.vars[2].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[2].var_id)))) {
                    this.tmp_selected_var_name_complementaire = this.widget_options.vars[2].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[2].var_id));
                }
                if (this.tmp_switch_var_name_complementaire_display_label != this.widget_options.vars[2].display_label) {
                    this.tmp_switch_var_name_complementaire_display_label = this.widget_options.vars[2].display_label;
                }
            }
            if (this.widget_options.vars[3]) {
                if (this.tmp_selected_var_name_complementaire_supp != (this.widget_options.vars[3].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[3].var_id)))) {
                    this.tmp_selected_var_name_complementaire_supp = this.widget_options.vars[3].var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.vars[3].var_id));
                }
                if (this.tmp_switch_var_name_complementaire_supp_display_label != this.widget_options.vars[3].display_label) {
                    this.tmp_switch_var_name_complementaire_supp_display_label = this.widget_options.vars[3].display_label;
                }
            }
        }

        if (this.icons_by_value_and_conditions != this.widget_options.icons_by_value_and_conditions) {
            this.icons_by_value_and_conditions = this.widget_options.icons_by_value_and_conditions;
        }

        if (this.tmp_subtitle != this.widget_options.subtitle) {
            this.tmp_subtitle = this.widget_options.subtitle;
        }

        if (this.tmp_selected_var_condition != (this.widget_options.var_condition_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_condition_id)))) {
            this.tmp_selected_var_condition = this.widget_options.var_condition_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.widget_options.var_condition_id));
        }

        if (this.custom_filter_names != (this.widget_options.filter_custom_field_filters ? cloneDeep(this.widget_options.filter_custom_field_filters) : [{}])) {
            this.custom_filter_names = this.widget_options.filter_custom_field_filters ? cloneDeep(this.widget_options.filter_custom_field_filters) : [{}];
        }
        if (this.fg_color_text != this.widget_options.fg_color_text) {
            this.fg_color_text = this.widget_options.fg_color_text;
        }
        if (this.bg_color != this.widget_options.bg_color) {
            this.bg_color = this.widget_options.bg_color;
        }
        if (this.style != this.widget_options.style) {
            this.style = this.widget_options.style;
        }
        if (this.icon_text != this.widget_options.icon_text) {
            this.icon_text = this.widget_options.icon_text;
        }
        if (this.icon_size != this.widget_options.icon_size) {
            this.icon_size = this.widget_options.icon_size;
        }
        if (this.next_update_options != this.widget_options) {
            this.next_update_options = this.widget_options;
        }
    }

    @Watch('page_widget', { immediate: true })
    @Watch('widget_options')
    private async onchange_widget_options() {
        await this.throttled_reload_options();
    }

    @Watch('tmp_subtitle')
    private async onchange_tmp_subtitle() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.next_update_options = this.widget_options;
        this.next_update_options.subtitle = this.tmp_subtitle;
        await this.throttled_update_options();
    }

    @Watch('icons_by_value_and_conditions', { deep: true })
    private async onchange_icons_by_value_and_conditions() {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.next_update_options = this.widget_options;
        this.next_update_options.icons_by_value_and_conditions = cloneDeep(this.icons_by_value_and_conditions);
        await this.throttled_update_options();
    }

    @Watch('tmp_selected_var_name_principale')
    private async onchange_tmp_selected_var_name_principale() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name_principale) {
            if (this.widget_options.vars) {
                if (this.widget_options.vars[0]) {
                    if (this.widget_options.vars[0].var_id) {
                        this.widget_options.vars[0].var_id = null;
                        this.custom_filter_names = [{}];
                        this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars = [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: null,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                    this.custom_filter_names = [{}];
                    this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                    await this.throttled_update_options();

                }
            } else {
                this.widget_options.vars = [{
                    is_condition_target: false,
                    display_label: false,
                    var_id: null,
                    id: null,
                    filter_type: null,
                    filter_additional_params: null
                }];
                this.custom_filter_names = [{}];
                this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const selected_var_id: number = parseInt(this.tmp_selected_var_name_principale.split(' | ')[0]);
            if (this.widget_options.vars) {
                if (this.widget_options.vars[0]) {
                    if (this.widget_options.vars[0].var_id != selected_var_id) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.vars[0].var_id = selected_var_id;
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars.push({
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    });
                    this.next_update_options = this.widget_options;
                    await this.throttled_update_options();
                }
            } else {
                this.widget_options.vars =
                    [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                this.next_update_options = this.widget_options;
                await this.throttled_update_options();
            }
            await this.throttled_update_options();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    get var_custom_filters(): { [var_param_field_name: string]: string }[] {
        if (!this.widget_options) {
            return null;
        }
        return ObjectHandler.hasAtLeastOneAttribute(this.widget_options.filter_custom_field_filters) ? this.widget_options.filter_custom_field_filters : null;
    }

    @Watch('tmp_selected_var_name_a_date')
    private async onchange_tmp_selected_var_name_a_date() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name_a_date) {
            if (this.widget_options.vars) {
                if (this.widget_options.vars[1]) {
                    if (this.widget_options.vars[1].var_id) {
                        this.widget_options.vars[1].var_id = null;
                        this.custom_filter_names = [{}];
                        this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars = [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: null,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                    this.custom_filter_names = [{}];
                    this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                    await this.throttled_update_options();

                }
            } else {
                this.widget_options.vars = [{
                    is_condition_target: false,
                    display_label: false,
                    var_id: null,
                    id: null,
                    filter_type: null,
                    filter_additional_params: null
                }];
                this.custom_filter_names = [{}];
                this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const selected_var_id: number = parseInt(this.tmp_selected_var_name_a_date.split(' | ')[0]);
            if (this.widget_options.vars) {
                if (this.widget_options.vars[1]) {
                    if (this.widget_options.vars[1].var_id != selected_var_id) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.vars[1].var_id = selected_var_id;
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars.push({
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    });
                    this.next_update_options = this.widget_options;
                    await this.throttled_update_options();
                }
            } else {
                this.widget_options.vars =
                    [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                this.next_update_options = this.widget_options;
                await this.throttled_update_options();
            }
            await this.throttled_update_options();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('tmp_selected_var_condition')
    private async onchange_tmp_selected_var_condition() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_condition) {
            if (this.widget_options.var_condition_id) {
                this.widget_options.var_condition_id = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const selected_var_id: number = parseInt(this.tmp_selected_var_condition.split(' | ')[0]);
            if (this.widget_options.var_condition_id != selected_var_id) {
                this.next_update_options = this.widget_options;
                this.next_update_options.var_condition_id = selected_var_id;
                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('tmp_selected_var_name_complementaire')
    private async onchange_tmp_selected_var_name_complementaire() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name_complementaire) {
            if (this.widget_options.vars) {
                if (this.widget_options.vars[2]) {
                    if (this.widget_options.vars[2].var_id) {
                        this.widget_options.vars[2].var_id = null;
                        this.custom_filter_names = [{}];
                        this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars = [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: null,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                    this.custom_filter_names = [{}];
                    this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                    await this.throttled_update_options();

                }
            } else {
                this.widget_options.vars = [{
                    is_condition_target: false,
                    display_label: false,
                    var_id: null,
                    id: null,
                    filter_type: null,
                    filter_additional_params: null
                }];
                this.custom_filter_names = [{}];
                this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const selected_var_id: number = parseInt(this.tmp_selected_var_name_complementaire.split(' | ')[0]);
            if (this.widget_options.vars) {
                if (this.widget_options.vars[2]) {
                    if (this.widget_options.vars[2].var_id != selected_var_id) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.vars[2].var_id = selected_var_id;
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars.push({
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    });
                    this.next_update_options = this.widget_options;
                    await this.throttled_update_options();
                }
            } else {
                this.widget_options.vars =
                    [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                this.next_update_options = this.widget_options;
                await this.throttled_update_options();
            }
            await this.throttled_update_options();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('icon_text')
    private async onchange_icon_text() {
        if (!this.widget_options) {
            return;
        }
        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.next_update_options = this.widget_options;
        this.next_update_options.icon_text = this.icon_text;
        await this.throttled_update_options();
    }

    @Watch('icon_size')
    private async onchange_icon_size() {
        if (!this.widget_options) {
            return;
        }
        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.next_update_options = this.widget_options;
        this.next_update_options.icon_size = this.icon_size;
        await this.throttled_update_options();
    }

    @Watch('tmp_selected_var_name_complementaire_supp')
    private async onchange_tmp_selected_var_name_complementaire_supp() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name_complementaire_supp) {
            if (this.widget_options.vars) {
                if (this.widget_options.vars[3]) {
                    if (this.widget_options.vars[3].var_id) {
                        this.widget_options.vars[3].var_id = null;
                        this.custom_filter_names = [{}];
                        this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars = [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: null,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                    this.custom_filter_names = [{}];
                    this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                    await this.throttled_update_options();

                }
            } else {
                this.widget_options.vars = [{
                    is_condition_target: false,
                    display_label: false,
                    var_id: null,
                    id: null,
                    filter_type: null,
                    filter_additional_params: null
                }];
                this.custom_filter_names = [{}];
                this.widget_options.filter_custom_field_filters = [{}]; // Pas sûr que ce soit utile
                await this.throttled_update_options();
            }
            return;
        }

        try {
            const selected_var_id: number = parseInt(this.tmp_selected_var_name_complementaire_supp.split(' | ')[0]);
            if (this.widget_options.vars) {
                if (this.widget_options.vars[3]) {
                    if (this.widget_options.vars[3].var_id != selected_var_id) {
                        this.next_update_options = this.widget_options;
                        this.next_update_options.vars[3].var_id = selected_var_id;
                        await this.throttled_update_options();
                    }
                } else {
                    this.widget_options.vars.push({
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    });
                    this.next_update_options = this.widget_options;
                    await this.throttled_update_options();
                }
            } else {
                this.widget_options.vars =
                    [{
                        is_condition_target: false,
                        display_label: false,
                        var_id: selected_var_id,
                        id: null,
                        filter_type: null,
                        filter_additional_params: null
                    }];
                this.next_update_options = this.widget_options;
                await this.throttled_update_options();
            }
            await this.throttled_update_options();
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async switch_var_name_principal_display_label() {
        if (!this.widget_options) {
            return;
        }

        if (!this.widget_options.vars) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.tmp_switch_var_name_principale_display_label = !this.tmp_switch_var_name_principale_display_label;
        this.next_update_options.vars[0].display_label = this.tmp_switch_var_name_principale_display_label;
        await this.throttled_update_options();
    }

    private async switch_hide_widget_options() {
        this.hide_widget_options = !this.hide_widget_options
    }

    private async switch_hide_first_var_options() {
        this.hide_first_var_options = !this.hide_first_var_options
    }

    private async switch_hide_second_var_options() {
        this.hide_second_var_options = !this.hide_second_var_options
    }

    private async switch_hide_third_var_options() {
        this.hide_third_var_options = !this.hide_third_var_options
    }

    private async switch_hide_fourth_var_options() {
        this.hide_fourth_var_options = !this.hide_fourth_var_options
    }

    private async switch_hide_condition_options() {
        this.hide_condition_options = !this.hide_condition_options
    }

    private async switch_var_name_a_date_display_label() {
        if (!this.widget_options) {
            return;
        }

        if (!this.widget_options.vars) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.tmp_switch_var_name_a_date_display_label = !this.tmp_switch_var_name_a_date_display_label;
        this.next_update_options.vars[1].display_label = this.tmp_switch_var_name_a_date_display_label;
        await this.throttled_update_options();
    }
    private async switch_var_name_complementaire_display_label() {
        if (!this.widget_options) {
            return;
        }

        if (!this.widget_options.vars) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.tmp_switch_var_name_complementaire_display_label = !this.tmp_switch_var_name_complementaire_display_label;
        this.next_update_options.vars[2].display_label = this.tmp_switch_var_name_complementaire_display_label;
        await this.throttled_update_options();
    }

    private async switch_var_name_complementaire_supp_display_label() {
        if (!this.widget_options) {
            return;
        }

        if (!this.widget_options.vars) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.tmp_switch_var_name_complementaire_supp_display_label = !this.tmp_switch_var_name_complementaire_supp_display_label;
        this.next_update_options.vars[3].display_label = this.tmp_switch_var_name_complementaire_supp_display_label;
        await this.throttled_update_options();
    }

    private async switch_condition_target(index: number) {
        if (!this.widget_options) {
            return;
        }

        if (!this.widget_options.vars) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_condition_id,
                this.widget_options.icons_by_value_and_conditions,
                this.widget_options.vars,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.bg_color,
                this.widget_options.fg_color_text,
                this.widget_options.style,
                this.widget_options.icon_text,
                this.widget_options.icon_size,
                this.widget_options.subtitle,
            );
        }
        this.next_update_options.vars[index].is_condition_target = !this.next_update_options.vars[index].is_condition_target;
        await this.throttled_update_options();
    }

    @Watch('style')
    private async onchange_style() {
        await this.throttled_update_colors();
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

    private get_var_name_code_text(var_name: string): string {
        const res: string[] = [];
        if (!this.widget_options || !var_name) {
            return null;
        }
        let var_id = parseInt(var_name.split(' | ')[0]);

        return this.widget_options.get_var_name_code_text(this.page_widget.id, var_id);
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    private get_default_title_translation(var_name: string): string {
        if (!this.widget_options || !var_name) {
            return null;
        }
        let var_id = parseInt(var_name.split(' | ')[0]);
        return this.t(VarsController.get_translatable_name_code_by_var_id(var_id));
    }
}