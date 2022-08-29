import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../../VueComponentBase';
import ValidationFiltersWidgetOptions from './options/ValidationFiltersWidgetOptions';
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

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
    }

    private async validate() {
        if (this.start_update) {
            return;
        }

        this.start_update = true;

        let updaters: { [page_widget_id: number]: () => Promise<void> } = {};

        if (
            ValidationFiltersWidgetController.getInstance().updaters &&
            ValidationFiltersWidgetController.getInstance().updaters[this.dashboard_page.dashboard_id]
        ) {
            updaters = ValidationFiltersWidgetController.getInstance().updaters[this.dashboard_page.dashboard_id][this.dashboard_page.id];
        }

        let promises = [];

        for (let page_widget_id in updaters) {
            promises.push(updaters[page_widget_id]());
        }

        await all_promises(promises);

        this.start_update = false;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: ValidationFiltersWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ValidationFiltersWidgetOptions;
                options = options ? new ValidationFiltersWidgetOptions() : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}