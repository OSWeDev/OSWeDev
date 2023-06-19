import { ActionContext, ActionTree, GetterTree } from 'vuex';
import ExportDataToXLSXParamVO from '../../../shared/modules/DataExport/vos/apis/ExportDataToXLSXParamVO';
import IStoreModule from './IStoreModule';
import { store_mutations_names } from './StoreModuleBase';

export type AppMainStoreContext = ActionContext<IAppMainStoreState, any>;

export interface IAppMainStoreState {
    editionMode: boolean;
    editTime: number;
    printable: boolean;
    hook_export_data_to_XLSX: () => ExportDataToXLSXParamVO;
    print_component: any;
    onprint: () => void;
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
    public mutations = {
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
        set_onprint(state: IAppMainStoreState, onprint: () => void) {
            state.onprint = onprint;
        },
        register_hook_export_data_to_XLSX(state: IAppMainStoreState, hook: () => ExportDataToXLSXParamVO) {
            state.hook_export_data_to_XLSX = hook;
        },
        register_print_component(state: IAppMainStoreState, print_component: any) {
            state.print_component = print_component;
        },
    };

    public actions: ActionTree<IAppMainStoreState, AppMainStoreContext>;

    protected constructor() {
        this.state = {
            editionMode: false,
            editTime: 0,
            printable: false,
            hook_export_data_to_XLSX: null,
            print_component: null,
            onprint: null,
        };

        this.getters = {
            printable(state: IAppMainStoreState): boolean {
                return state.printable;
            },
            onprint(state: IAppMainStoreState): () => void {
                return state.onprint;
            },
            exportableToXLSX(state: IAppMainStoreState): boolean {
                return !!state.hook_export_data_to_XLSX;
            },
            hook_export_data_to_XLSX(state: IAppMainStoreState): () => ExportDataToXLSXParamVO {
                return state.hook_export_data_to_XLSX;
            },
            print_component(state: IAppMainStoreState): any {
                return state.print_component;
            },
        };

        this.actions = {
            PRINT_ENABLE: (context: AppMainStoreContext) => context.commit(store_mutations_names(this).PRINT_ENABLE),
            PRINT_DISABLE: (context: AppMainStoreContext) => context.commit(store_mutations_names(this).PRINT_DISABLE),
            set_onprint: (context: AppMainStoreContext, onprint: () => void) => context.commit(store_mutations_names(this).set_onprint, onprint),
            register_hook_export_data_to_XLSX: (context: AppMainStoreContext, hook: () => ExportDataToXLSXParamVO) => context.commit(store_mutations_names(this).register_hook_export_data_to_XLSX, hook),
            register_print_component: (context: AppMainStoreContext, print_component: any) => context.commit(store_mutations_names(this).register_print_component, print_component),
        };
    }
}