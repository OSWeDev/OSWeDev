import { Component } from 'vue-property-decorator';
import 'vue-tables-2';
import NotificationVO from '../../../../../../shared/modules/PushData/vos/NotificationVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleNotificationAction, ModuleNotificationGetter } from '../../store/NotificationStore';
import UserNotifComponent from '../UserNotif/UserNotifComponent';
import './UserNotifsViewerComponent.scss';
import moment = require('moment');
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';

@Component({
    template: require('./UserNotifsViewerComponent.pug'),
    components: {
        UserNotifComponent: UserNotifComponent
    }
})
export default class UserNotifsViewerComponent extends VueComponentBase {
    @ModuleNotificationGetter
    public get_notifications_by_ids: { [id: number]: NotificationVO };
    @ModuleNotificationGetter
    public get_is_updating: boolean;
    @ModuleNotificationGetter
    public get_notif_viewer_opened: boolean;
    @ModuleNotificationGetter
    public get_nb_unread: number;

    @ModuleNotificationAction
    public set_notif_viewer_opened: (notif_viewer_opened: boolean) => void;
    @ModuleNotificationAction
    public read_notification: (notification: NotificationVO) => void;

    private async delete_all() {

        this.set_notif_viewer_opened(false);
        for (let i in this.get_notifications_by_ids) {

            let notif = this.get_notifications_by_ids[i];

            if (notif.read) {
                continue;
            }

            this.read_notification(notif);
        }
    }

    get notifs_by_priority(): NotificationVO[] {
        let res: NotificationVO[] = [];

        if (!this.get_notifications_by_ids) {
            return [];
        }

        for (let i in this.get_notifications_by_ids) {
            let notif = this.get_notifications_by_ids[i];

            if (notif.notification_type != NotificationVO.TYPE_NOTIF_SIMPLE) {
                continue;
            }

            if (notif.read) {
                continue;
            }

            res.push(notif);
        }

        res.sort((a: NotificationVO, b: NotificationVO) => {

            return b.creation_date.diff(a.creation_date);
            // return b.simple_notif_type - a.simple_notif_type;
        });

        return res;
    }
}