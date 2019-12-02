import Vue from 'vue';
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import Alert from './Alert';
import moment = require('moment');
import IStoreModule from '../../store/IStoreModule';

export type AlertContext = ActionContext<IAlertState, any>;

export interface IAlertState {
    alerts: { [path: string]: Alert[] };
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
    public mutations: MutationTree<IAlertState>;
    public actions: ActionTree<IAlertState, AlertContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "AlertStore";


        this.state = {
            alerts: {}
        };


        this.getters = {
            get_alerts: (state: IAlertState): any => state.alerts,
        };

        this.mutations = {
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

                    if (a.creation_date.isAfter(alert.creation_date)) {
                        state.alerts[alert.path].splice(index, 0, alert);
                        return;
                    }
                }

                state.alerts[alert.path].splice(state.alerts[alert.path].length, 0, alert);
            },
        };



        this.actions = {
            clear_alerts: (context: AlertContext): any => commit_clear_alerts(context, null),
            register_alert: (context: AlertContext, alert: Alert) => commit_register_alert(context, alert),
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IAlertState, any>("AlertStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleAlertGetter = namespace('AlertStore', Getter);
export const ModuleAlertAction = namespace('AlertStore', Action);

export const commit_clear_alerts = commit(AlertStore.getInstance().mutations.clear_alerts);
export const commit_register_alert = commit(AlertStore.getInstance().mutations.register_alert);