import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import ShowFavoritesFiltersWidgetOptions from './options/ShowFavoritesFiltersWidgetOptions';
import ShowFavoritesFiltersWidgetController from './ShowFavoritesFiltersWidgetController';
import './ShowFavoritesFiltersWidgetComponent.scss';

@Component({
    template: require('./ShowFavoritesFiltersWidgetComponent.pug'),
    components: {}
})
export default class ShowFavoritesFiltersWidgetComponent extends VueComponentBase {

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

        await ShowFavoritesFiltersWidgetController.getInstance().throttle_call_updaters(null);

        this.start_update = false;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: ShowFavoritesFiltersWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ShowFavoritesFiltersWidgetOptions;
                options = options ? new ShowFavoritesFiltersWidgetOptions() : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}