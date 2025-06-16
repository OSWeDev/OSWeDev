import { ActionContext, ActionTree, GetterTree } from "vuex";
import { namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../store/IStoreModule';
import { store_mutations_names } from '../../store/StoreModuleBase';
import SharedFiltersModalComponent from '../dashboard_builder/shared_filters/modal/SharedFiltersModalComponent';
import ChecklistItemModalComponent from '../dashboard_builder/widgets/checklist_widget/checklist_item_modal/ChecklistItemModalComponent';
import FavoritesFiltersModalComponent from '../dashboard_builder/widgets/favorites_filters_widget/modal/FavoritesFiltersModalComponent';
import CRUDCreateModalComponent from '../dashboard_builder/widgets/table_widget/crud_modals/create/CRUDCreateModalComponent';
import CRUDUpdateModalComponent from '../dashboard_builder/widgets/table_widget/crud_modals/update/CRUDUpdateModalComponent';
import SupervisionItemModalComponent from '../supervision/dashboard/item_modal/SupervisionItemModalComponent';

export type ModalsAndBasicPageComponentsHolderContext = ActionContext<IModalsAndBasicPageComponentsHolderState, any>;

export interface IModalsAndBasicPageComponentsHolderState {

    Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent;
    Sharedfiltersmodalcomponent: SharedFiltersModalComponent;
    Checklistitemmodalcomponent: ChecklistItemModalComponent;
    Supervisionitemmodal: SupervisionItemModalComponent;
    Crudupdatemodalcomponent: CRUDUpdateModalComponent;
    Crudcreatemodalcomponent: CRUDCreateModalComponent;
}

export default class ModalsAndBasicPageComponentsHolderStore implements IStoreModule<IModalsAndBasicPageComponentsHolderState, ModalsAndBasicPageComponentsHolderContext> {
    public static instance: ModalsAndBasicPageComponentsHolderStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IModalsAndBasicPageComponentsHolderState, ModalsAndBasicPageComponentsHolderContext>;
    public mutations = {

        set_Checklistitemmodalcomponent(state: IModalsAndBasicPageComponentsHolderState, Checklistitemmodalcomponent: ChecklistItemModalComponent) {
            state.Checklistitemmodalcomponent = Checklistitemmodalcomponent;
        },

        set_Supervisionitemmodal(state: IModalsAndBasicPageComponentsHolderState, Supervisionitemmodal: SupervisionItemModalComponent) {
            state.Supervisionitemmodal = Supervisionitemmodal;
        },

        set_Favoritesfiltersmodalcomponent(state: IModalsAndBasicPageComponentsHolderState, Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent) {
            state.Favoritesfiltersmodalcomponent = Favoritesfiltersmodalcomponent;
        },

        set_Crudupdatemodalcomponent(state: IModalsAndBasicPageComponentsHolderState, Crudupdatemodalcomponent: CRUDUpdateModalComponent) {
            state.Crudupdatemodalcomponent = Crudupdatemodalcomponent;
        },

        set_Crudcreatemodalcomponent(state: IModalsAndBasicPageComponentsHolderState, Crudcreatemodalcomponent: CRUDCreateModalComponent) {
            state.Crudcreatemodalcomponent = Crudcreatemodalcomponent;
        },

        set_Sharedfiltersmodalcomponent(state: IModalsAndBasicPageComponentsHolderState, Sharedfiltersmodalcomponent: SharedFiltersModalComponent) {
            state.Sharedfiltersmodalcomponent = Sharedfiltersmodalcomponent;
        },

    };

    public actions: ActionTree<IModalsAndBasicPageComponentsHolderState, ModalsAndBasicPageComponentsHolderContext>;
    public namespaced: boolean = true;

    public constructor() {
        this.module_name = "ModalsAndBasicPageComponentsHolderStore";


        this.state = {
            Checklistitemmodalcomponent: null,
            Supervisionitemmodal: null,
            Favoritesfiltersmodalcomponent: null,
            Sharedfiltersmodalcomponent: null,
            Crudupdatemodalcomponent: null,
            Crudcreatemodalcomponent: null,
        };


        this.getters = {

            get_Checklistitemmodalcomponent(state: IModalsAndBasicPageComponentsHolderState): ChecklistItemModalComponent {
                return state.Checklistitemmodalcomponent;
            },

            get_Supervisionitemmodal(state: IModalsAndBasicPageComponentsHolderState): SupervisionItemModalComponent {
                return state.Supervisionitemmodal;
            },

            get_Favoritesfiltersmodalcomponent(state: IModalsAndBasicPageComponentsHolderState): FavoritesFiltersModalComponent {
                return state.Favoritesfiltersmodalcomponent;
            },

            get_Sharedfiltersmodalcomponent(state: IModalsAndBasicPageComponentsHolderState): SharedFiltersModalComponent {
                return state.Sharedfiltersmodalcomponent;
            },

            get_Crudupdatemodalcomponent(state: IModalsAndBasicPageComponentsHolderState): CRUDUpdateModalComponent {
                return state.Crudupdatemodalcomponent;
            },

            get_Crudcreatemodalcomponent(state: IModalsAndBasicPageComponentsHolderState): CRUDCreateModalComponent {
                return state.Crudcreatemodalcomponent;
            },

        };

        this.actions = {
            set_Favoritesfiltersmodalcomponent: (context: ModalsAndBasicPageComponentsHolderContext, Favoritesfiltersmodalcomponent: FavoritesFiltersModalComponent) => context.commit(store_mutations_names(this).set_Favoritesfiltersmodalcomponent, Favoritesfiltersmodalcomponent),
            set_Sharedfiltersmodalcomponent: (context: ModalsAndBasicPageComponentsHolderContext, Sharedfiltersmodalcomponent: SharedFiltersModalComponent) => context.commit(store_mutations_names(this).set_Sharedfiltersmodalcomponent, Sharedfiltersmodalcomponent),
            set_Crudupdatemodalcomponent: (context: ModalsAndBasicPageComponentsHolderContext, Crudupdatemodalcomponent: CRUDUpdateModalComponent) => context.commit(store_mutations_names(this).set_Crudupdatemodalcomponent, Crudupdatemodalcomponent),
            set_Checklistitemmodalcomponent: (context: ModalsAndBasicPageComponentsHolderContext, Checklistitemmodalcomponent: ChecklistItemModalComponent) => context.commit(store_mutations_names(this).set_Checklistitemmodalcomponent, Checklistitemmodalcomponent),
            set_Supervisionitemmodal: (context: ModalsAndBasicPageComponentsHolderContext, Supervisionitemmodal: SupervisionItemModalComponent) => context.commit(store_mutations_names(this).set_Supervisionitemmodal, Supervisionitemmodal),
            set_Crudcreatemodalcomponent: (context: ModalsAndBasicPageComponentsHolderContext, Crudcreatemodalcomponent: CRUDCreateModalComponent) => context.commit(store_mutations_names(this).set_Crudcreatemodalcomponent, Crudcreatemodalcomponent),
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModalsAndBasicPageComponentsHolderStore {
        if (!ModalsAndBasicPageComponentsHolderStore.instance) {
            ModalsAndBasicPageComponentsHolderStore.instance = new ModalsAndBasicPageComponentsHolderStore();
        }
        return ModalsAndBasicPageComponentsHolderStore.instance;
    }
}


export const ModalsAndBasicPageComponentsHolderStoreInstance = ModalsAndBasicPageComponentsHolderStore.getInstance();

const __namespace = namespace('ModalsAndBasicPageComponentsHolderStore');
export const ModuleModalsAndBasicPageComponentsHolderGetter = __namespace.Getter;
export const ModuleModalsAndBasicPageComponentsHolderAction = __namespace.Action;