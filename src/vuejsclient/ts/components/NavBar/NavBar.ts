import Component from 'vue-class-component';
import VueComponentBase from '../VueComponentBase';
import './NavBar.scss';
import { Prop } from 'vue-property-decorator';
import MenuComponent from '../menu/component/MenuComponent';
import LangSelectorComponent from '../lang_selector/LangSelectorComponent';
import UserNotifsMarkerComponent from '../notification/components/UserNotifsMarker/UserNotifsMarkerComponent';
import UserNotifsViewerComponent from '../notification/components/UserNotifsViewer/UserNotifsViewerComponent';

@Component({
    template: require('./NavBar.pug'),
    components: {
        Menucomponent: MenuComponent,
        Langselectorcomponent: LangSelectorComponent,
        Usernotifsmarkercomponent: UserNotifsMarkerComponent
    }
})
export default class NavBar extends VueComponentBase {

    @Prop()
    private app_name: string;

    @Prop({ default: "bg-dark" })
    private bg_style: string;

    @Prop({ default: "navbar-dark" })
    private navbar_style: string;

    @Prop({ default: true })
    private is_fixed: boolean;

    @Prop({ default: true })
    private show_lang_selector: boolean;

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