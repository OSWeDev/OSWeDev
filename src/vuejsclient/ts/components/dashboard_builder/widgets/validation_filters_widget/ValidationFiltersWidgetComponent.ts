import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import ValidationFiltersWidgetOptions from './options/ValidationFiltersWidgetOptions';
import ValidationFiltersCallUpdaters from './ValidationFiltersCallUpdaters';
import './ValidationFiltersWidgetComponent.scss';
import ValidationFiltersWidgetController from './ValidationFiltersWidgetController';

@Component({
    template: require('./ValidationFiltersWidgetComponent.pug'),
    components: {}
})
export default class ValidationFiltersWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private start_update: boolean = false;

    private async handle_validate() {
        if (this.start_update) {
            return;
        }

        this.start_update = true;

        await ValidationFiltersWidgetController.getInstance().throttle_call_updaters(
            new ValidationFiltersCallUpdaters(
                this.dashboard_page.dashboard_id,
                this.dashboard_page.id,
                this.page_widget.id
            )
        );

        this.start_update = false;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: ValidationFiltersWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ValidationFiltersWidgetOptions;
                options = options ? new ValidationFiltersWidgetOptions() : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}