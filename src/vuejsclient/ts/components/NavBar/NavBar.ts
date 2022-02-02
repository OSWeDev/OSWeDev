import Component from 'vue-class-component';
import VueComponentBase from '../VueComponentBase';
import './NavBar.scss';
import { Prop } from 'vue-property-decorator';
import MenuComponent from '../menu/component/MenuComponent';
import LangSelectorComponent from '../lang_selector/LangSelectorComponent';
import UserNotifsMarkerComponent from '../notification/components/UserNotifsMarker/UserNotifsMarkerComponent';
import NavBarUserComponent from '../NavBarUser/NavBarUserComponent';
import VueAppController from '../../../VueAppController';
import DocumentHandlerButtonComponent from '../document_handler/button/DocumentHandlerButtonComponent';

@Component({
    template: require('./NavBar.pug'),
    components: {
        Menucomponent: MenuComponent,
        Langselectorcomponent: LangSelectorComponent,
        Usernotifsmarkercomponent: UserNotifsMarkerComponent,
        Navbarusercomponent: NavBarUserComponent,
        Documenthandlerbuttoncomponent: DocumentHandlerButtonComponent
    }
})
export default class NavBar extends VueComponentBase {

    @Prop()
    private app_name: string;

    @Prop({ default: "bg-light" })
    private bg_style: string;

    @Prop({ default: "navbar-light" })
    private navbar_style: string;

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