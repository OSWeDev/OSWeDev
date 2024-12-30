import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import WeightHandler from '../../../../shared/tools/WeightHandler';

export default class MenuController {
    private static instance: MenuController;

    public menus_by_app_names: { [app_name: string]: MenuElementVO[] } = {};

    public menus_by_parent_id: { [parent_id: number]: MenuElementVO[] } = {};
    public menus_by_name: { [name: string]: MenuElementVO } = {};
    public menus_by_ids: { [id: number]: MenuElementVO } = {};

    public access_by_name: { [policy_name: string]: boolean } = {};

    public callback_reload_menus = null;

    public has_loaded_menus: boolean = false;
    public loading_menus_promise: Promise<void> = null;


    // istanbul ignore next: nothing to test
    public static getInstance(): MenuController {
        if (!MenuController.instance) {
            MenuController.instance = new MenuController();
        }
        return MenuController.instance;
    }

    public async reload_from_db() {
        this.has_loaded_menus = true;
        this.loading_menus_promise = new Promise(async (resolve, reject) => {
            this.reload(await query(MenuElementVO.API_TYPE_ID).select_vos<MenuElementVO>());

            this.access_by_name = {};
            for (const i in this.menus_by_ids) {
                const menu = this.menus_by_ids[i];

                if (!menu.access_policy_name) {
                    continue;
                }
                this.access_by_name[menu.access_policy_name] = null;
            }

            const promises = [];
            for (const policy_name in this.access_by_name) {

                promises.push((async () => {
                    this.access_by_name[policy_name] = await ModuleAccessPolicy.getInstance().testAccess(policy_name);
                })());
            }
            await all_promises(promises);
            resolve();
        });
        return this.loading_menus_promise;
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

        if (!this.has_loaded_menus) {
            await this.reload_from_db();
        } else {
            await this.loading_menus_promise;
        }

        if (!this.menus_by_name[elt.name]) {

            // Si c'est pas défini dans le menu, on check qu'on a le droit de l'ajouter
            if (elt.access_policy_name && !await ModuleAccessPolicy.getInstance().testAccess(elt.access_policy_name)) {
                ConsoleHandler.warn("Menu refusé car accès refusé:" + elt);
                return;
            }

            // Si le parent n'est pas valide on a pas accès au menu fils (récursivement)
            let parent_menu = elt;
            while (parent_menu && !!parent_menu.menu_parent_id) {
                const parent_id = parent_menu.menu_parent_id;
                parent_menu = this.menus_by_ids[parent_id];
            }

            if (!parent_menu) {
                ConsoleHandler.warn("Menu refusé car parent inactif:" + elt);
                return;
            }

            const res = await ModuleDAO.instance.insertOrUpdateVO(elt);
            if ((!res) || (!res.id)) {
                ConsoleHandler.error("Failed declare_menu_element:" + elt);
                return null;
            }
            elt.id = res.id;

            this.menus_by_name[elt.name] = elt;
            this.menus_by_ids[elt.id] = elt;

            if (!this.menus_by_parent_id[elt.menu_parent_id]) {
                this.menus_by_parent_id[elt.menu_parent_id] = [];
            }
            this.menus_by_parent_id[elt.menu_parent_id].push(elt);

            if (!this.menus_by_app_names[elt.app_name]) {
                this.menus_by_app_names[elt.app_name] = [];
            }
            this.menus_by_app_names[elt.app_name].push(elt);

            WeightHandler.getInstance().sortByWeight(this.menus_by_parent_id[elt.menu_parent_id]);
        }

        return this.menus_by_name[elt.name] ? this.menus_by_name[elt.name] : elt;
    }

    private reload(menus: MenuElementVO[]) {

        this.menus_by_name = {};
        this.menus_by_parent_id = {};
        this.menus_by_ids = {};
        this.menus_by_app_names = {};

        this.init(menus);

        if (this.callback_reload_menus) {
            this.callback_reload_menus();
        }
    }

    private init(menus: MenuElementVO[]) {

        for (const i in menus) {
            const menu = menus[i];

            const parent_id = menu.menu_parent_id ? menu.menu_parent_id : 0;
            if (!this.menus_by_parent_id[parent_id]) {
                this.menus_by_parent_id[parent_id] = [];
            }
            this.menus_by_parent_id[parent_id].push(menu);

            this.menus_by_name[menu.name] = menu;
            this.menus_by_ids[menu.id] = menu;

            if (!this.menus_by_app_names[menu.app_name]) {
                this.menus_by_app_names[menu.app_name] = [];
            }
            this.menus_by_app_names[menu.app_name].push(menu);
        }

        for (const i in this.menus_by_parent_id) {
            WeightHandler.getInstance().sortByWeight(this.menus_by_parent_id[i]);
        }
    }
}