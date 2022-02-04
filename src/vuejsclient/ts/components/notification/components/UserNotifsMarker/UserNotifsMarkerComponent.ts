import { Component } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import NotificationVO from '../../../../../../shared/modules/PushData/vos/NotificationVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueAppController from '../../../../../VueAppController';
import { ModuleBootstrapTemplateGetter } from '../../../BootstrapTemplate/store/BootstrapTemplateStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleNotificationAction, ModuleNotificationGetter } from '../../store/NotificationStore';
import UserNotifComponent from '../UserNotif/UserNotifComponent';
import './UserNotifsMarkerComponent.scss';

@Component({
    template: require('./UserNotifsMarkerComponent.pug'),
    components: {
        Usernotifcomponent: UserNotifComponent
    }
})
export default class UserNotifsMarkerComponent extends VueComponentBase {

    @ModuleBootstrapTemplateGetter
    private get_fa_navbarbtn_style: string;

    @ModuleBootstrapTemplateGetter
    private get_nav_outlinebtn: string;

    @ModuleNotificationGetter
    private get_is_updating: boolean;
    @ModuleNotificationGetter
    private get_nb_unread: number;
    @ModuleNotificationGetter
    private get_notif_viewer_opened: boolean;

    @ModuleNotificationAction
    private set_notifications_by_ids: (notifications_by_ids: { [id: number]: NotificationVO }) => void;
    @ModuleNotificationAction
    private set_is_updating: (is_updating: boolean) => void;
    @ModuleNotificationAction
    private set_notif_viewer_opened: (notif_viewer_opened: boolean) => void;

    @ModuleNotificationGetter
    private get_notifications_by_ids: { [id: number]: NotificationVO };
    @ModuleNotificationAction
    private read_notification: (notification: NotificationVO) => void;

    public async mounted() {

        await this.reload_notifications();
    }

    private async reload_notifications() {

        if (!VueAppController.getInstance().data_user) {
            return;
        }

        this.set_is_updating(true);
        this.set_notifications_by_ids(VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByRefFieldIds<NotificationVO>(NotificationVO.API_TYPE_ID, 'user_id', [VueAppController.getInstance().data_user.id])));
        this.set_is_updating(false);
    }

    private switch_notifs_visibility() {
        this.set_notif_viewer_opened(!this.get_notif_viewer_opened);
    }

    private async read_all() {

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

            if (notif.notification_type != NotificationVO.TYPE_NOTIF_SIMPLE && notif.notification_type != NotificationVO.TYPE_NOTIF_REDIRECT) {
                continue;
            }

            if (notif.read) {
                continue;
            }

            res.push(notif);
        }

        res.sort((a: NotificationVO, b: NotificationVO) => {

            return b.creation_date - a.creation_date;
            // return b.simple_notif_type - a.simple_notif_type;
        });

        return res;
    }
}