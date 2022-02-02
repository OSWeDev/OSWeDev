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

    public menus_by_app_names: { [app_name: string]: MenuElementVO[] } = {};

    public menus_by_parent_id: { [app_name: string]: { [parent_id: number]: MenuElementVO[] } } = {};
    public menus_by_name: { [app_name: string]: { [name: string]: MenuElementVO } } = {};
    public menus_by_ids: { [app_name: string]: { [id: number]: MenuElementVO } } = {};

    public access_by_name: { [policy_name: string]: boolean } = {};

    public callback_reload_menus: { [app_name: string]: any } = {};

    public async reload_from_db() {
        this.reload(await ModuleDAO.getInstance().getVos<MenuElementVO>(MenuElementVO.API_TYPE_ID));

        this.access_by_name = {};
        for (let app_name in this.menus_by_ids) {
            let app_menus = this.menus_by_ids[app_name];

            for (let i in app_menus) {
                let menu = app_menus[i];

                if (!menu.access_policy_name) {
                    continue;
                }
                this.access_by_name[menu.access_policy_name] = null;
            }
        }

        let promises = [];
        for (let policy_name in this.access_by_name) {

            promises.push((async () => {
                this.access_by_name[policy_name] = await ModuleAccessPolicy.getInstance().testAccess(policy_name);
            })());
        }
        await Promise.all(promises);
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

        if (!this.menus_by_name[elt.app_name]) {
            this.menus_by_name[elt.app_name] = {};
        }

        if (!this.menus_by_ids[elt.app_name]) {
            this.menus_by_ids[elt.app_name] = {};
        }

        if (!this.menus_by_app_names[elt.app_name]) {
            this.menus_by_app_names[elt.app_name] = [];
        }

        if (!this.menus_by_name[elt.app_name][elt.name]) {

            // Si c'est pas défini dans le menu, on check qu'on a le droit de l'ajouter
            if (elt.access_policy_name && !await ModuleAccessPolicy.getInstance().testAccess(elt.access_policy_name)) {
                ConsoleHandler.getInstance().warn("Menu refusé car accès refusé:" + elt);
                return;
            }

            // Si le parent n'est pas valide on a pas accès au menu fils (récursivement)
            let parent_menu = elt;
            while (parent_menu && !!parent_menu.menu_parent_id) {
                let parent_id = parent_menu.menu_parent_id;
                parent_menu = this.menus_by_ids[elt.app_name][parent_id];
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

            this.menus_by_name[elt.app_name][elt.name] = elt;
            this.menus_by_ids[elt.app_name][elt.id] = elt;

            if (!this.menus_by_parent_id[elt.app_name]) {
                this.menus_by_parent_id[elt.app_name] = {};
            }

            if (!this.menus_by_parent_id[elt.app_name][elt.menu_parent_id]) {
                this.menus_by_parent_id[elt.app_name][elt.menu_parent_id] = [];
            }
            this.menus_by_parent_id[elt.app_name][elt.menu_parent_id].push(elt);

            if (!this.menus_by_app_names[elt.app_name][elt.app_name]) {
                this.menus_by_app_names[elt.app_name][elt.app_name] = [];
            }
            this.menus_by_app_names[elt.app_name][elt.app_name].push(elt);

            WeightHandler.getInstance().sortByWeight(this.menus_by_parent_id[elt.app_name][elt.menu_parent_id]);
        }

        return this.menus_by_name[elt.app_name][elt.name] ? this.menus_by_name[elt.app_name][elt.name] : elt;
    }

    private reload(menus: MenuElementVO[]) {

        this.menus_by_name = {};
        this.menus_by_parent_id = {};
        this.menus_by_ids = {};
        this.menus_by_app_names = {};

        this.init(menus);

        for (let i in this.callback_reload_menus) {
            let callback = this.callback_reload_menus[i];

            if (callback) {
                callback();
            }
        }
    }

    private init(menus: MenuElementVO[]) {

        for (let i in menus) {
            let menu = menus[i];

            if (!this.menus_by_name[menu.app_name]) {
                this.menus_by_name[menu.app_name] = {};
            }

            if (!this.menus_by_ids[menu.app_name]) {
                this.menus_by_ids[menu.app_name] = {};
            }

            if (!this.menus_by_app_names[menu.app_name]) {
                this.menus_by_app_names[menu.app_name] = [];
            }

            let parent_id = menu.menu_parent_id ? menu.menu_parent_id : 0;

            if (!this.menus_by_parent_id[menu.app_name]) {
                this.menus_by_parent_id[menu.app_name] = {};
            }

            if (!this.menus_by_parent_id[menu.app_name][parent_id]) {
                this.menus_by_parent_id[menu.app_name][parent_id] = [];
            }
            this.menus_by_parent_id[menu.app_name][parent_id].push(menu);

            this.menus_by_name[menu.app_name][menu.name] = menu;
            this.menus_by_ids[menu.app_name][menu.id] = menu;

            if (!this.menus_by_app_names[menu.app_name]) {
                this.menus_by_app_names[menu.app_name] = [];
            }
            this.menus_by_app_names[menu.app_name].push(menu);
        }

        for (let i in this.menus_by_parent_id) {

            let menu_parents = this.menus_by_parent_id[i];
            for (let j in menu_parents) {
                let menu_parent = menu_parents[j];

                WeightHandler.getInstance().sortByWeight(menu_parent);
            }
        }
    }
}