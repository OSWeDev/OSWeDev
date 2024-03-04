
import debounce from 'lodash/debounce';
import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import NotificationVO from '../../../../../shared/modules/PushData/vos/NotificationVO';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from '../../../store/StoreModuleBase';

export type NotificationContext = ActionContext<INotificationState, any>;

export interface INotificationState {
    notifications_by_ids: { [id: number]: NotificationVO };
    is_updating: boolean;
    notif_viewer_opened: boolean;
    mark_as_read: NotificationVO[];
}



export default class NotificationStore implements IStoreModule<INotificationState, NotificationContext> {

    // istanbul ignore next: nothing to test
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
    public mutations = {

        set_notifications_by_ids(state: INotificationState, notifications_by_ids: { [id: number]: NotificationVO }) { state.notifications_by_ids = notifications_by_ids; },
        add_notification(state: INotificationState, notification: NotificationVO) { Vue.set(state.notifications_by_ids as any, notification.id, notification); },
        add_notifications(state: INotificationState, notifications: NotificationVO[]) {

            for (let i in notifications) {
                let notification = notifications[i];
                Vue.set(state.notifications_by_ids as any, notification.id, notification);
            }
        },
        read_notification(state: INotificationState, notification: NotificationVO) {
            state.notifications_by_ids[notification.id].read = true;
            state.notifications_by_ids[notification.id].read_date = Dates.now();

            state.mark_as_read.push(state.notifications_by_ids[notification.id]);
            NotificationStore.getInstance().debounced_read_notifs();
        },
        set_is_updating(state: INotificationState, is_updating: boolean) { state.is_updating = is_updating; },
        set_notif_viewer_opened(state: INotificationState, notif_viewer_opened: boolean) { state.notif_viewer_opened = notif_viewer_opened; },
    };
    public actions: ActionTree<INotificationState, NotificationContext>;
    public namespaced: boolean = true;
    private debounced_read_notifs = debounce(this.read_notifs, 200);

    protected constructor() {
        this.module_name = "NotificationStore";


        this.state = {
            notifications_by_ids: {},
            is_updating: false,
            notif_viewer_opened: false,
            mark_as_read: []
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

        this.actions = {
            set_notifications_by_ids: (context: NotificationContext, notifications_by_ids: { [id: number]: NotificationVO }) => context.commit(store_mutations_names(this).set_notifications_by_ids, notifications_by_ids),
            add_notification: (context: NotificationContext, notification: NotificationVO) => context.commit(store_mutations_names(this).add_notification, notification),
            add_notifications: (context: NotificationContext, notifications: NotificationVO[]) => context.commit(store_mutations_names(this).add_notifications, notifications),
            read_notification: (context: NotificationContext, notification: NotificationVO) => context.commit(store_mutations_names(this).read_notification, notification),
            set_is_updating: (context: NotificationContext, is_updating: boolean) => context.commit(store_mutations_names(this).set_is_updating, is_updating),
            set_notif_viewer_opened: (context: NotificationContext, notif_viewer_opened: boolean) => context.commit(store_mutations_names(this).set_notif_viewer_opened, notif_viewer_opened),
        };
    }

    private async read_notifs() {
        if ((!this.state.mark_as_read) || (!this.state.mark_as_read.length)) {
            return;
        }
        await ModuleDAO.getInstance().insertOrUpdateVOs(this.state.mark_as_read);
        this.state.mark_as_read = [];
    }
}

export const ModuleNotificationGetter = namespace('NotificationStore', Getter);
export const ModuleNotificationAction = namespace('NotificationStore', Action);