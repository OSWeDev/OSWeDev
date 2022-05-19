import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../store/IStoreModule';

export type DocumentContext = ActionContext<IDocumentState, any>;

export interface IDocumentState {
    hidden: boolean;
    only_routename: boolean;
    has_docs_route_name: { [route_name: string]: boolean };
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
            only_routename: false,
            has_docs_route_name: {},
        };


        this.getters = {

            get_hidden(state: IDocumentState): boolean { return state.hidden; },
            get_only_routename(state: IDocumentState): boolean { return state.only_routename; },
            get_has_docs_route_name(state: IDocumentState): { [route_name: string]: boolean } { return state.has_docs_route_name; },
        };

        this.mutations = {

            set_hidden(state: IDocumentState, hidden: boolean) { state.hidden = hidden; },
            set_only_routename(state: IDocumentState, only_routename: boolean) { state.only_routename = only_routename; },
            set_has_docs_route_name(state: IDocumentState, has_docs_route_name: { [route_name: string]: boolean }) { state.has_docs_route_name = has_docs_route_name; },
        };



        this.actions = {
            set_hidden(context: DocumentContext, hidden: boolean) { commit_set_hidden(context, hidden); },
            set_only_routename(context: DocumentContext, only_routename: boolean) { commit_set_only_routename(context, only_routename); },
            set_has_docs_route_name(context: DocumentContext, has_docs_route_name: { [route_name: string]: boolean }) { commit_set_has_docs_route_name(context, has_docs_route_name); },
        };
    }
}

const { commit, read, dispatch } =
    getStoreAccessors<IDocumentState, any>("DocumentStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDocumentGetter = namespace('DocumentStore', Getter);
export const ModuleDocumentAction = namespace('DocumentStore', Action);

export const commit_set_hidden = commit(DocumentStore.getInstance().mutations.set_hidden);
export const commit_set_only_routename = commit(DocumentStore.getInstance().mutations.set_only_routename);
export const commit_set_has_docs_route_name = commit(DocumentStore.getInstance().mutations.set_has_docs_route_name);
