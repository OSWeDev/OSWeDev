import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import VueComponentBase from '../VueComponentBase';
import './AlertViewComponent.scss';
import Alert from '../../../../shared/modules/Alert/vos/Alert';

@Component({
    template: require('./AlertViewComponent.pug'),
    components: {}
})
export default class AlertViewComponent extends VueComponentBase {

    @Prop()
    private alert: Alert;

    get is_error(): boolean {
        if (!this.alert) {
            return false;
        }

        return this.alert.type >= Alert.TYPE_ERROR;
    }

    get is_warn(): boolean {
        if (!this.alert) {
            return false;
        }

        if (this.is_error) {
            return false;
        }

        return this.alert.type >= Alert.TYPE_WARN;
    }

    get is_info(): boolean {
        if (!this.alert) {
            return false;
        }

        if (this.is_warn || this.is_error) {
            return false;
        }

        return this.alert.type >= Alert.TYPE_INFO;
    }

    get is_debug(): boolean {
        if (!this.alert) {
            return false;
        }

        if (this.is_warn || this.is_error || this.is_info) {
            return false;
        }

        return this.alert.type >= Alert.TYPE_DEBUG;
    }

    get date_alert(): string {
        if (!this.alert) {
            return null;
        }

        return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(this.alert.creation_date);
    }
}