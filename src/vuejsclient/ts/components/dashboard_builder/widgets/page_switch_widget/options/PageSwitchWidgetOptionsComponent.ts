import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import PageSwitchWidgetOptions from './PageSwitchWidgetOptions';
import './PageSwitchWidgetOptionsComponent.scss';

@Component({
    template: require('./PageSwitchWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class PageSwitchWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: PageSwitchWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private tmp_selected_page_name: string = null;

    get page_names(): string[] {

        if ((!this.dashboard_page) || (!this.dashboard_pages)) {
            return null;
        }

        let res: string[] = [];

        for (let i in this.dashboard_pages) {
            let page = this.dashboard_pages[i];

            if (this.dashboard_page.id == page.id) {
                continue;
            }

            res.push(page.id + ' | ' + this.t(page.translatable_name_code_text));
        }

        return res;
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if ((!this.widget_options) || (!this.widget_options.page_id)) {
            this.tmp_selected_page_name = null;
            return;
        }
        let page = this.dashboard_pages.find((p) => p.id == this.widget_options.page_id);
        this.tmp_selected_page_name = page.id + ' | ' + this.t(page.translatable_name_code_text);
    }

    @Watch('tmp_selected_page_name')
    private async onchange_tmp_selected_page_name() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_page_name) {

            if (this.widget_options.page_id) {
                this.widget_options.page_id = null;
                await this.throttled_update_options();
            }
            return;
        }

        try {

            let selected_page_id: number = parseInt(this.tmp_selected_page_name.split(' | ')[0]);

            if (this.widget_options.page_id != selected_page_id) {
                this.next_update_options = this.widget_options;
                this.next_update_options.page_id = selected_page_id;
                this.next_update_options.page_widget_id = this.page_widget.id;

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
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.title_name_code_text;
    }

    get default_title_translation(): string {
        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.page_id) {
            return null;
        }

        let page = this.dashboard_pages.find((p) => p.id == this.widget_options.page_id);
        return this.t(page.translatable_name_code_text);
    }

    get widget_options(): PageSwitchWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: PageSwitchWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as PageSwitchWidgetOptions;
                options = options ? new PageSwitchWidgetOptions(options.page_id, options.page_widget_id) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}