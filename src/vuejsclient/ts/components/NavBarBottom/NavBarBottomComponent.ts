import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import './NavBarBottomComponent.scss';

@Component({
    template: require('./NavBarBottomComponent.pug'),
    components: {
    }
})
export default class NavBarBottomComponent extends VueComponentBase {

    @Prop()
    private app_name: string;
}