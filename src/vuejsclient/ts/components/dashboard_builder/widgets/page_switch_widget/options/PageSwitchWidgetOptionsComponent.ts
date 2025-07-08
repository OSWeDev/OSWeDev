import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';
import PageSwitchWidgetOptions from './PageSwitchWidgetOptions';
import './PageSwitchWidgetOptionsComponent.scss';

@Component({
    template: require('./PageSwitchWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class PageSwitchWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private next_update_options: PageSwitchWidgetOptions = null;

    private tmp_selected_page_name: string = null;

    get page_names(): string[] {

        if ((!this.dashboard_page) || (!this.dashboard_pages)) {
            return null;
        }

        const res: string[] = [];

        for (const i in this.dashboard_pages) {
            const page = this.dashboard_pages[i];

            if (this.dashboard_page.id == page.id) {
                continue;
            }

            res.push(page.id + ' | ' + this.t(page.titre_page));
        }

        return res;
    }

    get default_title_translation(): string {
        if (!this.widget_options) {
            return null;
        }

        if (!this.widget_options.page_id) {
            return null;
        }

        const page = this.dashboard_pages.find((p) => p.id == this.widget_options.page_id);
        return this.t(page.titre_page);
    }

    get widget_options(): PageSwitchWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: PageSwitchWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as PageSwitchWidgetOptions;
                options = options ? new PageSwitchWidgetOptions(options.page_id) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if ((!this.widget_options) || (!this.widget_options.page_id)) {
            this.tmp_selected_page_name = null;
            return;
        }
        const page = this.dashboard_pages.find((p) => p.id == this.widget_options.page_id);
        this.tmp_selected_page_name = page.id + ' | ' + this.t(page.titre_page);
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 50,
        leading: false,
    })
    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }
        await ModuleDAO.instance.insertOrUpdateVO(this.page_widget);
    }

    @Watch('tmp_selected_page_name')
    private async onchange_tmp_selected_page_name() {
        if (!this.widget_options) {
            return;
        }

        if (!this.tmp_selected_page_name) {

            if (this.widget_options.page_id) {
                this.widget_options.page_id = null;
                await this.update_options();
            }
            return;
        }

        try {

            const selected_page_id: number = parseInt(this.tmp_selected_page_name.split(' | ')[0]);

            if (this.widget_options.page_id != selected_page_id) {
                this.next_update_options = this.widget_options;
                this.next_update_options.page_id = selected_page_id;

                await this.update_options();
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }
}