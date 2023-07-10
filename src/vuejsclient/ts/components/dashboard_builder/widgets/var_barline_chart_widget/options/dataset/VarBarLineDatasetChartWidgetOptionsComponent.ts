import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleTableField from '../../../../../../../../shared/modules/ModuleTableField';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import VOsTypesManager from '../../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageGetter } from '../../../../page/DashboardPageStore';
import WidgetFilterOptionsComponent from '../../../var_widget/options/filters/WidgetFilterOptionsComponent';
import VarBarLineDatasetChartWidgetOptions from './VarBarLineDatasetChartWidgetOptions';
import './VarBarLineDatasetChartWidgetOptionsComponent.scss';

@Component({
    template: require('./VarBarLineDatasetChartWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
        Widgetfilteroptionscomponent: WidgetFilterOptionsComponent
    }
})
export default class VarBarLineDatasetChartWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dataset_options: VarBarLineDatasetChartWidgetOptions;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private next_update_options: VarBarLineDatasetChartWidgetOptions = null;
    private throttled_reload_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.reload_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_colors = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_colors.bind(this), 800, { leading: false, trailing: true });

    private tmp_selected_var_name: string = null;
    private tmp_selected_dataset_type: string = null;

    private custom_filter_names: { [field_id: string]: string } = {};

    private bg_color: string = null;
    private border_color: string = null;
    private border_width: string = null;

    private dataset_types: string[] = [
        VarBarLineDatasetChartWidgetOptions.TYPE_LINE,
        VarBarLineDatasetChartWidgetOptions.TYPE_BAR,
        VarBarLineDatasetChartWidgetOptions.TYPE_AREA
    ];

    private get_default_options(): VarBarLineDatasetChartWidgetOptions {
        return new VarBarLineDatasetChartWidgetOptions(
            null,
            null,
            null,
            {},
            'rgba(0, 0, 0, 0.1)',
            'rgba(0, 0, 0, 0.1)',
            3,
            VarBarLineDatasetChartWidgetOptions.TYPE_LINE
        );
    }

    private async update_colors() {
        if (!this.dataset_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.bg_color = this.bg_color;
        this.next_update_options.border_color = this.border_color;
        await this.throttled_update_options();
    }

    private async change_custom_filter(field_id: string, custom_filter: string) {
        if (!this.dataset_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.custom_filter_names[field_id] = custom_filter;
        this.next_update_options.filter_custom_field_filters = this.custom_filter_names;
        await this.throttled_update_options();
    }

    get fields_that_could_get_custom_filter(): string[] {
        let res: string[] = [];

        if (!this.dataset_options || !this.dataset_options.var_id) {
            return null;
        }

        let var_param_type = VarsController.var_conf_by_id[this.dataset_options.var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        if (!this.custom_filter_names) {
            this.custom_filter_names = {};
        }

        let fields = VOsTypesManager.moduleTables_by_voType[var_param_type].get_fields();
        for (let i in fields) {
            let field = fields[i];

            if ((field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
                (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array)) {
                res.push(field.field_id);
                if (typeof this.custom_filter_names[field.field_id] === "undefined") {
                    this.custom_filter_names[field.field_id] = null;
                }
            }
        }

        return res;
    }

    private async update_additional_options(additional_options: string) {
        if (!this.dataset_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.filter_additional_params = additional_options;
        await this.throttled_update_options();
    }

    private async update_filter_type(filter_type: string) {
        if (!this.dataset_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }
        this.next_update_options.filter_type = filter_type;
        await this.throttled_update_options();
    }

    get var_names(): string[] {

        let res: string[] = [];

        for (let i in VarsController.var_conf_by_name) {
            let var_conf = VarsController.var_conf_by_name[i];
            res.push(var_conf.id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(var_conf.id)));
        }

        res.sort((a, b) => {
            let a_ = a.split(' | ')[1];
            let b_ = b.split(' | ')[1];

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

    private reload_options() {
        if (!this.dataset_options) {
            return;
        }

        if (((!this.dataset_options.border_width) && this.border_width) || (this.dataset_options.border_width && (this.border_width != this.dataset_options.border_width.toString()))) {
            this.border_width = this.dataset_options.border_width ? this.dataset_options.border_width.toString() : null;
        }

        if (this.tmp_selected_var_name != (this.dataset_options.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.dataset_options.var_id)))) {
            this.tmp_selected_var_name = this.dataset_options.var_id + ' | ' + this.t(VarsController.get_translatable_name_code_by_var_id(this.dataset_options.var_id));
        }
        if (this.custom_filter_names != (this.dataset_options.filter_custom_field_filters ? cloneDeep(this.dataset_options.filter_custom_field_filters) : {})) {
            this.custom_filter_names = this.dataset_options.filter_custom_field_filters ? cloneDeep(this.dataset_options.filter_custom_field_filters) : {};
        }

        if (this.tmp_selected_dataset_type != this.dataset_options.dataset_type) {
            this.tmp_selected_dataset_type = this.dataset_options.dataset_type;
        }
        if (this.bg_color != this.dataset_options.bg_color) {
            this.bg_color = this.dataset_options.bg_color;
        }
        if (this.border_color != this.dataset_options.border_color) {
            this.border_color = this.dataset_options.border_color;
        }
        if (this.bg_color != this.dataset_options.bg_color) {
            this.bg_color = this.dataset_options.bg_color;
        }

        if (this.next_update_options != this.dataset_options) {
            this.next_update_options = this.dataset_options;
        }
    }

    @Watch('tmp_selected_var_name')
    private async onchange_tmp_selected_var_name() {
        if (!this.dataset_options) {
            return;
        }

        if (!this.tmp_selected_var_name) {

            if (this.next_update_options.var_id) {
                this.next_update_options.var_id = null;
                this.custom_filter_names = {};
                this.next_update_options.filter_custom_field_filters = {};
                await this.throttled_update_options();
            }
            return;
        }

        try {

            let selected_var_id: number = parseInt(this.tmp_selected_var_name.split(' | ')[0]);

            if (this.dataset_options.var_id != selected_var_id) {

                if (!this.next_update_options) {
                    this.next_update_options = this.get_default_options();
                }

                this.next_update_options = this.dataset_options;
                this.next_update_options.var_id = selected_var_id;

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    @Watch('tmp_selected_dataset_type')
    private async onchange_tmp_selected_dataset_type() {
        if (!this.dataset_options) {
            return;
        }

        if (!this.tmp_selected_dataset_type) {

            if (this.dataset_options.dataset_type) {

                if (!this.next_update_options) {
                    this.next_update_options = this.get_default_options();
                }

                this.next_update_options.dataset_type = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            if (this.dataset_options.dataset_type != this.tmp_selected_dataset_type) {
                this.next_update_options = this.dataset_options;
                this.next_update_options.dataset_type = this.tmp_selected_dataset_type;

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async update_options() {
        this.$emit('update_options', this.next_update_options);
    }

    @Watch('dataset_options', { immediate: true, deep: true })
    private async onchange_dataset_options() {
        await this.throttled_reload_options();
    }
}