import Component from 'vue-class-component';
import VueComponentBase from '../VueComponentBase';
import './NavBarComponent.scss';
import { Prop } from 'vue-property-decorator';
import NavBarMenuComponent from '../menu/NavBarMenu/NavBarMenuComponent';
import LangSelectorComponent from '../lang_selector/LangSelectorComponent';
import UserNotifsMarkerComponent from '../notification/components/UserNotifsMarker/UserNotifsMarkerComponent';
import NavBarUserComponent from '../NavBarUser/NavBarUserComponent';
import VueAppController from '../../../VueAppController';
import DocumentHandlerButtonComponent from '../document_handler/button/DocumentHandlerButtonComponent';
import { ModuleLangSelectorGetter } from '../lang_selector/store/LangSelectorStore';
import { ModuleBootstrapTemplateGetter } from '../BootstrapTemplate/store/BootstrapTemplateStore';
import ThemeSwitchComponent from '../ThemeSwitch/ThemeSwitchComponent';

@Component({
    template: require('./NavBarComponent.pug'),
    components: {
        Navbarmenucomponent: NavBarMenuComponent,
        Langselectorcomponent: LangSelectorComponent,
        Usernotifsmarkercomponent: UserNotifsMarkerComponent,
        Navbarusercomponent: NavBarUserComponent,
        Documenthandlerbuttoncomponent: DocumentHandlerButtonComponent,
        Themeswitchcomponent: ThemeSwitchComponent
    }
})
export default class NavBarComponent extends VueComponentBase {

    @ModuleLangSelectorGetter
    private get_hide_lang_selector: boolean;

    @Prop()
    private app_name: string;

    @ModuleBootstrapTemplateGetter
    private get_fa_navbarbtn_style: string;

    @ModuleBootstrapTemplateGetter
    private get_navbar: string;

    @ModuleBootstrapTemplateGetter
    private get_nav_bg: string;

    @ModuleBootstrapTemplateGetter
    private get_nav_btn: string;

    @ModuleBootstrapTemplateGetter
    private get_nav_outlinebtn: string;

    /**
     * Permet de switcher entre le menu dans la navbar ou dans la sidebar
     */
    @Prop({ default: true })
    private use_sidebarmenu: boolean;

    @Prop({ default: true })
    private is_fixed: boolean;

    @Prop({ default: true })
    private show_lang_selector: boolean;

    /**
     * Pour l'instant pour test
     */
    private show_theme_switch: boolean = true;

    get is_mobile() {
        return VueAppController.getInstance().is_mobile;
    }

    get nav_classes(): string {

        let res: string = '';

        if (this.get_nav_bg) {
            res += this.get_nav_bg + ' ';
        }

        if (this.get_navbar) {
            res += this.get_navbar + ' ';
        }

        if (this.is_fixed) {
            res += 'fixed-top ';
        }

        return res;
    }
}