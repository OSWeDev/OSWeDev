import * as moment from 'moment';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import Alert from '../../../../shared/modules/Alert/vos/Alert';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import VueComponentBase from '../VueComponentBase';
import './AlertViewComponent.scss';

@Component({
    template: require('./AlertViewComponent.pug'),
    components: {}
})
export default class AlertViewComponent extends VueComponentBase {

    @Prop()
    private alert: Alert;

    @Prop({ default: true })
    private show_alert_date: boolean;

    @Prop({ default: true })
    private show_alert_content: boolean;

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

        return Dates.format(this.alert.creation_date, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
    }
}