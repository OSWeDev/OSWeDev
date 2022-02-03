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

@Component({
    template: require('./NavBarComponent.pug'),
    components: {
        Navbarmenucomponent: NavBarMenuComponent,
        Langselectorcomponent: LangSelectorComponent,
        Usernotifsmarkercomponent: UserNotifsMarkerComponent,
        Navbarusercomponent: NavBarUserComponent,
        Documenthandlerbuttoncomponent: DocumentHandlerButtonComponent
    }
})
export default class NavBarComponent extends VueComponentBase {

    @ModuleLangSelectorGetter
    private get_hide_lang_selector: boolean;

    @Prop()
    private app_name: string;

    @Prop({ default: "bg-light" })
    private bg_style: string;

    @Prop({ default: "navbar-light" })
    private navbar_style: string;

    /**
     * Permet de switcher entre le menu dans la navbar ou dans la sidebar
     */
    @Prop({ default: true })
    private use_sidebarmenu: boolean;

    @Prop({ default: true })
    private is_fixed: boolean;

    @Prop({ default: true })
    private show_lang_selector: boolean;

    get is_mobile() {
        return VueAppController.getInstance().is_mobile;
    }

    get nav_classes(): string {

        let res: string = '';

        if (this.bg_style) {
            res += this.bg_style + ' ';
        }

        if (this.navbar_style) {
            res += this.navbar_style + ' ';
        }

        if (this.is_fixed) {
            res += 'fixed-top ';
        }

        return res;
    }
}