import Component from 'vue-class-component';
import 'vue-slider-component/theme/default.css';
import ISupervisedItem from '../../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisedItemComponent from '../../../../supervision/item/SupervisedItemComponent';
import VueComponentBase from '../../../../VueComponentBase';
import './SupervisionItemModalComponent.scss';
import SupervisionController from '../../../../../../../shared/modules/Supervision/SupervisionController';

@Component({
    template: require('./SupervisionItemModalComponent.pug'),
    components: {
        Superviseditemcomponent: SupervisedItemComponent,
    }
})
export default class SupervisionItemModalComponent extends VueComponentBase {


    private selected_item: ISupervisedItem = null;
    private has_access_pause: boolean = false;
    private split_char: string = null;

    public openmodal(selected_item: ISupervisedItem, has_access_pause: boolean, split_char: string) {
        console.log(selected_item);

        this.selected_item = selected_item;
        this.has_access_pause = has_access_pause;
        this.split_char = split_char;

        $('#supervision_item_modal').modal('show');
    }

    public closemodal() {
        $('#supervision_item_modal').modal('hide');
        this.selected_item = null;
    }

    private get_split_name(): string {
        return SupervisionController.getInstance().get_item_split_name(this.selected_item?.name, this.split_char);
    }
}