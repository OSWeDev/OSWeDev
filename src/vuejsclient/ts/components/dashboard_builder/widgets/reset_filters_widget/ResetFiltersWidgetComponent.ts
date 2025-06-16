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

@Component({
    template: require('./ResetFiltersWidgetComponent.pug'),
    components: {}
})
export default class ResetFiltersWidgetComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private start_update: boolean = false;

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
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