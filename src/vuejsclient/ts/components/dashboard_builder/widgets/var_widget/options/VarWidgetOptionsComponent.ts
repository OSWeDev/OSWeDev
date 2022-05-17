import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import WidgetFilterOptionsComponent from './filters/WidgetFilterOptionsComponent';
import VarWidgetOptions from './VarWidgetOptions';
import './VarWidgetOptionsComponent.scss';

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

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDashboardPageGetter
    private get_custom_filters: string[];

    private next_update_options: VarWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private tmp_selected_var_name: string = null;
    private custom_filter_names: { [field_id: string]: string } = {};

    private async change_custom_filter(field_id: string, custom_filter: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_id,
                this.widget_options.filter_type,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.filter_additional_params);
        }
        this.custom_filter_names[field_id] = custom_filter;
        await this.throttled_update_options();
    }

    get fields_that_could_get_custom_filter(): string[] {
        let res: string[] = [];

        if (!this.widget_options.var_id) {
            return null;
        }

        let var_param_type = VarsController.getInstance().var_conf_by_id[this.widget_options.var_id].var_data_vo_type;
        if (!var_param_type) {
            return null;
        }

        let fields = VOsTypesManager.getInstance().moduleTables_by_voType[var_param_type].get_fields();
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
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_id,
                this.widget_options.filter_type,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.filter_additional_params);
        }
        this.next_update_options.filter_additional_params = additional_options;
        await this.throttled_update_options();
    }

    private async update_filter_type(filter_type: string) {
        if (!this.widget_options) {
            return;
        }

        if (!this.next_update_options) {
            this.next_update_options = new VarWidgetOptions(
                this.widget_options.var_id,
                this.widget_options.filter_type,
                this.widget_options.filter_custom_field_filters,
                this.widget_options.filter_additional_params);
        }
        this.next_update_options.filter_type = filter_type;
        await this.throttled_update_options();
    }

    get var_names(): string[] {

        let res: string[] = [];

        for (let i in VarsController.getInstance().var_conf_by_name) {
            let var_conf = VarsController.getInstance().var_conf_by_name[i];
            res.push(var_conf.id + ' | ' + this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(var_conf.id)));
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

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.tmp_selected_var_name = null;
            return;
        }
        this.tmp_selected_var_name = this.widget_options.var_id + ' | ' + this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.widget_options.var_id));
    }

    @Watch('tmp_selected_var_name')
    private async onchange_tmp_selected_var_name() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_var_name) {

            if (this.widget_options.var_id) {
                this.widget_options.var_id = null;
                this.custom_filter_names = {};
                this.widget_options.filter_custom_field_filters = {};
                await this.throttled_update_options();
            }
            return;
        }

        try {

            let selected_var_id: number = parseInt(this.tmp_selected_var_name.split(' | ')[0]);

            if (this.widget_options.var_id != selected_var_id) {
                this.next_update_options = this.widget_options;
                this.next_update_options.var_id = selected_var_id;

                await this.throttled_update_options();
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
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

        return this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.widget_options.var_id));
    }

    get widget_options(): VarWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: VarWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarWidgetOptions;
                options = options ? new VarWidgetOptions(
                    options.var_id,
                    options.filter_type,
                    options.filter_custom_field_filters,
                    options.filter_additional_params) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}