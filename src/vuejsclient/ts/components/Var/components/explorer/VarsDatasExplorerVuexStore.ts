import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import VarDataBaseVO from "../../../../../../shared/modules/Var/vos/VarDataBaseVO";
import IStoreModule from "../../../../store/IStoreModule";
import { store_mutations_names } from "../../../../store/StoreModuleBase";

export type VarsDatasExplorerContext = ActionContext<IVarsDatasExplorerVueXState, any>;

export interface IVarsDatasExplorerVueXState {

    filter_params: VarDataBaseVO[];
    filtered_datas: { [index: string]: VarDataBaseVO };
}

export default class VarsDatasExplorerStoreModule implements IStoreModule<IVarsDatasExplorerVueXState, VarsDatasExplorerContext> {

    // istanbul ignore next: nothing to test
    public static getInstance(): VarsDatasExplorerStoreModule {
        if (!VarsDatasExplorerStoreModule.instance) {
            VarsDatasExplorerStoreModule.instance = new VarsDatasExplorerStoreModule();
        }
        return VarsDatasExplorerStoreModule.instance;
    }

    private static instance: VarsDatasExplorerStoreModule;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IVarsDatasExplorerVueXState, VarsDatasExplorerContext>;
    public mutations = {
        set_filter_params: (state: IVarsDatasExplorerVueXState, filter_params: VarDataBaseVO[]) => state.filter_params = filter_params,
        set_filtered_datas: (state: IVarsDatasExplorerVueXState, filtered_datas: { [index: string]: VarDataBaseVO }) => state.filtered_datas = filtered_datas,
    };
    public actions: ActionTree<IVarsDatasExplorerVueXState, VarsDatasExplorerContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "VarsDatasExplorerVuexStore";


        this.state = {
            filter_params: [],
            filtered_datas: {}
        };

        this.getters = {
            get_filter_params: (state: IVarsDatasExplorerVueXState) => state.filter_params,
            get_filtered_datas: (state: IVarsDatasExplorerVueXState) => state.filtered_datas,
        };

        this.actions = {
            set_filter_params: (context: VarsDatasExplorerContext, filter_params: VarDataBaseVO[]) => context.commit(store_mutations_names(this).set_filter_params, filter_params),
            set_filtered_datas: (context: VarsDatasExplorerContext, filtered_datas: { [index: string]: VarDataBaseVO }) => context.commit(store_mutations_names(this).set_filtered_datas, filtered_datas),
        };
    }
}

export const VarsDatasExplorerVuexStore = VarsDatasExplorerStoreModule.getInstance();

export const ModuleVarsDatasExplorerVuexGetter = namespace('VarsDatasExplorerVuexStore', Getter);
export const ModuleVarsDatasExplorerVuexAction = namespace('VarsDatasExplorerVuexStore', Action);