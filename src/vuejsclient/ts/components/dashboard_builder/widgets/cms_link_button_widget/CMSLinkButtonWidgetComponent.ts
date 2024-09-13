import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './CMSLinkButtonWidgetComponent.scss';
import CMSLinkButtonWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./CMSLinkButtonWidgetComponent.pug'),
    components: {}
})
export default class CMSLinkButtonWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private url: string = null;
    private title: string = null;
    private color: string = null;

    get widget_options(): CMSLinkButtonWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSLinkButtonWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSLinkButtonWidgetOptionsVO;
                options = options ? new CMSLinkButtonWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.url = null;
            this.title = null;
            this.color = null;

            return;
        }
        this.url = this.widget_options.url;
        this.title = this.widget_options.title;
        this.color = this.widget_options.color;
    }

    private async mounted() {
        this.onchange_widget_options();
    }

}