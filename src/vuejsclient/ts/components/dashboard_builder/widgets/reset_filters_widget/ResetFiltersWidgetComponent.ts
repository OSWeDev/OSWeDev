import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../page/DashboardPageStore';
import ResetFiltersWidgetOptions from './options/ResetFiltersWidgetOptions';
import './ResetFiltersWidgetComponent.scss';
import ResetFiltersWidgetController from './ResetFiltersWidgetController';

@Component({
    template: require('./ResetFiltersWidgetComponent.pug'),
    components: {}
})
export default class ResetFiltersWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageAction
    private clear_active_field_filters: () => void;

    private start_update: boolean = false;

    private async reset() {
        if (this.start_update) {
            return;
        }

        this.start_update = true;

        let updaters: { [page_widget_id: number]: () => Promise<void> } = {};

        if (
            ResetFiltersWidgetController.getInstance().updaters &&
            ResetFiltersWidgetController.getInstance().updaters[this.dashboard_page.dashboard_id]
        ) {
            updaters = ResetFiltersWidgetController.getInstance().updaters[this.dashboard_page.dashboard_id][this.dashboard_page.id];
        }

        let promises = [];

        for (let page_widget_id in updaters) {
            promises.push(updaters[page_widget_id]());
        }

        await all_promises(promises);

        this.clear_active_field_filters();

        this.start_update = false;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: ResetFiltersWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ResetFiltersWidgetOptions;
                options = options ? new ResetFiltersWidgetOptions() : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}