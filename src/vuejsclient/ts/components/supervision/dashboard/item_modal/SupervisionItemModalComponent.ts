import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
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

    @ModuleSupervisionGetter
    private get_has_access_pause: boolean;

    @Prop({ default: false })
    private noclick: boolean;

    @Prop({ default: null })
    private split_char: string;

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

    private get_split_name(): string {
        return SupervisionController.getInstance().get_item_split_name(this.get_selected_item?.name, this.split_char);
    }

}