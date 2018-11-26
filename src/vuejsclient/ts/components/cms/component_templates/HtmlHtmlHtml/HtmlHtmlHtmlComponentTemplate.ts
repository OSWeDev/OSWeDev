import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import IInstantiatedPageComponent from '../../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import VueComponentBase from '../../../VueComponentBase';
import ICMSComponentTemplateVue from '../../interfaces/ICMSComponentTemplateVue';
import './HtmlHtmlHtmlComponentTemplate.scss';
import PageVO from '../../../../../../shared/modules/CMS/vos/PageVO';

@Component({
    template: require('./HtmlHtmlHtmlComponentTemplate.pug'),
    components: {}
})
export default class HtmlHtmlHtmlComponentTemplate extends VueComponentBase implements ICMSComponentTemplateVue {

    @Prop()
    public instantiated_page_component: IInstantiatedPageComponent;

    @Prop()
    public page_vo: PageVO;
}