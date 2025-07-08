import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../VueComponentBase';
import PageSwitchWidgetOptions from './options/PageSwitchWidgetOptions';
import './PageSwitchWidgetComponent.scss';
import DashboardHistoryController from '../../DashboardHistoryController';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./PageSwitchWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class PageSwitchWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    private dashboard_pages: DashboardPageVO[];

    get page(): DashboardPageVO {
        if (!this.page_id) {
            return null;
        }

        if (!this.dashboard_pages) {
            return null;
        }

        return this.dashboard_pages.find((p) => p.id == this.page_id);
    }

    get page_id(): number {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.page_id;
    }

    get get_dashboard_page(): DashboardPageVO {
        return this.vuexGet(reflect<this>().get_dashboard_page);
    }

    get widget_options() {
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

    public select_page(page: DashboardPageVO) {
        DashboardHistoryController.select_page(
            this.get_dashboard_page,
            this.page,
            this.add_page_history,
            this.set_dashboard_page,
        );
    }

    public set_dashboard_page(page: DashboardPageVO) {
        this.vuexAct<DashboardPageVO>(reflect<this>().set_dashboard_page, page);
    }

    public add_page_history(page_history: DashboardPageVO) {
        return this.vuexAct(reflect<this>().add_page_history, page_history);
    }


    private select_page() {
        if (!this.page) {
            return;
        }

        this.$emit('select_page', this.page);
    }
}