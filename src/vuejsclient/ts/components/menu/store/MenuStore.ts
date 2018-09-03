import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../../../vuejsclient/ts/store/IStoreModule';
import MenuController from '../MenuController';
import MenuBranch from '../vos/MenuBranch';
import MenuElementBase from '../vos/MenuElementBase';

export type MenuContext = ActionContext<IMenuState, any>;

export interface IMenuState {
    menuElements: MenuElementBase[];
}


export default class MenuStore implements IStoreModule<IMenuState, MenuContext> {

    public static getInstance(): MenuStore {
        if (!MenuStore.instance) {
            MenuStore.instance = new MenuStore();
        }
        return MenuStore.instance;
    }

    private static instance: MenuStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IMenuState, MenuContext>;
    public mutations: MutationTree<IMenuState>;
    public actions: ActionTree<IMenuState, MenuContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "menuStore";


        this.state = {
            menuElements: [],
        };


        this.getters = {
            getMenuElement(state: IMenuState, infos: { UID: string, menuElements: MenuElementBase[] }): MenuElementBase {


                let menuElements = infos.menuElements;
                if (!menuElements) {
                    menuElements = this.state.menuElements;
                }

                return MenuController.getInstance().getMenuElementInStoreElements(infos.UID, menuElements);
            },
            getMenuElements(state: IMenuState): MenuElementBase[] {
                return state.menuElements;
            }
        };



        this.mutations = {

            addMenuElement(state: IMenuState, infos: { menuElement: MenuElementBase, parent: MenuBranch }) {

                let targetMenuElements: MenuElementBase[];
                if (!infos.parent) {
                    targetMenuElements = state.menuElements;
                } else {
                    targetMenuElements = infos.parent.menuElements;
                }

                MenuController.getInstance().addMenuElementToStore(infos.menuElement, targetMenuElements);
            },
            registerMenuElements(state: IMenuState) {

                MenuController.getInstance().addMenuElementsToStore(MenuController.getInstance().menuElementsToAdd, state.menuElements);
            },
        };

        this.actions = {
            addMenuElement(context: MenuContext, infos: { menuElement: MenuElementBase, parent: MenuBranch }) {
                commitAddMenuElement(context, infos);
            },

            registerMenuElements(context: MenuContext) {
                commitRegisterMenuElements(context, null);
            }
        };
    }


}

export const menuStore = MenuStore.getInstance();


const { commit, read, dispatch } =
    getStoreAccessors<IMenuState, any>("menuStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleMenuGetter = namespace('menuStore', Getter);
export const ModuleMenuAction = namespace('menuStore', Action);

export const commitAddMenuElement = commit(menuStore.mutations.addMenuElement);
export const commitRegisterMenuElements = commit(menuStore.mutations.registerMenuElements);
