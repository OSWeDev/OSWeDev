import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { ModuleBootstrapTemplateGetter } from '../BootstrapTemplate/store/BootstrapTemplateStore';
import VueComponentBase from '../VueComponentBase';
import './NavBarBottomComponent.scss';

@Component({
    template: require('./NavBarBottomComponent.pug'),
    components: {
    }
})
export default class NavBarBottomComponent extends VueComponentBase {

    @ModuleBootstrapTemplateGetter
    private get_bottomnavbar: string;

    @ModuleBootstrapTemplateGetter
    private get_bottomnav_bg: string;

    @Prop()
    private app_name: string;
}