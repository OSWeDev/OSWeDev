import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

export type VarContext = ActionContext<IVarState, any>;

export interface IVarState {
    desc_mode: boolean;
    desc_selected_var_param: VarDataBaseVO;
    desc_selected_var_param_historic: VarDataBaseVO[];
    desc_deps_opened: boolean;
    desc_registrations_opened: boolean;
    desc_funcstats_opened: boolean;
    desc_selected_var_param_historic_i: number;

    show_public_tooltip: boolean;
}

export default class VarStore implements IStoreModule<IVarState, VarContext> {

    // istanbul ignore next: nothing to test
    public static getInstance(): VarStore {
        if (!VarStore.instance) {
            VarStore.instance = new VarStore();
        }
        return VarStore.instance;
    }

    private static instance: VarStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IVarState, VarContext>;
    public mutations = {

        set_show_public_tooltip(state: IVarState, show_public_tooltip: boolean) {
            state.show_public_tooltip = show_public_tooltip;
        },

        setDescDepsOpened(state: IVarState, desc_deps_opened: boolean) {
            state.desc_deps_opened = desc_deps_opened;
        },

        setDescRegistrationsOpened(state: IVarState, desc_registrations_opened: boolean) {
            state.desc_registrations_opened = desc_registrations_opened;
        },

        setDescFuncStatsOpened(state: IVarState, desc_funcstats_opened: boolean) {
            state.desc_funcstats_opened = desc_funcstats_opened;
        },

        setDescMode(state: IVarState, desc_mode: boolean) {
            state.desc_mode = desc_mode;
        },

        set_desc_selected_var_param_historic_i(state: IVarState, desc_selected_var_param_historic_i: number) {
            state.desc_selected_var_param_historic_i = desc_selected_var_param_historic_i;
        },

        setDescSelectedVarParam(state: IVarState, desc_selected_var_param: VarDataBaseVO) {
            state.desc_selected_var_param = desc_selected_var_param;
            state.desc_deps_opened = false;

            /**
             * Si on ajoute un élément déjà cohérent avec l'historique, on déplace juste le i
             * sinon on tronque l'historique et on push la nouvelle var
             */
            if (state.desc_selected_var_param_historic_i < state.desc_selected_var_param_historic.length - 1) {

                state.desc_selected_var_param_historic_i++;
                if (desc_selected_var_param.index == state.desc_selected_var_param_historic[state.desc_selected_var_param_historic_i].index) {
                    return;
                }

                state.desc_selected_var_param_historic.splice(
                    state.desc_selected_var_param_historic_i, state.desc_selected_var_param_historic.length - state.desc_selected_var_param_historic_i);
                state.desc_selected_var_param_historic.push(state.desc_selected_var_param);
            } else {
                state.desc_selected_var_param_historic.push(state.desc_selected_var_param);
                state.desc_selected_var_param_historic_i++;
            }
        },
    };
    public actions: ActionTree<IVarState, VarContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "VarStore";


        this.state = {
            desc_mode: false,
            desc_selected_var_param: null,
            desc_selected_var_param_historic_i: -1,
            desc_selected_var_param_historic: [],
            desc_deps_opened: false,
            desc_registrations_opened: false,
            desc_funcstats_opened: false,
            show_public_tooltip: false,
        };


        this.getters = {
            isDescDepsOpened(state: IVarState): boolean {
                return state.desc_deps_opened;
            },
            isDescRegistrationsOpened(state: IVarState): boolean {
                return state.desc_registrations_opened;
            },
            isDescFuncStatsOpened(state: IVarState): boolean {
                return state.desc_funcstats_opened;
            },
            isDescMode(state: IVarState): boolean {
                return state.desc_mode;
            },
            getDescSelectedVarParam(state: IVarState): VarDataBaseVO {
                return state.desc_selected_var_param;
            },
            get_desc_selected_var_param_historic(state: IVarState): VarDataBaseVO[] {
                return state.desc_selected_var_param_historic;
            },
            get_desc_selected_var_param_historic_i(state: IVarState): number {
                return state.desc_selected_var_param_historic_i;
            },
            is_show_public_tooltip(state: IVarState): boolean {
                return state.show_public_tooltip;
            },
        };

        this.actions = {

            set_show_public_tooltip: (context: VarContext, show_public_tooltip: boolean) => context.commit(store_mutations_names(this).set_show_public_tooltip, show_public_tooltip),

            setDescMode: (context: VarContext, desc_mode: boolean) => context.commit(store_mutations_names(this).setDescMode, desc_mode),

            setDescDepsOpened: (context: VarContext, desc_deps_opened: boolean) => context.commit(store_mutations_names(this).setDescDepsOpened, desc_deps_opened),
            setDescRegistrationsOpened: (context: VarContext, desc_registrations_opened: boolean) => context.commit(store_mutations_names(this).setDescRegistrationsOpened, desc_registrations_opened),
            set_desc_selected_var_param_historic_i: (context: VarContext, desc_selected_var_param_historic_i: number) => context.commit(store_mutations_names(this).set_desc_selected_var_param_historic_i, desc_selected_var_param_historic_i),
            setDescFuncStatsOpened: (context: VarContext, desc_funcstats_opened: boolean) => context.commit(store_mutations_names(this).setDescFuncStatsOpened, desc_funcstats_opened),
            setDescSelectedVarParam: (context: VarContext, desc_selected_var_param: string) => context.commit(store_mutations_names(this).setDescSelectedVarParam, desc_selected_var_param),
        };
    }
}

export const ModuleVarGetter = namespace('VarStore', Getter);
export const ModuleVarAction = namespace('VarStore', Action);