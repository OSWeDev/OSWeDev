import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import { ModuleAlertGetter } from './AlertStore';
import AlertViewComponent from './AlertViewComponent';
import './AlertComponent.scss';
import Alert from '../../../../shared/modules/Alert/vos/Alert';

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

    @Prop({ default: 'bottom-center' })
    private tooltip_placement: string;

    @Prop({ default: null })
    private path: string;

    get alerts(): Alert[] {
        if ((!this.path) || (!this.get_alerts)) {
            return null;
        }

        return this.get_alerts[this.path];
    }

    get is_error(): boolean {
        if (!this.alerts) {
            return null;
        }

        return this.alerts[0].type >= Alert.TYPE_ERROR;
    }

    get is_warn(): boolean {
        if (!this.alerts) {
            return null;
        }

        if (this.is_error) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_WARN;
    }

    get is_info(): boolean {
        if (!this.alerts) {
            return null;
        }

        if (this.is_warn || this.is_error) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_INFO;
    }

    get is_debug(): boolean {
        if (!this.alerts) {
            return null;
        }

        if (this.is_warn || this.is_error || this.is_info) {
            return false;
        }

        return this.alerts[0].type >= Alert.TYPE_DEBUG;
    }
}