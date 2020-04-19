import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';

export type DocumentContext = ActionContext<IDocumentState, any>;

export interface IDocumentState {
    hidden: boolean;
}

export default class DocumentStore implements IStoreModule<IDocumentState, DocumentContext> {

    public static getInstance(): DocumentStore {
        if (!DocumentStore.instance) {
            DocumentStore.instance = new DocumentStore();
        }
        return DocumentStore.instance;
    }

    private static instance: DocumentStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDocumentState, DocumentContext>;
    public mutations: MutationTree<IDocumentState>;
    public actions: ActionTree<IDocumentState, DocumentContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "DocumentStore";


        this.state = {
            hidden: true,
        };


        this.getters = {

            get_hidden(state: IDocumentState): boolean { return state.hidden; },
        };

        this.mutations = {

            set_hidden(state: IDocumentState, hidden: boolean) { state.hidden = hidden; },
        };



        this.actions = {
            set_hidden(context: DocumentContext, hidden: boolean) { commit_set_hidden(context, hidden); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IDocumentState, any>("DocumentStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDocumentGetter = namespace('DocumentStore', Getter);
export const ModuleDocumentAction = namespace('DocumentStore', Action);

export const commit_set_hidden = commit(DocumentStore.getInstance().mutations.set_hidden);
