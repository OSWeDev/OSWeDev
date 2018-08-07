import IStoreModule from './IStoreModule';
import { ActionContext, GetterTree, MutationTree, ActionTree } from 'vuex';
import ExportDataToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';

export type AppMainStoreContext = ActionContext<IAppMainStoreState, any>;

export interface IAppMainStoreState {
    editionMode: boolean;
    editTime: number;
    printable: boolean;
    hook_export_data_to_XLSX: () => ExportDataToXLSXParamVO;
}

export default class AppMainStoreModule implements IStoreModule<IAppMainStoreState, AppMainStoreContext> {

    public static getInstance(): AppMainStoreModule {
        if (!AppMainStoreModule.instance) {
            AppMainStoreModule.instance = new AppMainStoreModule();
        }
        return AppMainStoreModule.instance;
    }

    private static instance: AppMainStoreModule;

    public namespaced: boolean = false;
    public module_name: string;
    public state: any;
    public getters: GetterTree<IAppMainStoreState, AppMainStoreContext>;
    public mutations: MutationTree<IAppMainStoreState>;
    public actions: ActionTree<IAppMainStoreState, AppMainStoreContext>;

    protected constructor() {
        this.state = {
            editionMode: false,
            editTime: 0,
            printable: false,
            hook_export_data_to_XLSX: null
        };

        this.getters = {
            printable(state: IAppMainStoreState): boolean {
                return state.printable;
            },
            exportableToXLSX(state: IAppMainStoreState): boolean {
                return !!state.hook_export_data_to_XLSX;
            },
            hook_export_data_to_XLSX(state: IAppMainStoreState): () => ExportDataToXLSXParamVO {
                return state.hook_export_data_to_XLSX;
            }
        };

        this.mutations = {
            activateEdition(state: IAppMainStoreState) {
                // On ajoute une info pour pas risquer de désactiver "trop vite" en cas de plusieurs modules l'un sur l'autre (revenue-index et my-store au hasard)
                state.editTime = (new Date()).getTime();
                state.editionMode = true;
            },
            deactivateEdition(state: IAppMainStoreState) {
                if (((new Date()).getTime() - state.editTime) > 500) {
                    state.editionMode = false;
                }
            },
            PRINT_ENABLE(state: IAppMainStoreState) {
                state.printable = true;
            },
            PRINT_DISABLE(state: IAppMainStoreState) {
                state.printable = false;
            },
            register_hook_export_data_to_XLSX(state: IAppMainStoreState, hook: () => ExportDataToXLSXParamVO) {
                state.hook_export_data_to_XLSX = hook;
            }
        };

        this.actions = {
            PRINT_ENABLE(context: AppMainStoreContext) {
                context.commit("PRINT_ENABLE");
            },
            PRINT_DISABLE(context: AppMainStoreContext) {
                context.commit("PRINT_DISABLE");
            },
            register_hook_export_data_to_XLSX(context: AppMainStoreContext, hook: () => ExportDataToXLSXParamVO) {
                context.commit("register_hook_export_data_to_XLSX", hook);
            }
        };
    }
}