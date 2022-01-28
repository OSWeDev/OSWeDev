import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import Alert from '../../../../shared/modules/Alert/vos/Alert';
import VueComponentBase from '../VueComponentBase';
import './AlertComponent.scss';
import { ModuleAlertGetter } from './AlertStore';
import AlertViewComponent from './AlertViewComponent';

@Component({
    template: require('./AlertComponent.pug'),
    components: {
        Alertviewcomponent: AlertViewComponent
    }
})
export default class AlertComponent extends VueComponentBase {

    @ModuleAlertGetter
    private get_alerts: { [path: string]: Alert[] };

    @Prop({ default: 16 })
    private offset: number;

    @Prop({ default: 'bottom' })
    private tooltip_direction: string;

    @Prop({ default: 'center' })
    private tooltip_align: string;

    @Prop({ default: true })
    private toggle_visible_on_click: boolean;

    @Prop({ default: null })
    private path: string;

    @Prop({ default: true })
    private show_alert_date: boolean;

    @Prop({ default: true })
    private show_alert_content: boolean;

    @Prop({ default: true })
    private show_popover: boolean;

    get tooltip_visibility(): string {
        return this.toggle_visible_on_click ? 'focus' : 'hover';
    }

    get alerts(): Alert[] {
        if ((!this.path) || (!this.get_alerts)) {
            return null;
        }

        return this.get_alerts[this.path];
    }

    get is_error(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        return this.alerts[0].type >= Alert.TYPE_ERROR;
    }

    get is_warn(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        if (this.is_error) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_WARN;
    }

    get is_info(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        if (this.is_warn || this.is_error) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_INFO;
    }

    get is_debug(): boolean {
        if (!this.has_alerts) {
            return null;
        }

        if (this.is_warn || this.is_error || this.is_info) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_DEBUG;
    }

    get has_alerts(): boolean {
        return this.alerts && this.alerts.length > 0;
    }
}