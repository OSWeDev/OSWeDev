import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import { ModuleSupervisionAction, ModuleSupervisionGetter } from '../SupervisionDashboardStore';
import './SupervisionDashboardWidgetComponent.scss';

@Component({
    template: require('./SupervisionDashboardWidgetComponent.pug'),
    components: {}
})
export default class SupervisionDashboardWidgetComponent extends VueComponentBase {

    @ModuleSupervisionAction
    private switch_show_errors: () => void;
    @ModuleSupervisionAction
    private switch_show_errors_read: () => void;
    @ModuleSupervisionAction
    private switch_show_warns: () => void;
    @ModuleSupervisionAction
    private switch_show_warns_read: () => void;
    @ModuleSupervisionAction
    private switch_show_oks: () => void;
    @ModuleSupervisionAction
    private switch_show_pauseds: () => void;
    @ModuleSupervisionAction
    private switch_show_unknowns: () => void;

    @ModuleSupervisionGetter
    private get_show_errors: boolean;
    @ModuleSupervisionGetter
    private get_show_errors_read: boolean;
    @ModuleSupervisionGetter
    private get_show_warns: boolean;
    @ModuleSupervisionGetter
    private get_show_warns_read: boolean;
    @ModuleSupervisionGetter
    private get_show_oks: boolean;
    @ModuleSupervisionGetter
    private get_show_pauseds: boolean;
    @ModuleSupervisionGetter
    private get_show_unknowns: boolean;

    @Prop()
    private state_classname: string;

    @Prop()
    private nb_elts: string;

    get fa_class_name(): string {
        if (!this.state_classname) {
            return "";
        }

        switch (this.state_classname) {
            case "STATE_ERROR":
                return "fa-exclamation-triangle" + (this.get_show_errors ? "" : " not_selected");
            case "STATE_ERROR_READ":
                return "fa-exclamation-triangle" + (this.get_show_errors_read ? "" : " not_selected");
            case "STATE_OK":
                return "fa-check" + (this.get_show_oks ? "" : " not_selected");
            case "STATE_PAUSED":
                return "fa-pause" + (this.get_show_pauseds ? "" : " not_selected");
            case "STATE_UNKOWN":
                return "fa-question" + (this.get_show_unknowns ? "" : " not_selected");
            case "STATE_WARN":
                return "fa-exclamation" + (this.get_show_warns ? "" : " not_selected");
            case "STATE_WARN_READ":
                return "fa-exclamation" + (this.get_show_warns_read ? "" : " not_selected");
            default:
                break;
        }
    }

    private switch_visibility() {
        if (!this.state_classname) {
            return;
        }

        switch (this.state_classname) {
            case "STATE_ERROR":
                this.switch_show_errors();
                break;
            case "STATE_ERROR_READ":
                this.switch_show_errors_read();
                break;
            case "STATE_OK":
                this.switch_show_oks();
                break;
            case "STATE_PAUSED":
                this.switch_show_pauseds();
                break;
            case "STATE_UNKOWN":
                this.switch_show_unknowns();
                break;
            case "STATE_WARN":
                this.switch_show_warns();
                break;
            case "STATE_WARN_READ":
                this.switch_show_warns_read();
                break;
            default:
                break;
        }
    }

    get full_state_class_name(): string {
        if (!this.state_classname) {
            return "";
        }

        switch (this.state_classname) {
            case "STATE_ERROR":
                return this.state_classname + ' ' + (this.get_show_errors ? "" : "not_selected");
            case "STATE_ERROR_READ":
                return this.state_classname + ' ' + (this.get_show_errors_read ? "" : "not_selected");
            case "STATE_OK":
                return this.state_classname + ' ' + (this.get_show_oks ? "" : "not_selected");
            case "STATE_PAUSED":
                return this.state_classname + ' ' + (this.get_show_pauseds ? "" : "not_selected");
            case "STATE_UNKOWN":
                return this.state_classname + ' ' + (this.get_show_unknowns ? "" : "not_selected");
            case "STATE_WARN":
                return this.state_classname + ' ' + (this.get_show_warns ? "" : "not_selected");
            case "STATE_WARN_READ":
                return this.state_classname + ' ' + (this.get_show_warns_read ? "" : "not_selected");
            default:
                break;
        }
    }

}