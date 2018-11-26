import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IInstantiatedPageComponent from '../../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import ModuleCMS from '../../../../../../shared/modules/CMS/ModuleCMS';
import PageVO from '../../../../../../shared/modules/CMS/vos/PageVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import CMSComponentManager from '../../CMSComponentManager';
import './CMSDroppableTemplateComponent.scss';
import ICMSComponentTemplateVue from '../../interfaces/ICMSComponentTemplateVue';
import { VueConstructor } from 'vue';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import TemplateComponentVO from '../../../../../../shared/modules/CMS/vos/TemplateComponentVO';
import WeightHandler from '../../../../../../shared/tools/WeightHandler';
import ImageViewComponent from '../../../image/View/ImageViewComponent';

@Component({
    template: require('./CMSDroppableTemplateComponent.pug'),
    components: {
        'image-view-component': ImageViewComponent
    }
})
export default class CMSDroppableTemplateComponent extends VueComponentBase {


    @Prop()
    private template_component: TemplateComponentVO;

    @Watch('template_component')
    private onchange_template_component() {
        $(this.$el).data('template_component', this.template_component);
    }

    private mounted() {

        $(this.$el).data('template_component', this.template_component);

        // make the event draggable using jQuery UI
        $(this.$el).draggable({
            zIndex: 10000,
            revert: true, // will cause the event to go back to its
            revertDuration: 0 //  original position after the drag
        });
    }
}