import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../VueComponentBase';
import PageSwitchWidgetOptions from './options/PageSwitchWidgetOptions';
import './PageSwitchWidgetComponent.scss';

@Component({
    template: require('./PageSwitchWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class PageSwitchWidgetComponent extends VueComponentBase {

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

    private select_page() {
        if (!this.page) {
            return;
        }

        this.$emit('select_page', this.page);
    }

    get page_id(): number {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.page_id;
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: PageSwitchWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as PageSwitchWidgetOptions;
                options = options ? new PageSwitchWidgetOptions(options.page_id) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}