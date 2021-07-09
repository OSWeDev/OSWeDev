import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import VarWidgetOptions from './VarWidgetOptions';
import './VarWidgetOptionsComponent.scss';

@Component({
    template: require('./VarWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent
    }
})
export default class VarWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: VarWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 300, { leading: false });

    private tmp_selected_var_name: string = null;

    get var_names(): string[] {
        return Object.keys(VarsController.getInstance().var_conf_by_name).sort();
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.tmp_selected_var_name = null;
            return;
        }
        this.tmp_selected_var_name = this.widget_options.var_name;
    }

    @Watch('tmp_selected_var_name')
    private async onchange_tmp_selected_var_name() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.var_name != this.tmp_selected_var_name) {
            this.next_update_options = this.widget_options;
            this.next_update_options.var_name = this.tmp_selected_var_name;
            this.next_update_options.page_widget_id = this.page_widget.id;

            await this.throttled_update_options();
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
    }

    get default_title_translation(): string {
        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.var_name) {
            return null;
        }

        let var_id = VarsController.getInstance().var_conf_by_name[this.widget_options.var_name].id;

        return var_id + ' | ' + this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(var_id));
    }

    get widget_options(): VarWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: VarWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VarWidgetOptions;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}