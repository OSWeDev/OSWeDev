import Component from 'vue-class-component';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import './WorkflowsViewerComponent.scss';
import { Prop } from 'vue-property-decorator';

@Component({
    template: require('./WorkflowsViewerComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class WorkflowsViewerComponent extends VueComponentBase {

    @Prop({ default: null })
    private workflows_id: string;

}