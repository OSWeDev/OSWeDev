import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

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
    public mutations = {
        setSelectedVOs(state: ICRUDState, selectedVOs: IDistantVOBase[]) {
            state.selectedVOs = selectedVOs;
        },
    };
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

        this.actions = {
            setSelectedVOs: (context: CRUDContext, selectedVOs: IDistantVOBase[]) => context.commit(store_mutations_names(this).setSelectedVOs, selectedVOs)
        };
    }
}

export const crudStore = CRUDStore.getInstance();
export const ModuleCRUDGetter = namespace('CRUDStore', Getter);
export const ModuleCRUDAction = namespace('CRUDStore', Action);
