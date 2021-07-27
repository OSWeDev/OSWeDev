import { Component, Prop } from 'vue-property-decorator';
import NotificationVO from '../../../../../../shared/modules/PushData/vos/NotificationVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleNotificationAction } from '../../store/NotificationStore';
import './UserNotifComponent.scss';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import { RawLocation } from 'vue-router';
import { Dictionary } from 'vue-router/types/router';
import * as moment from 'moment';

@Component({
    template: require('./UserNotifComponent.pug')
})
export default class UserNotifComponent extends VueComponentBase {

    @ModuleNotificationAction
    public read_notification: (notification: NotificationVO) => void;

    @Prop()
    private notification: NotificationVO;


    private redirect_notification(): void {
        if (!this.notification || !this.notification.notif_route) {
            return null;
        }
        let location: RawLocation = { name: this.notification.notif_route };
        if (!!this.notification.notif_route_params_name
            && !!this.notification.notif_route_params_name.length
            && !!this.notification.notif_route_params_values
            && !!this.notification.notif_route_params_values.length
            && this.notification.notif_route_params_name.length == this.notification.notif_route_params_values.length
        ) {
            let location_params: Dictionary<string> = {};
            for (let n_index in this.notification.notif_route_params_name) {
                let key = this.notification.notif_route_params_name[n_index];
                let value = this.notification.notif_route_params_values[n_index];

                location_params[key] = value;
            }
            location.params = location_params;
        }

        this.$router.push(location);
    }

    get date_notification(): string {
        if (!this.notification) {
            return null;
        }

        return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(moment(this.notification.creation_date).utc(true));
    }

    get is_warn(): boolean {
        return this.notification && (this.notification.simple_notif_type == NotificationVO.SIMPLE_WARN);
    }

    get is_error(): boolean {
        return this.notification && (this.notification.simple_notif_type == NotificationVO.SIMPLE_ERROR);
    }

    get is_info(): boolean {
        return this.notification && (this.notification.simple_notif_type == NotificationVO.SIMPLE_INFO);
    }

    get is_success(): boolean {
        return this.notification && (this.notification.simple_notif_type == NotificationVO.SIMPLE_SUCCESS);
    }
}