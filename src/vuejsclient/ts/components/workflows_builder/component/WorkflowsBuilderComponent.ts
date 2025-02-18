import { Component, Prop } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import './WorkflowsBuilderComponent.scss';

@Component({
    template: require('./WorkflowsBuilderComponent.pug'),
    components: {}
})
export default class WorkflowsBuilderComponent extends VueComponentBase {
    @Prop({ default: null })
    private workflows_id: string;

}