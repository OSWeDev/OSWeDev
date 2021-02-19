import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ISupervisedItem from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../../shared/modules/Supervision/SupervisionController';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import './SupervisionDashboardItemComponent.scss';

@Component({
    template: require('./SupervisionDashboardItemComponent.pug'),
    components: {}
})
export default class SupervisionDashboardItemComponent extends VueComponentBase {

    @Prop()
    private item: ISupervisedItem;

    @Prop({ default: false })
    private noclick: boolean;

    get state_classname(): string {
        if (!this.item) {
            return "STATE_UNKNOWN";
        }

        switch (this.item.state) {
            case SupervisionController.STATE_ERROR:
                return "STATE_ERROR";
            case SupervisionController.STATE_ERROR_READ:
                return "STATE_ERROR_READ";
            case SupervisionController.STATE_OK:
                return "STATE_OK";
            case SupervisionController.STATE_PAUSED:
                return "STATE_PAUSED";
            case SupervisionController.STATE_UNKOWN:
                return "STATE_UNKOWN";
            case SupervisionController.STATE_WARN:
                return "STATE_WARN";
            case SupervisionController.STATE_WARN_READ:
                return "STATE_WARN_READ";
            default:
                break;
        }
    }

    get fa_class_name(): string {
        if (!this.state_classname) {
            return "";
        }

        switch (this.state_classname) {
            case "STATE_ERROR":
                return "fa-exclamation-triangle";
            case "STATE_ERROR_READ":
                return "fa-exclamation-triangle";
            case "STATE_OK":
                return "fa-check";
            case "STATE_PAUSED":
                return "fa-pause";
            case "STATE_UNKOWN":
                return "fa-question";
            case "STATE_WARN":
                return "fa-exclamation";
            case "STATE_WARN_READ":
                return "fa-exclamation";
            default:
                break;
        }
    }

    get formatted_date(): string {
        if (!this.item) {
            return null;
        }
        return this.item.last_update ? ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(this.item.last_update) : "-";
    }

    get formatted_last_value(): string {
        if (!this.item) {
            return null;
        }
        return this.item.last_value == null ? "-" : this.item.last_value.toLocaleString();
    }

    get supervised_item_controller(): ISupervisedItemController<any> {
        return SupervisionController.getInstance().registered_controllers[this.item._type];
    }

    private open_item() {
        if (!this.item) {
            return;
        }

        window.open('/admin#/supervision/item/' + this.item._type + '/' + this.item.id, "_blank");
    }
}