import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import IStoreModule from '../../store/IStoreModule';
import { store_mutations_names } from "../../store/StoreModuleBase";

export type EditablePageSwitchContext = ActionContext<IEditablePageSwitchState, any>;

export interface IEditablePageSwitchState {
    is_waiting_for_save: boolean;
    saving_handlers: Array<() => Promise<boolean>>;
    show_floating_save_button: boolean;
    is_editing_page: boolean;
    is_saving: boolean;
}


export default class EditablePageSwitchStore implements IStoreModule<IEditablePageSwitchState, EditablePageSwitchContext> {

    public static getInstance(): EditablePageSwitchStore {
        if (!EditablePageSwitchStore.instance) {
            EditablePageSwitchStore.instance = new EditablePageSwitchStore();
        }
        return EditablePageSwitchStore.instance;
    }

    private static instance: EditablePageSwitchStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IEditablePageSwitchState, EditablePageSwitchContext>;
    public mutations = {
        set_is_waiting_for_save: (state: IEditablePageSwitchState, is_waiting_for_save: boolean) => state.is_waiting_for_save = is_waiting_for_save,
        set_saving_handlers: (state: IEditablePageSwitchState, saving_handlers: Array<() => Promise<boolean>>) => state.saving_handlers = saving_handlers,
        set_show_floating_save_button: (state: IEditablePageSwitchState, show_floating_save_button: boolean) => state.show_floating_save_button = show_floating_save_button,
        set_is_editing_page: (state: IEditablePageSwitchState, is_editing_page: boolean) => state.is_editing_page = is_editing_page,
        set_is_saving: (state: IEditablePageSwitchState, is_saving: boolean) => state.is_saving = is_saving,
        add_saving_handlers: (state: IEditablePageSwitchState, saving_handlers: Array<() => Promise<boolean>>) => state.saving_handlers = state.saving_handlers.concat(saving_handlers),
    };
    public actions: ActionTree<IEditablePageSwitchState, EditablePageSwitchContext>;
    public namespaced: boolean = true;

    protected constructor() {
        this.module_name = "EditablePageSwitchStore";


        this.state = {
            is_waiting_for_save: false,
            saving_handlers: [],
            show_floating_save_button: true,
            is_editing_page: false,
            is_saving: false,
        };


        this.getters = {

            is_waiting_for_save: (state: IEditablePageSwitchState) => state.is_waiting_for_save,
            saving_handlers: (state: IEditablePageSwitchState) => state.saving_handlers,
            show_floating_save_button: (state: IEditablePageSwitchState) => state.show_floating_save_button,
            is_editing_page: (state: IEditablePageSwitchState) => state.is_editing_page,
            is_saving: (state: IEditablePageSwitchState) => state.is_saving,
        };

        this.actions = {
            set_is_waiting_for_save: (context: EditablePageSwitchContext, is_waiting_for_save: boolean) => context.commit(store_mutations_names(this).set_is_waiting_for_save, is_waiting_for_save),
            set_saving_handlers: (context: EditablePageSwitchContext, saving_handlers: Array<() => Promise<boolean>>) => context.commit(store_mutations_names(this).set_saving_handlers, saving_handlers),
            set_show_floating_save_button: (context: EditablePageSwitchContext, show_floating_save_button: boolean) => context.commit(store_mutations_names(this).set_show_floating_save_button, show_floating_save_button),
            set_is_editing_page: (context: EditablePageSwitchContext, is_editing_page: boolean) => context.commit(store_mutations_names(this).set_is_editing_page, is_editing_page),
            set_is_saving: (context: EditablePageSwitchContext, is_saving: boolean) => context.commit(store_mutations_names(this).set_is_saving, is_saving),
            add_saving_handlers: (context: EditablePageSwitchContext, saving_handlers: Array<() => Promise<boolean>>) => context.commit(store_mutations_names(this).add_saving_handlers, saving_handlers),
        };
    }
}

export const ModuleEditablePageSwitchGetter = namespace('EditablePageSwitchStore', Getter);
export const ModuleEditablePageSwitchAction = namespace('EditablePageSwitchStore', Action);