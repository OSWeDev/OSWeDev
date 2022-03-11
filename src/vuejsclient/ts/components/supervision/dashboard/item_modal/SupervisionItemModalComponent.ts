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

    // get supervised_item_controller(): ISupervisedItemController<any> {
    //     return SupervisionController.getInstance().registered_controllers[this.item._type];
    // }
    private mounted() {
        $("#supervision_item_modal").on("hidden.bs.modal", () => {
            this.closemodal();
        });
    }

    private closemodal() {
        this.set_selected_item(null);
        this.$router.push({
            name: SupervisionController.ROUTE_NAME_DASHBOARD,
            params: {
                dashboard_key: this.$route.params.dashboard_key
            },
        });
        $('#supervision_item_modal').modal('hide');
    }

}