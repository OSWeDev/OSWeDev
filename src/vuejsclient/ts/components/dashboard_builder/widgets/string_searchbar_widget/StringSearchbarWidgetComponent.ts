import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import StringSearchbarWidgetOptions from './options/StringSearchbarWidgetOptions';
import './StringSearchbarWidgetComponent.scss';

@Component({
    template: require('./StringSearchbarWidgetComponent.pug'),
    components: {}
})
export default class StringSearchbarWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private start_update: boolean = false;
    private button_class: string = null;

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: StringSearchbarWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as StringSearchbarWidgetOptions;
                options = options ? new StringSearchbarWidgetOptions().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {

    }

}