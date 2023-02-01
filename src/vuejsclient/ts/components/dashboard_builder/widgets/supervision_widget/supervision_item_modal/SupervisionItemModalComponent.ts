import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import ICheckList from '../../../../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ISupervisedItem from '../../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import CheckListControllerBase from '../../../../CheckList/CheckListControllerBase';
import CheckListModalComponent from '../../../../CheckList/modal/CheckListModalComponent';
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
        this.selected_item = selected_item;
        $('#supervision_item_modal').modal('show');
    }

    public closemodal() {
        $('#supervision_item_modal').modal('hide');
        this.selected_item = null;
    }
}