import VueComponentBase from '../../VueComponentBase';
import IInstantiatedPageComponent from '../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import PageVO from '../../../../../shared/modules/CMS/vos/PageVO';

export default interface ICMSComponentTemplateVue extends VueComponentBase {
    instantiated_page_component: IInstantiatedPageComponent;
    page_vo: PageVO;
}