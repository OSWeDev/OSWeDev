import { Component, Prop } from 'vue-property-decorator';
import 'vue-tables-2';
import NotificationVO from '../../../../../../shared/modules/PushData/vos/NotificationVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleNotificationAction } from '../../store/NotificationStore';
import './UserNotifComponent.scss';
const moment = require('moment');
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';

@Component({
    template: require('./UserNotifComponent.pug')
})
export default class UserNotifComponent extends VueComponentBase {

    @ModuleNotificationAction
    public read_notification: (notification: NotificationVO) => void;

    @Prop()
    private notification: NotificationVO;

    get date_notification(): string {
        if (!this.notification) {
            return null;
        }

        return ModuleFormatDatesNombres.getInstance().formatMoment_to_YYYYMMDD_HHmmss(this.notification.creation_date);
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