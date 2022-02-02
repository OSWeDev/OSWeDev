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

    @Prop()
    private app_name: string;

    /**
     * Pour généraliser on doit séparer la navbar top, et la sidebar
     */
    @Prop({ default: true })
    private is_sidebar: boolean;

    // /**
    //  * Permet d'indiquer qu'on veut ajouter les classes de la navbar
    //  */
    // @Prop({ default: false })
    // private is_navbar: boolean;

    private menuElements: MenuElementVO[] = null;
    private childrenElementsById: { [parent_id: number]: MenuElementVO[] } = {};

    private access_by_name: { [policy_name: string]: boolean } = {};

    get ul_lvl1_classes() {
        return this.is_sidebar ?
            '.nav.flex-column' :
            'navbar-nav me-auto mb-2 mb-md-0';
    }

    public mounted() {
        MenuController.getInstance().callback_reload_menus[this.app_name] = this.callback_reload_menus;
        this.callback_reload_menus();
    }

    private callback_reload_menus() {
        this.menuElements = MenuController.getInstance().menus_by_parent_id[this.app_name] ? MenuController.getInstance().menus_by_parent_id[this.app_name][0] : null;
        this.childrenElementsById = MenuController.getInstance().menus_by_parent_id[this.app_name];
        this.access_by_name = MenuController.getInstance().access_by_name;
    }
}