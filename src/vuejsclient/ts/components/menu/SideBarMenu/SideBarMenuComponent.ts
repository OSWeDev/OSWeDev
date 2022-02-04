import { Component, Prop } from 'vue-property-decorator';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import { ModuleBootstrapTemplateGetter } from '../../BootstrapTemplate/store/BootstrapTemplateStore';
import VueComponentBase from '../../VueComponentBase';
import MenuController from '../MenuController';
import './SideBarMenuComponent.scss';

@Component({
    template: require('./SideBarMenuComponent.pug'),
    components: {}
})
export default class SideBarMenuComponent extends VueComponentBase {

    @ModuleBootstrapTemplateGetter
    private get_fa_sidebarmenu_style: string;

    @ModuleBootstrapTemplateGetter
    private get_sidebar_nav_lvl1_text: string;
    @ModuleBootstrapTemplateGetter
    private get_sidebar_nav_lvl2_text: string;
    @ModuleBootstrapTemplateGetter
    private get_sidebar_nav_lvl3_text: string;

    @Prop()
    private app_name: string;

    private menuElements: MenuElementVO[] = null;
    private childrenElementsById: { [parent_id: number]: MenuElementVO[] } = {};

    private access_by_name: { [policy_name: string]: boolean } = {};

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