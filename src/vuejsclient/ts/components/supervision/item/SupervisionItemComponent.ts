import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import './SupervisionItemComponent.scss';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import debounce = require('lodash/debounce');

@Component({
    template: require('./SupervisionItemComponent.pug'),
    components: {}
})
export default class SupervisionItemComponent extends VueComponentBase {

    @Prop()
    private supervised_item_id: number;

    @Prop()
    private supervised_item_vo_type: string;

    private supervised_item: ISupervisedItem = null;
    private debounced_load_supervised_item = debounce(this.load_supervised_item, 200);
    private continue_reloading: boolean = true;
    private historiques: ISupervisedItem[] = [];

    private async mounted() {

        this.continue_reloading = true;
        await this.load_supervised_item_and_continue();
    }

    private async beforeDestroy() {
        this.continue_reloading = false;
    }

    private async switch_paused() {
        if (this.supervised_item.state == SupervisionController.STATE_PAUSED) {
            this.supervised_item.state = SupervisionController.STATE_UNKOWN;
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
        setTimeout(this.load_supervised_item_and_continue.bind(this), (60000));
    }

    private async load_supervised_item() {
        if ((!this.supervised_item_id) || (!this.supervised_item_vo_type)) {
            this.supervised_item = null;
            return;
        }
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
}