import MenuElementBase from './vos/MenuElementBase';
import MenuBranch from './vos/MenuBranch';
import LocaleManager from '../../../../shared/tools/LocaleManager';

export default class MenuController {

    // On triche un peu mais il est sensé n'y avoir qu'un menu....
    public static getInstance(): MenuController {
        if (!MenuController.instance) {
            MenuController.instance = new MenuController();
        }
        return MenuController.instance;
    }

    private static instance: MenuController;

    public menuElementsToAdd: Array<{ menuElement: MenuElementBase, parent: MenuBranch }> = [];
    public menuElementsToIgnore: string[] = [];

    /**
     * Supprime un noeud de menu, s'il n'est pas encore ajouté à l'affichage, et stocke l'info s'il n'est pas encore enregistré
     */
    public removeMenuElement(UID: string) {
        if (!UID) {
            return null;
        }

        for (let i in this.menuElementsToAdd) {
            let menuElement: {
                menuElement: MenuElementBase;
                parent: MenuBranch;
            } = this.menuElementsToAdd[i];

            if (menuElement.menuElement.UID == UID) {
                this.menuElementsToAdd.splice(parseInt(i.toString()), 1);
                return;
            }
        }

        this.menuElementsToIgnore.push(UID);
    }

    public addMenuElement(menuElement: MenuElementBase, parent: MenuBranch) {

        if ((!!menuElement) && (this.menuElementsToIgnore.indexOf(menuElement.UID) >= 0)) {
            return;
        }
        this.menuElementsToAdd.push({ menuElement: menuElement, parent: parent });
    }

    public addMenuElements(menuElements: MenuElementBase[], parent: MenuBranch) {

        for (let i in menuElements) {
            this.addMenuElement(menuElements[i], parent);
        }
    }

    public getMenuElementInStoreElements(UID: string, menuElements: MenuElementBase[]): MenuElementBase {

        if (!menuElements) {
            return null;
        }

        // On vérifie si il existe pas déjà dans le parent
        for (let i in menuElements) {
            let menuElement: MenuElementBase = menuElements[i];

            if (menuElement.UID == UID) {
                return menuElement;
            }

            if (menuElement.type == MenuElementBase.TYPE_BRANCH) {
                let res = this.getMenuElementInStoreElements(UID, (menuElement as MenuBranch).menuElements);
                if (res) {
                    return res;
                }
            }
        }
    }

    public addMenuElementsToStore(menuElements: Array<{ menuElement: MenuElementBase, parent: MenuBranch }>, rootMenuElements: MenuElementBase[]) {
        for (let i in menuElements) {
            let targetMenuElements: MenuElementBase[];
            if (!menuElements[i].parent) {
                targetMenuElements = rootMenuElements;
            } else {
                targetMenuElements = menuElements[i].parent.menuElements;
            }

            this.handleAddMenuElementToStore(menuElements[i].menuElement, targetMenuElements);
        }
        MenuController.getInstance().sortMenuElements(rootMenuElements);
    }

    public addMenuElementToStore(menuElement: MenuElementBase, targetMenuElements: MenuElementBase[]) {

        this.handleAddMenuElementToStore(menuElement, targetMenuElements);
        MenuController.getInstance().sortMenuElements(targetMenuElements);
    }

    public sortMenuElements(menuElements: MenuElementBase[]) {

        menuElements.sort(this.menuElementsSorter);
        for (let i in menuElements) {
            if (menuElements[i].type == MenuElementBase.TYPE_BRANCH) {
                this.sortMenuElements((menuElements[i] as MenuBranch).menuElements);
            }
        }
    }

    public menuElementsSorter(a: MenuElementBase, b: MenuElementBase) {

        // Dans l'ordre :
        //  Priorités, de ULTRALOW à ULTRAHIGH
        //      Pour une même priorité : par ordre alphabétique
        if (a.priority < b.priority) {
            return -1;
        }
        if (a.priority > b.priority) {
            return 1;
        }

        if (LocaleManager.getInstance().i18n.t(a.translatable_title).toLowerCase() < LocaleManager.getInstance().i18n.t(b.translatable_title).toLowerCase()) {
            return -1;
        }
        if (LocaleManager.getInstance().i18n.t(a.translatable_title).toLowerCase() > LocaleManager.getInstance().i18n.t(b.translatable_title).toLowerCase()) {
            return 1;
        }

        return 0;
    }

    private handleAddMenuElementToStore(menuElement: MenuElementBase, targetMenuElements: MenuElementBase[]) {
        // On vérifie si il existe pas déjà dans le parent
        for (let i in targetMenuElements) {
            let menuElement_: MenuElementBase = targetMenuElements[i];

            if (menuElement_.UID == menuElement.UID) {
                // Si il existe on essaie d'ajouter les menuelements si c'est des branches

                if ((menuElement.type == MenuElementBase.TYPE_BRANCH) &&
                    (menuElement_.type == MenuElementBase.TYPE_BRANCH)) {
                    let branch = menuElement as MenuBranch;
                    for (let j in branch.menuElements) {
                        this.handleAddMenuElementToStore(branch.menuElements[j], (menuElement_ as MenuBranch).menuElements);
                    }
                }
                return;
            }
        }

        targetMenuElements.push(menuElement);
    }
}