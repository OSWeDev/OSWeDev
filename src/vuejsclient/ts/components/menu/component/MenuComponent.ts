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
}