import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './BlocTextWidgetComponent.scss';
import BlocTextWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/BlocTextWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./BlocTextWidgetComponent.pug'),
    components: {}
})
export default class BlocTextWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    get widget_options(): BlocTextWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: BlocTextWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as BlocTextWidgetOptionsVO;
                options = options ? new BlocTextWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

}