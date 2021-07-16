import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import WeightHandler from '../../../../shared/tools/WeightHandler';

export default class MenuController {

    public static getInstance(): MenuController {
        if (!MenuController.instance) {
            MenuController.instance = new MenuController();
        }
        return MenuController.instance;
    }

    private static instance: MenuController;

    public menus_by_parent_id: { [parent_id: number]: MenuElementVO[] } = {};
    public menus_by_name: { [name: string]: MenuElementVO } = {};
    public menus_by_ids: { [id: number]: MenuElementVO } = {};
    public known_server_menus_names: string[] = [];

    public init(menus: MenuElementVO[]) {

        for (let i in menus) {
            let menu = menus[i];

            let parent_id = menu.parent_id ? menu.parent_id : 0;
            if (!this.menus_by_parent_id[parent_id]) {
                this.menus_by_parent_id[parent_id] = [];
            }
            this.menus_by_parent_id[parent_id].push(menu);

            this.menus_by_name[menu.name] = menu;
            this.menus_by_ids[menu.id] = menu;
        }
    }

    /**
     * On déclare un nouvel élément de menu
     *  Si cet élément n'existe pas actuellement, on le crée en BDD
     * @param elt
     */
    public async declare_menu_element(elt: MenuElementVO): Promise<MenuElementVO> {
        if (!elt) {
            return;
        }

        if ((!this.menus_by_name[elt.name]) && (!this.known_server_menus_names[elt.access_policy_name])) {

            // Si c'est pas défini dans le menu, on check qu'on a le droit de l'ajouter
            if (elt.access_policy_name && !await ModuleAccessPolicy.getInstance().checkAccess(elt.access_policy_name)) {
                ConsoleHandler.getInstance().warn("Menu refusé car accès refusé:" + elt);
                return;
            }

            // Si le parent n'est pas valide on a pas accès au menu fils (récursivement)
            let parent_menu = elt;
            while (parent_menu && !!parent_menu.menu_parent_id) {
                let parent_id = parent_menu.menu_parent_id;
                parent_menu = this.menus_by_ids[parent_id];
            }

            if (!parent_menu) {
                ConsoleHandler.getInstance().warn("Menu refusé car parent inactif:" + elt);
                return;
            }

            let res = await ModuleDAO.getInstance().insertOrUpdateVO(elt);
            if ((!res) || (!res.id)) {
                ConsoleHandler.getInstance().error("Failed declare_menu_element:" + elt);
                return null;
            }
            elt.id = res.id;

            this.menus_by_name[elt.name] = elt;
            this.menus_by_ids[elt.id] = elt;

            if (!this.menus_by_parent_id[elt.parent_id]) {
                this.menus_by_parent_id[elt.parent_id] = [];
            }
            this.menus_by_parent_id[elt.parent_id].push(elt);
            WeightHandler.getInstance().sortByWeight(this.menus_by_parent_id[elt.parent_id]);
        }

        return this.menus_by_name[elt.name] ? this.menus_by_name[elt.name] : elt;
    }
}