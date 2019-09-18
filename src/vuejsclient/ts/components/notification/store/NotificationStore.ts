import { moment } from 'fullcalendar';
import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import NotificationVO from '../../../../../shared/modules/PushData/vos/NotificationVO';
import IStoreModule from '../../../store/IStoreModule';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';

export type NotificationContext = ActionContext<INotificationState, any>;

export interface INotificationState {
    notifications_by_ids: { [id: number]: NotificationVO };
    is_updating: boolean;
    notif_viewer_opened: boolean;
}



export default class NotificationStore implements IStoreModule<INotificationState, NotificationContext> {

    public static getInstance(): NotificationStore {
        if (!NotificationStore.instance) {
            NotificationStore.instance = new NotificationStore();
        }
        return NotificationStore.instance;
    }

    private static instance: NotificationStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<INotificationState, NotificationContext>;
    public mutations: MutationTree<INotificationState>;
    public actions: ActionTree<INotificationState, NotificationContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "NotificationStore";


        this.state = {
            notifications_by_ids: {},
            is_updating: false,
            notif_viewer_opened: false
        };


        this.getters = {

            get_notifications_by_ids(state: INotificationState): { [id: number]: NotificationVO } { return state.notifications_by_ids; },
            get_is_updating(state: INotificationState): boolean { return state.is_updating; },
            get_notif_viewer_opened(state: INotificationState): boolean { return state.notif_viewer_opened; },

            get_nb_unread(state: INotificationState): number {
                let res: number = 0;

                if (!state.notifications_by_ids) {
                    return 0;
                }

                for (let i in state.notifications_by_ids) {
                    if (!state.notifications_by_ids[i].read) {
                        res++;
                    }
                }

                return res;
            },
        };

        this.mutations = {

            set_notifications_by_ids(state: INotificationState, notifications_by_ids: { [id: number]: NotificationVO }) { state.notifications_by_ids = notifications_by_ids; },
            // delete_notification(state: INotificationState, notification: NotificationVO) { Vue.delete(state.notifications_by_ids as any, notification.id); },
            add_notification(state: INotificationState, notification: NotificationVO) { Vue.set(state.notifications_by_ids as any, notification.id, notification); },
            async read_notification(state: INotificationState, notification: NotificationVO) {
                state.notifications_by_ids[notification.id].read = true;
                state.notifications_by_ids[notification.id].read_date = moment();
                await ModuleDAO.getInstance().insertOrUpdateVO(notification);
            },
            set_is_updating(state: INotificationState, is_updating: boolean) { state.is_updating = is_updating; },
            set_notif_viewer_opened(state: INotificationState, notif_viewer_opened: boolean) { state.notif_viewer_opened = notif_viewer_opened; },
        };



        this.actions = {
            set_notifications_by_ids(context: NotificationContext, notifications_by_ids: { [id: number]: NotificationVO }) { commit_set_notifications_by_ids(context, notifications_by_ids); },
            // delete_notification(context: NotificationContext, notification: NotificationVO) { commit_delete_notification(context, notification); },
            add_notification(context: NotificationContext, notification: NotificationVO) { commit_add_notification(context, notification); },
            read_notification(context: NotificationContext, notification: NotificationVO) { commit_read_notification(context, notification); },
            set_is_updating(context: NotificationContext, is_updating: boolean) { commit_set_is_updating(context, is_updating); },
            set_notif_viewer_opened(context: NotificationContext, notif_viewer_opened: boolean) { commit_set_notif_viewer_opened(context, notif_viewer_opened); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<INotificationState, any>("NotificationStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleNotificationGetter = namespace('NotificationStore', Getter);
export const ModuleNotificationAction = namespace('NotificationStore', Action);

export const commit_set_notifications_by_ids = commit(NotificationStore.getInstance().mutations.set_notifications_by_ids);
// export const commit_delete_notification = commit(NotificationStore.getInstance().mutations.delete_notification);
export const commit_add_notification = commit(NotificationStore.getInstance().mutations.add_notification);
export const commit_read_notification = commit(NotificationStore.getInstance().mutations.read_notification);
export const commit_set_is_updating = commit(NotificationStore.getInstance().mutations.set_is_updating);
export const commit_set_notif_viewer_opened = commit(NotificationStore.getInstance().mutations.set_notif_viewer_opened);