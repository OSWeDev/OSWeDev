import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './CMSImageWidgetComponent.scss';
import CMSImageWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./CMSImageWidgetComponent.pug'),
    components: {}
})
export default class CMSImageWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private file_id: number = null;
    private radius: number = null;

    get widget_options(): CMSImageWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSImageWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSImageWidgetOptionsVO;
                options = options ? new CMSImageWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.radius = null;

            return;
        }
        this.file_id = this.widget_options.file_id;
        this.radius = this.widget_options.radius;
    }

    private async mounted() {
        this.onchange_widget_options();
    }

}