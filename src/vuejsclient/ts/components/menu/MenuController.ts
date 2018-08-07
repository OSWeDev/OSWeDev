import MenuElementBase from './vos/MenuElementBase';
import MenuBranch from './vos/MenuBranch';

export default class MenuController {

    // On triche un peu mais il est sensé n'y avoir qu'un menu....
    public static getInstance(): MenuController {
        if (!MenuController.instance) {
            MenuController.instance = new MenuController();
        }
        return MenuController.instance;
    }

    private static instance: MenuController;

    public addMenuElements: Array<{ menuElement: MenuElementBase, parent: MenuBranch }> = [];

    public addMenuElement(menuElement: MenuElementBase, parent: MenuBranch) {

        this.addMenuElements.push({ menuElement: menuElement, parent: parent });
    }
}