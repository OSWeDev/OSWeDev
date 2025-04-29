import { Component, Prop } from 'vue-property-decorator';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import VueComponentBase from '../../VueComponentBase';
import MenuController from '../MenuController';
import './MenuComponent.scss';

@Component({
    template: require('./MenuComponent.pug'),
    components: {}
})
export default class MenuComponent extends VueComponentBase {

    private static instance: MenuComponent;

    @Prop()
    private app_name: string;

    @Prop({ default: true })
    private show_title: boolean;

    @Prop({ default: false })
    private only_one_menu_opened: boolean;

    /**
     * Dictionnaire de l'état d'ouverture des menus, par ID
     */
    private open_elements: { [id: number]: boolean } = {};

    private menuElements: MenuElementVO[] = null;
    private childrenElementsById: { [parent_id: number]: MenuElementVO[] } = {};

    private access_by_name: { [policy_name: string]: boolean } = {};

    public constructor() {
        super();
        MenuComponent.instance = this;
    }
    // On triche un peu mais il est sensé n'y avoir qu'un menu....
    public static getInstance(): MenuComponent {
        return MenuComponent.instance;
    }

    public mounted() {
        MenuController.getInstance().callback_reload_menus = this.callback_reload_menus;
        this.callback_reload_menus();
    }

    private callback_reload_menus() {
        this.menuElements = MenuController.getInstance().menus_by_parent_id ? MenuController.getInstance().menus_by_parent_id[0] : null;

        //Removing duplicates :
        const result: MenuElementVO[] = [];
        const menuElements_label: string[] = [];
        for (const item of this.menuElements) {
            if (!menuElements_label.includes(this.t(item.translatable_title))) {
                result.push(item);
                menuElements_label.push(this.t(item.translatable_title));
            }
        }
        this.menuElements = result;

        this.childrenElementsById = MenuController.getInstance().menus_by_parent_id;
        this.access_by_name = MenuController.getInstance().access_by_name;

        // On réinitialise l'état d'ouverture (tout fermé)
        this.open_elements = {};
    }

    private get_name_menus(menuElement: MenuElementVO) {
        return this.t(menuElement.translatable_title);
    }

    private has_no_children_or_at_least_one_visible(menuElement: MenuElementVO): boolean {
        // Si pas d'enfant, on retourne true
        if ((!this.childrenElementsById[menuElement.id]) || (this.childrenElementsById[menuElement.id].length <= 0)) {
            return true;
        }

        let res: boolean = false;

        // On parcourt les enfants pour voir si on moins 1 est visible
        // Si ce n'est pas le cas, on masque le menu
        for (const i in this.childrenElementsById[menuElement.id]) {
            const child: MenuElementVO = this.childrenElementsById[menuElement.id][i];

            if (!child.hidden && (!child.access_policy_name || this.access_by_name[child.access_policy_name])) {
                res = true;
                break;
            }
        }

        return res;
    }

    /**
     * Ouvre/ferme un menu. Ferme les frères si only_one_menu_opened = true
     */
    private toggleMenuElement(menuElem: MenuElementVO) {

        const wasOpen = !!this.open_elements[menuElem.id];

        // Si déjà ouvert, on le ferme
        if (wasOpen) {
            this.$set(this.open_elements, menuElem.id, false);
            return;
        }

        // Sinon on veut l'ouvrir
        // 1) Fermer les frères si only_one_menu_opened
        if (this.only_one_menu_opened) {
            const parent_id = menuElem.parent_id || 0;
            const siblings = this.childrenElementsById[parent_id];
            if (siblings && siblings.length > 0) {
                for (const sib of siblings) {
                    this.$set(this.open_elements, sib.id, false);
                }
            }
        }

        // 2) Ouvrir le menu cliqué
        this.$set(this.open_elements, menuElem.id, true);
    }
}