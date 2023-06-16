import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import Alert from '../../../../shared/modules/Alert/vos/Alert';
import IStoreModule from '../../store/IStoreModule';
import { store_mutations_names } from '../../store/StoreModuleBase';

export type AlertContext = ActionContext<IAlertState, any>;

export interface IAlertState {
    alerts: { [path: string]: Alert[] };
    titles: { [path: string]: { translatable_code: string, translation_params: { [param_name: string]: any } } };
    alerts_list: { [path: string]: number };
    show_alerts_list: boolean;
}

export default class AlertStore implements IStoreModule<IAlertState, AlertContext> {

    public static getInstance(): AlertStore {
        if (!AlertStore.instance) {
            AlertStore.instance = new AlertStore();
        }
        return AlertStore.instance;
    }

    private static instance: AlertStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IAlertState, AlertContext>;
    public mutations = {
        clear_alerts: (state: IAlertState): any => {
            let alerts = state.alerts;

            state.alerts = {};

            for (let i in alerts) {
                let path_alerts = alerts[i];

                for (let j in path_alerts) {
                    let alert = path_alerts[j];

                    if (alert.pinned) {

                        if (!state.alerts[i]) {
                            state.alerts[i] = [];
                        }

                        state.alerts[i].push(alert);
                    }
                }
            }
        },

        register_alert: (state: IAlertState, alert: Alert) => {
            if (!state.alerts[alert.path]) {
                Vue.set(state.alerts as any, alert.path, [alert]);
                return;
            }

            for (let i in state.alerts[alert.path]) {
                let a = state.alerts[alert.path][i];
                let index = parseInt(i.toString());

                if (a.type > alert.type) {
                    continue;
                }

                if (a.type < alert.type) {
                    state.alerts[alert.path].splice(index, 0, alert);
                    return;
                }

                if (a.creation_date > alert.creation_date) {
                    state.alerts[alert.path].splice(index, 0, alert);
                    return;
                }
            }

            state.alerts[alert.path].splice(state.alerts[alert.path].length, 0, alert);
        },

        register_alerts: (state: IAlertState, alerts: Alert[]) => {
            for (let j in alerts) {
                let alert = alerts[j];

                if (!state.alerts[alert.path]) {
                    Vue.set(state.alerts as any, alert.path, [alert]);
                    continue;
                }

                let inserted: boolean = false;
                for (let i in state.alerts[alert.path]) {
                    let a = state.alerts[alert.path][i];
                    let index = parseInt(i.toString());

                    if (a.type > alert.type) {
                        continue;
                    }

                    if (a.type < alert.type) {
                        inserted = true;
                        state.alerts[alert.path].splice(index, 0, alert);
                        break;
                    }

                    if (a.creation_date > alert.creation_date) {
                        inserted = true;
                        state.alerts[alert.path].splice(index, 0, alert);
                        break;
                    }
                }

                if (!inserted) {
                    state.alerts[alert.path].splice(state.alerts[alert.path].length, 0, alert);
                }
            }
        },

        replace_alerts: (state: IAlertState, params: { alert_path: string, alerts: Alert[] }) => {

            let new_alerts: Alert[] = [];

            // On reprend les alertes pinned :
            if (!!state.alerts[params.alert_path]) {

                for (let i in state.alerts[params.alert_path]) {
                    let alert: Alert = state.alerts[params.alert_path][i];

                    if (!alert.pinned) {
                        continue;
                    }

                    new_alerts.push(alert);
                }
            }

            if ((!!params.alerts) && (!!params.alerts.length)) {
                new_alerts = new_alerts.concat(params.alerts);
            }

            Vue.set(state.alerts as any, params.alert_path, new_alerts);
        },

        set_title: (state: IAlertState, params: { alert_path: string, translatable_code: string, translation_params: { [param_name: string]: any } }) => {
            if (!params.alert_path) {
                return;
            }
            state.titles[params.alert_path] = { translatable_code: params.translatable_code, translation_params: params.translation_params };
        },

        register_path_in_alerts_list: (state: IAlertState, alert_path: string) => {
            if (!alert_path) {
                return;
            }

            if (!state.alerts_list[alert_path]) {
                state.alerts_list[alert_path] = 0;
            }
            state.alerts_list[alert_path]++;
        },

        unregister_path_in_alerts_list: (state: IAlertState, alert_path: string) => {
            if (!alert_path) {
                return;
            }

            if (!state.alerts_list[alert_path]) {
                return;
            }
            state.alerts_list[alert_path]--;

            if (state.alerts_list[alert_path] <= 0) {
                Vue.delete(state.alerts_list as any, alert_path);
            }
        },

        toggle_show_alerts_list: (state: IAlertState) => {
            state.show_alerts_list = !state.show_alerts_list;
        },
    };
    public actions: ActionTree<IAlertState, AlertContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "AlertStore";


        this.state = {
            alerts: {},
            titles: {},
            alerts_list: {},
            show_alerts_list: false,
        };


        this.getters = {
            get_alerts: (state: IAlertState): any => state.alerts,
            get_titles: (state: IAlertState): any => state.titles,
            get_alerts_list: (state: IAlertState): any => state.alerts_list,
            get_show_alerts_list: (state: IAlertState): any => state.show_alerts_list,
        };

        this.actions = {
            clear_alerts: (context: AlertContext): any => context.commit(store_mutations_names(this).clear_alerts, null),
            register_alert: (context: AlertContext, alert: Alert) => context.commit(store_mutations_names(this).register_alert, alert),
            register_alerts: (context: AlertContext, alerts: Alert[]) => context.commit(store_mutations_names(this).register_alerts, alerts),
            replace_alerts: (context: AlertContext, params: { alert_path: string, alerts: Alert[] }) => context.commit(store_mutations_names(this).replace_alerts, params),
            set_title: (context: AlertContext, params: { alert_path: string, title: string }) => context.commit(store_mutations_names(this).set_title, params),
            register_path_in_alerts_list: (context: AlertContext, alert_path: string) => context.commit(store_mutations_names(this).register_path_in_alerts_list, alert_path),
            unregister_path_in_alerts_list: (context: AlertContext, alert_path: string) => context.commit(store_mutations_names(this).unregister_path_in_alerts_list, alert_path),
            toggle_show_alerts_list: (context: AlertContext) => context.commit(store_mutations_names(this).toggle_show_alerts_list, null),
        };
    }
}

export const ModuleAlertGetter = namespace('AlertStore', Getter);
export const ModuleAlertAction = namespace('AlertStore', Action);