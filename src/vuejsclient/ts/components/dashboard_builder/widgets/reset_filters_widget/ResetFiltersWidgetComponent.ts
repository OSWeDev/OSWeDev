import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../../VueComponentBase';
import ResetFiltersWidgetOptions from './options/ResetFiltersWidgetOptions';
import './ResetFiltersWidgetComponent.scss';
import ResetFiltersWidgetController from './ResetFiltersWidgetController';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./ResetFiltersWidgetComponent.pug'),
    components: {}
})
export default class ResetFiltersWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private start_update: boolean = false;

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

    public clear_active_field_filters() {
        return this.vuexAct(reflect<this>().clear_active_field_filters);
    }


    private async reset() {
        if (this.start_update) {
            return;
        }

        this.start_update = true;

        let updaters: { [page_widget_id: number]: () => Promise<void> } = {};

        if (
            ResetFiltersWidgetController.getInstance().reseters &&
            ResetFiltersWidgetController.getInstance().reseters[this.dashboard_page.dashboard_id]
        ) {
            updaters = ResetFiltersWidgetController.getInstance().reseters[this.dashboard_page.dashboard_id][this.dashboard_page.id];
        }

        const promises = [];

        for (const page_widget_id in updaters) {
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
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ResetFiltersWidgetOptions;
                options = options ? new ResetFiltersWidgetOptions() : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}