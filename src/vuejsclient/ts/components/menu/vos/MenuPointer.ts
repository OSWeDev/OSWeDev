import MenuController from '../MenuController';
import MenuBranch from './MenuBranch';
import MenuLeaf from './MenuLeaf';

export default class MenuPointer {

    /**
     *
     * @param leaf La feuille dans tous les cas
     * @param niveau1 Soit le parent de niveau 1, soit null si la feuille est au niveau 1
     * @param niveau2 Soit le parent de niveau 2, soit null si la feuille est au niveau 1 ou 2
     */
    public constructor(public leaf: MenuLeaf, public niveau1: MenuBranch = null, public niveau2: MenuBranch = null) { }

    public addToMenu() {

        if (!this.leaf) {
            return;
        }

        if (this.niveau1) {
            MenuController.getInstance().addMenuElement(
                this.niveau1,
                null);
        }
        if (this.niveau1 && this.niveau2) {
            MenuController.getInstance().addMenuElement(
                this.niveau2,
                this.niveau1);
        }
        MenuController.getInstance().addMenuElement(
            this.leaf,
            this.niveau2 ? this.niveau2 : this.niveau1);
    }
}