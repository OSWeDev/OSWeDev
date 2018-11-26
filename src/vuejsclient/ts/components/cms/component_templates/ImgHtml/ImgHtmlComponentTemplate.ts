import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IInstantiatedPageComponent from '../../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ImageVO from '../../../../../../shared/modules/Image/vos/ImageVO';
import VueComponentBase from '../../../VueComponentBase';
import ICMSComponentTemplateVue from '../../interfaces/ICMSComponentTemplateVue';
import './ImgHtmlComponentTemplate.scss';
import ImgHtmlComponentVO from '../../../../../../shared/modules/CMS/page_components_types/ImgHtmlComponentVO';
import PageVO from '../../../../../../shared/modules/CMS/vos/PageVO';

@Component({
    template: require('./ImgHtmlComponentTemplate.pug'),
    components: {}
})
export default class ImgHtmlComponentTemplate extends VueComponentBase implements ICMSComponentTemplateVue {

    @Prop()
    public instantiated_page_component: IInstantiatedPageComponent;

    @Prop()
    public page_vo: PageVO;

    private imgVO: ImageVO = null;

    get img_src(): string {
        if (this.imgVO) {
            return this.imgVO.path;
        }
        return null;
    }

    @Watch('instantiated_page_component')
    private async onChange_instantiated_page_component() {
        if (this.instantiated_page_component) {

        }
        this.imgVO = await ModuleDAO.getInstance().getVoById<ImageVO>(ImageVO.API_TYPE_ID, (this.instantiated_page_component as ImgHtmlComponentVO).image_vo_id);
    }
}