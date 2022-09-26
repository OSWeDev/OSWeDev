import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import { ModuleSupervisionAction, ModuleSupervisionGetter } from '../SupervisionDashboardStore';
import './SupervisionDashboardItemComponent.scss';

@Component({
    template: require('./SupervisionDashboardItemComponent.pug'),
    components: {}
})
export default class SupervisionDashboardItemComponent extends VueComponentBase {

    @ModuleSupervisionAction
    private set_selected_item: (selected_item: ISupervisedItem) => void;

    @ModuleSupervisionAction
    private set_selected_item_for_delete: (selected_item: ISupervisedItem) => void;


    @Prop()
    private item: ISupervisedItem;

    @Prop({ default: false })
    private noclick: boolean;

    @Prop({ default: false })
    private coche: boolean;

    private state_classname: string = 'STATE_UNKNOWN';
    private fa_class_name: string = null;
    private formatted_date: string = null;
    private formatted_last_value: string = null;

    public add_item(valid: boolean) {
        this.coche = valid;
    }
    @Watch('item', { immediate: true })
    private onchange_item() {
        this.set_state_classname();
        this.set_fa_class_name();
        this.set_formatted_date();
        this.set_formatted_last_value();
    }
    // @Watch('coche')
    // private onchange_coche() {
    //     this.set_coche();
    // }

    // private cocher() {
    //     if (this.coche) {
    //         this.coche = false;
    //     } else {
    //         this.coche = true;
    //     }
    //     if (this.coche) {
    //         this.set_selected_item_for_delete(this.item);

    //     } else {
    //         let x = this.get_selected_item_for_delete();
    //         if (x.findIndex((item) => item.id == this.item.id) != -1) {
    //             x.splice(x.findIndex((item) => item.id == this.item.id), 1);
    //         }
    //         this.set_selected_item_for_delete(x);
    //     }
    // }

    private set_state_classname() {
        if (!this.item) {
            this.state_classname = "STATE_UNKNOWN";
            return;
        }

        let state_classname: string = null;

        switch (this.item.state) {
            case SupervisionController.STATE_ERROR:
                state_classname = "STATE_ERROR";
                break;
            case SupervisionController.STATE_ERROR_READ:
                state_classname = "STATE_ERROR_READ";
                break;
            case SupervisionController.STATE_OK:
                state_classname = "STATE_OK";
                break;
            case SupervisionController.STATE_PAUSED:
                state_classname = "STATE_PAUSED";
                break;
            case SupervisionController.STATE_UNKOWN:
                state_classname = "STATE_UNKOWN";
                break;
            case SupervisionController.STATE_WARN:
                state_classname = "STATE_WARN";
                break;
            case SupervisionController.STATE_WARN_READ:
                state_classname = "STATE_WARN_READ";
                break;
            default:
                break;
        }

        this.state_classname = state_classname;
    }

    private set_fa_class_name() {
        if (!this.state_classname) {
            this.fa_class_name = "";
            return;
        }

        let fa_class_name: string = null;

        switch (this.state_classname) {
            case "STATE_ERROR":
                fa_class_name = "fa-exclamation-triangle";
                break;
            case "STATE_ERROR_READ":
                fa_class_name = "fa-exclamation-triangle";
                break;
            case "STATE_OK":
                fa_class_name = "fa-check";
                break;
            case "STATE_PAUSED":
                fa_class_name = "fa-pause";
                break;
            case "STATE_UNKOWN":
                fa_class_name = "fa-question";
                break;
            case "STATE_WARN":
                fa_class_name = "fa-exclamation";
                break;
            case "STATE_WARN_READ":
                fa_class_name = "fa-exclamation";
                break;
            default:
                break;
        }

        this.fa_class_name = fa_class_name;
    }

    private set_formatted_date() {
        if (!this.item) {
            this.formatted_date = null;
            return;
        }

        this.formatted_date = this.item.last_update ? Dates.format(this.item.last_update, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss) : "-";
    }

    private set_formatted_last_value() {
        if (!this.item) {
            this.formatted_last_value = null;
            return;
        }
        this.formatted_last_value = this.item.last_value == null ? "-" : this.item.last_value.toLocaleString();
    }

    get supervised_item_controller(): ISupervisedItemController<any> {
        return SupervisionController.getInstance().registered_controllers[this.item._type];
    }

    get router_to() {
        return {
            name: SupervisionController.ROUTE_NAME_DASHBOARD_ITEM,
            params: {
                dashboard_key: this.$route.params.dashboard_key,
                supervised_item_vo_type: this.item._type,
                supervised_item_vo_id: this.item.id.toString(),
            }
        };
    }
    private item_selected() {
        this.$emit('item_selected', this.item);
    }

}