import { debounce } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemClientController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemClientController';
import ISupervisedItemController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import ISupervisedItemGraphSegmentation from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemGraphSegmentation';
import ISupervisedItemURL from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemURL';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../../modules/AjaxCache/AjaxCacheClientController';
import SupervisionDashboardItemComponent from '../dashboard/item/SupervisionDashboardItemComponent';
import SupervisionClientController from '../SupervisionClientController';
import SupervisedItemHistChartComponent from './hist_chart/SupervisedItemHistChartComponent';
import './SupervisedItemComponent.scss';

@Component({
    template: require('./SupervisedItemComponent.pug'),
    components: {
        Superviseditemhistchartcomponent: SupervisedItemHistChartComponent,
        Supervisiondashboarditemcomponent: SupervisionDashboardItemComponent
    }
})
export default class SupervisedItemComponent extends VueComponentBase {

    @Prop()
    private supervised_item_id: number;

    @Prop()
    private supervised_item_vo_type: string;

    private supervised_item: ISupervisedItem = null;
    private debounced_load_supervised_item = debounce(this.load_supervised_item, 200);
    private continue_reloading: boolean = true;
    private historiques: ISupervisedItem[] = [];
    private active_graph_segmentation: ISupervisedItemGraphSegmentation = null;

    get supervised_item_client_controller(): ISupervisedItemClientController<any> {
        return SupervisionClientController.getInstance().registered_client_controllers[this.supervised_item_vo_type];
    }

    get supervised_item_controller(): ISupervisedItemController<any> {
        return SupervisionController.getInstance().registered_controllers[this.supervised_item_vo_type];
    }

    get supervised_item_urls(): ISupervisedItemURL[] {
        if (!this.supervised_item_controller) {
            return null;
        }
        return this.supervised_item_controller.get_urls(this.supervised_item);
    }

    get is_paused(): boolean {
        return this.supervised_item && (this.supervised_item.state == SupervisionController.STATE_PAUSED);
    }

    get is_read(): boolean {
        return this.supervised_item &&
            ((this.supervised_item.state == SupervisionController.STATE_ERROR_READ) || (this.supervised_item.state == SupervisionController.STATE_WARN_READ));
    }

    @Watch('supervised_item')
    private onchange_supervised_item_activate_default_segm() {
        this.activate_segmentation(this.default_graph_segmentation);
    }

    private activate_segmentation(graph_segmentation: ISupervisedItemGraphSegmentation) {
        this.active_graph_segmentation = graph_segmentation;
    }

    get default_graph_segmentation() {
        if ((!this.supervised_item) || (!this.supervised_item_client_controller)) {
            return null;
        }

        let segms = this.supervised_item_client_controller.get_graph_segmentation(this.supervised_item);
        if (!segms) {
            return null;
        }

        return segms[0];
    }

    get can_not_switch_read(): boolean {
        return (!this.supervised_item) ||
            ((this.supervised_item.state == SupervisionController.STATE_OK) ||
                (this.supervised_item.state == SupervisionController.STATE_UNKOWN) ||
                (this.supervised_item.state == SupervisionController.STATE_PAUSED));
    }

    private async switch_read() {
        switch (this.supervised_item.state) {
            case SupervisionController.STATE_ERROR_READ:
                this.supervised_item.state = SupervisionController.STATE_ERROR;
                break;
            case SupervisionController.STATE_ERROR:
                this.supervised_item.state = SupervisionController.STATE_ERROR_READ;
                break;
            case SupervisionController.STATE_WARN:
                this.supervised_item.state = SupervisionController.STATE_WARN_READ;
                break;
            case SupervisionController.STATE_WARN_READ:
                this.supervised_item.state = SupervisionController.STATE_WARN;
                break;
            default:
                return;
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.supervised_item);
        await this.debounced_load_supervised_item();
    }

    private async mounted() {

        this.continue_reloading = true;
        await this.load_supervised_item_and_continue();
    }

    private async beforeDestroy() {
        this.continue_reloading = false;
    }

    private async switch_paused() {
        if (this.supervised_item.state == SupervisionController.STATE_PAUSED) {
            this.supervised_item.state = this.supervised_item.state_before_pause;
        } else {
            this.supervised_item.state = SupervisionController.STATE_PAUSED;
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.supervised_item);
        await this.debounced_load_supervised_item();
    }

    @Watch('supervised_item_id')
    @Watch('supervised_item_vo_type')
    private async onchange_supervised_item() {
        await this.debounced_load_supervised_item();
    }

    private async load_supervised_item_and_continue() {
        if (!this.continue_reloading) {
            return;
        }

        await this.debounced_load_supervised_item();
        setTimeout(this.load_supervised_item_and_continue.bind(this), (10000));
    }

    private async load_supervised_item() {
        if ((!this.supervised_item_id) || (!this.supervised_item_vo_type)) {
            this.supervised_item = null;
            return;
        }

        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.supervised_item_vo_type, SupervisionController.getInstance().getSupHistVoType(this.supervised_item_vo_type)]);
        this.supervised_item = await ModuleDAO.getInstance().getVoById(this.supervised_item_vo_type, this.supervised_item_id);

        let tmp_hist: ISupervisedItem[] = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<ISupervisedItem>(
            SupervisionController.getInstance().getSupHistVoType(this.supervised_item_vo_type), null, null, 'name', [this.supervised_item.name]);
        let current_value: ISupervisedItem = await ModuleDAO.getInstance().getNamedVoByName<ISupervisedItem>(this.supervised_item_vo_type, this.supervised_item.name);
        tmp_hist.push(current_value);

        tmp_hist = tmp_hist.filter((elt: ISupervisedItem) => (elt.last_update != null));

        tmp_hist.sort((a: ISupervisedItem, b: ISupervisedItem) => {
            if (a.last_update.isBefore(b.last_update)) {
                return -1;
            }

            if (a.last_update.isAfter(b.last_update)) {
                return 1;
            }

            return 0;
        });

        this.historiques = tmp_hist;
    }

    private open_url(url: string) {
        window.open(url, "_blank");
    }
}