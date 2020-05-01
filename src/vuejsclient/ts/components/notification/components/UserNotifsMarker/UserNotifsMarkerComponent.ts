import { Component } from 'vue-property-decorator';
import 'vue-tables-2';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import NotificationVO from '../../../../../../shared/modules/PushData/vos/NotificationVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueAppController from '../../../../../VueAppController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleNotificationAction, ModuleNotificationGetter } from '../../store/NotificationStore';
import UserNotifsViewerComponent from '../UserNotifsViewer/UserNotifsViewerComponent';
import './UserNotifsMarkerComponent.scss';

@Component({
    template: require('./UserNotifsMarkerComponent.pug'),
    components: {
        Usernotifsviewercomponent: UserNotifsViewerComponent
    }
})
export default class UserNotifsMarkerComponent extends VueComponentBase {
    @ModuleNotificationGetter
    public get_is_updating: boolean;
    @ModuleNotificationGetter
    public get_nb_unread: number;
    @ModuleNotificationGetter
    public get_notif_viewer_opened: boolean;

    @ModuleNotificationAction
    public set_notifications_by_ids: (notifications_by_ids: { [id: number]: NotificationVO }) => void;
    @ModuleNotificationAction
    public set_is_updating: (is_updating: boolean) => void;
    @ModuleNotificationAction
    public set_notif_viewer_opened: (notif_viewer_opened: boolean) => void;

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
}