import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import IInstantiatedPageComponent from '../../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import VueComponentBase from '../../../VueComponentBase';
import ICMSComponentTemplateVue from '../../interfaces/ICMSComponentTemplateVue';
import './HtmlComponentTemplate.scss';
import PageVO from '../../../../../../shared/modules/CMS/vos/PageVO';

@Component({
    template: require('./HtmlComponentTemplate.pug'),
    components: {}
})
export default class HtmlComponentTemplate extends VueComponentBase implements ICMSComponentTemplateVue {

    @Prop()
    public instantiated_page_component: IInstantiatedPageComponent;

    @Prop()
    public page_vo: PageVO;
}