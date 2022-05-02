import { Component, Prop } from 'vue-property-decorator';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import VueComponentBase from '../../VueComponentBase';
import MenuController from '../MenuController';
import './MenuComponent.scss';

@Component({
    template: require('./MenuComponent.pug'),
    components: {}
})
export default class MenuComponent extends VueComponentBase {

    // On triche un peu mais il est sensé n'y avoir qu'un menu....
    public static getInstance(): MenuComponent {
        return MenuComponent.instance;
    }
    private static instance: MenuComponent;

    @Prop()
    private app_name: string;

    @Prop({ default: true })
    private show_title: boolean;

    private menuElements: MenuElementVO[] = null;
    private childrenElementsById: { [parent_id: number]: MenuElementVO[] } = {};

    private access_by_name: { [policy_name: string]: boolean } = {};

    public constructor() {
        super();
        MenuComponent.instance = this;
    }

    public mounted() {
        MenuController.getInstance().callback_reload_menus = this.callback_reload_menus;
        this.callback_reload_menus();
    }

    private callback_reload_menus() {
        this.menuElements = MenuController.getInstance().menus_by_parent_id ? MenuController.getInstance().menus_by_parent_id[0] : null;
        this.childrenElementsById = MenuController.getInstance().menus_by_parent_id;
        this.access_by_name = MenuController.getInstance().access_by_name;
    }

    private has_no_children_or_at_least_one_visible(menuElement: MenuElementVO): boolean {
        // Si pas d'enfant, on retourne true
        if ((!this.childrenElementsById[menuElement.id]) || (this.childrenElementsById[menuElement.id].length <= 0)) {
            return true;
        }

        let res: boolean = false;

        // On parcourt les enfants pour voir si on moins 1 est visible
        // Si ce n'est pas le cas, on masque le menu
        for (let i in this.childrenElementsById[menuElement.id]) {
            let child: MenuElementVO = this.childrenElementsById[menuElement.id][i];

            if (!child.hidden && (!child.access_policy_name || this.access_by_name[child.access_policy_name])) {
                res = true;
                break;
            }
        }

        return res;
    }
}