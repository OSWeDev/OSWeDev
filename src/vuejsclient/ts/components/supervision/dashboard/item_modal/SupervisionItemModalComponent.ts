import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import VueComponentBase from '../../../VueComponentBase';
import SupervisedItemComponent from '../../item/SupervisedItemComponent';
import { ModuleSupervisionAction, ModuleSupervisionGetter } from '../SupervisionDashboardStore';
// import './SupervisionItemModalComponent.scss';

@Component({
    template: require('./SupervisionItemModalComponent.pug'),
    components: {
        Superviseditemcomponent: SupervisedItemComponent
    }
})
export default class SupervisionItemModalComponent extends VueComponentBase {

    @ModuleSupervisionAction
    private set_selected_item: (selected_item: ISupervisedItem) => void;

    @ModuleSupervisionGetter
    private get_selected_item: ISupervisedItem;

    @Prop({ default: false })
    private noclick: boolean;

    @Prop({ default: false })
    private default_hide_item_graph: boolean;

    @Prop({ default: false })
    private display_item_in_same_p: boolean;

    // get supervised_item_controller(): ISupervisedItemController<any> {
    //     return SupervisionController.getInstance().registered_controllers[this.item._type];
    // }

    private closemodal() {
        this.set_selected_item(null);
        // $('#supervision_item_modal').modal('hide');
    }

}