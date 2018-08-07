import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IStoreModule from '../../../../../vuejsclient/ts/store/IStoreModule';
import MenuBranch from '../vos/MenuBranch';
import MenuElementBase from '../vos/MenuElementBase';
import LocaleManager from '../../../../../shared/tools/LocaleManager';

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
                return self.getMenuElement(infos.UID, infos.menuElements);
            },
            getMenuElements(state: IMenuState): MenuElementBase[] {
                return state.menuElements;
            }
        };



        this.mutations = {

            // addMenuElement(state: IMenuState, infos: { menuElement: MenuElementBase, parent: MenuBranch }) {

            //     let targetMenuElements: MenuElementBase[];
            //     if (!infos.parent) {
            //         targetMenuElements = state.menuElements;
            //     } else {
            //         targetMenuElements = infos.parent.menuElements;
            //     }

            //     // On vérifie si il existe pas déjà dans le parent
            //     for (let i in targetMenuElements) {
            //         let menuElement_: MenuElementBase = targetMenuElements[i];

            //         if (menuElement_.UID == infos.menuElement.UID) {
            //             return;
            //         }
            //     }

            //     targetMenuElements.push(infos.menuElement);
            //     self.cloneAndSortMenuElements();
            // },

            addMenuElement(state: IMenuState, infos: { menuElement: MenuElementBase, parent: MenuBranch }) {

                let targetMenuElements: MenuElementBase[];
                if (!infos.parent) {
                    targetMenuElements = state.menuElements;
                } else {
                    targetMenuElements = infos.parent.menuElements;
                }

                // On vérifie si il existe pas déjà dans le parent
                for (let i in targetMenuElements) {
                    let menuElement_: MenuElementBase = targetMenuElements[i];

                    if (menuElement_.UID == infos.menuElement.UID) {
                        return;
                    }
                }

                targetMenuElements.push(infos.menuElement);
                self.sortMenuElements_(targetMenuElements);
            },

        };



        this.actions = {
            addMenuElement(context: MenuContext, infos: { menuElement: MenuElementBase, parent: MenuBranch }) {
                commitAddMenuElement(context, infos);
            }
        };
    }

    public getMenuElement(UID: string, menuElements: MenuElementBase[]): MenuElementBase {

        if (!menuElements) {
            menuElements = this.state.menuElements;
        }

        if (!menuElements) {
            return null;
        }

        // On vérifie si il existe pas déjà dans le parent
        for (let i in menuElements) {
            let menuElement: MenuElementBase = menuElements[i];

            if (menuElement.UID == UID) {
                return menuElement;
            }

            if (menuElement.type == "Branch") {
                let res = this.getMenuElement(UID, (menuElement as MenuBranch).menuElements);
                if (res) {
                    return res;
                }
            }
        }
    }

    private sortMenuElements_(menuElements: MenuElementBase[]) {

        menuElements.sort(this.menuElementsSorter);
    }

    private cloneAndSortMenuElements() {
        let res: MenuElementBase[] = [];

        for (let i in this.state.menuElements) {
            let menuElement = this.state.menuElements[i];

            res.push(menuElement);
        }

        res = this.sortMenuElements(res);
        this.state.menuElements = res;
    }

    private sortMenuElements(menuElements: MenuElementBase[]): MenuElementBase[] {

        for (let i in menuElements) {
            let menuElement: MenuElementBase = menuElements[i];

            if (menuElement.type == "Branch") {
                (menuElement as MenuBranch).menuElements = this.sortMenuElements((menuElement as MenuBranch).menuElements);
            }
        }
        return menuElements.sort(this.menuElementsSorter);
    }

    private menuElementsSorter(a: MenuElementBase, b: MenuElementBase) {

        // Dans l'ordre :
        //  Priorités, de ULTRALOW à ULTRAHIGH
        //      Pour une même priorité : par ordre alphabétique
        if (a.priority < b.priority) {
            return -1;
        }
        if (a.priority > b.priority) {
            return 1;
        }

        if (LocaleManager.getInstance().i18n.t(a.translatable_title) < LocaleManager.getInstance().i18n.t(b.translatable_title)) {
            return -1;
        }
        if (LocaleManager.getInstance().i18n.t(a.translatable_title) > LocaleManager.getInstance().i18n.t(b.translatable_title)) {
            return -1;
        }

        return 0;
    }
}

export const menuStore = MenuStore.getInstance();


const { commit, read, dispatch } =
    getStoreAccessors<IMenuState, any>("menuStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleMenuGetter = namespace('menuStore', Getter);
export const ModuleMenuAction = namespace('menuStore', Action);

export const commitAddMenuElement = commit(menuStore.mutations.addMenuElement);
