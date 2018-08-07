import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import IStoreModule from '../../../../../vuejsclient/ts/store/IStoreModule';

export type CRUDContext = ActionContext<ICRUDState, any>;

export interface ICRUDState {
    selectedVOs: IDistantVOBase[];
}


export default class CRUDStore implements IStoreModule<ICRUDState, CRUDContext> {

    public static getInstance(): CRUDStore {
        if (!CRUDStore.instance) {
            CRUDStore.instance = new CRUDStore();
        }
        return CRUDStore.instance;
    }

    private static instance: CRUDStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<ICRUDState, CRUDContext>;
    public mutations: MutationTree<ICRUDState>;
    public actions: ActionTree<ICRUDState, CRUDContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "CRUDStore";


        this.state = {
            selectedVOs: []
        };


        this.getters = {
            getSelectedVOs(state: ICRUDState): IDistantVOBase[] {
                return state.selectedVOs;
            },
        };



        this.mutations = {
            setSelectedVOs(state: ICRUDState, selectedVOs: IDistantVOBase[]) {
                state.selectedVOs = selectedVOs;
            },

        };



        this.actions = {
            setSelectedVOs(context: CRUDContext, selectedVOs: IDistantVOBase[]) {
                commitSetSelectedVOs(context, selectedVOs);
            }
        };
    }
}

export const crudStore = CRUDStore.getInstance();


const { commit, read, dispatch } =
    getStoreAccessors<ICRUDState, any>("CRUDStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleCRUDGetter = namespace('CRUDStore', Getter);
export const ModuleCRUDAction = namespace('CRUDStore', Action);

export const commitSetSelectedVOs = commit(crudStore.mutations.setSelectedVOs);
