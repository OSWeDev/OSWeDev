import MenuElementBase from '../ts/components/menu/vos/MenuElementBase';
import MenuBranch from '../ts/components/menu/vos/MenuBranch';
import MenuController from '../ts/components/menu/MenuController';

export default class VueMainBaseHelper {

    public static registerMenuElements(addMenuElement: (infos: { menuElement: MenuElementBase, parent: MenuBranch }) => void) {
        for (let i in MenuController.getInstance().addMenuElements) {
            let menuElement = MenuController.getInstance().addMenuElements[i];

            addMenuElement(menuElement);
        }
    }
}