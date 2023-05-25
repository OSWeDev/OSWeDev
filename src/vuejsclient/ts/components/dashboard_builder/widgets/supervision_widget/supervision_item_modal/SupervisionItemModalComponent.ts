import Component from 'vue-class-component';
import 'vue-slider-component/theme/default.css';
import ISupervisedItem from '../../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisedItemComponent from '../../../../supervision/item/SupervisedItemComponent';
import VueComponentBase from '../../../../VueComponentBase';
import './SupervisionItemModalComponent.scss';

@Component({
    template: require('./SupervisionItemModalComponent.pug'),
    components: {
        Superviseditemcomponent: SupervisedItemComponent,
    }
})
export default class SupervisionItemModalComponent extends VueComponentBase {

    private selected_item: ISupervisedItem = null;

    public openmodal(selected_item: ISupervisedItem) {
        console.log(selected_item);

        this.selected_item = selected_item;

        $('#supervision_item_modal').modal('show');
    }

    public closemodal() {
        $('#supervision_item_modal').modal('hide');
        this.selected_item = null;
    }
}