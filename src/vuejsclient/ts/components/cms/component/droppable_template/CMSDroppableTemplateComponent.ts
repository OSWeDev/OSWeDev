import * as $ from 'jquery';
import 'jqueryui';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import TemplateComponentVO from '../../../../../../shared/modules/CMS/vos/TemplateComponentVO';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import ImageViewComponent from '../../../image/View/ImageViewComponent';
import './CMSDroppableTemplateComponent.scss';

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
            revertDuration: 0, //  original position after the drag
            opacity: 0.7,
            helper: "clone",
            cursor: "pointer",
            cursorAt: { top: -10, left: -2 },
            connectToSortable: "#sortable_page_component_list",
            revert: "invalid"
        });
    }
}