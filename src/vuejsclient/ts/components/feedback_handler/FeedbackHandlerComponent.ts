

import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import VueAppController from '../../../VueAppController';
import VueComponentBase from '../VueComponentBase';
import './FeedbackHandlerComponent.scss';
import FeedbackHandlerFormComponent from './form/FeedbackHandlerFormComponent';
import { ModuleFeedbackAction, ModuleFeedbackGetter } from './store/FeedbackStore';

@Component({
    template: require('./FeedbackHandlerComponent.pug'),
    components: {
        FeedbackHandlerFormComponent: FeedbackHandlerFormComponent,
    }
})
export default class FeedbackHandlerComponent extends VueComponentBase {

    @ModuleFeedbackGetter
    public get_hidden: boolean;
    @ModuleFeedbackAction
    public set_hidden: (hidden: boolean) => void;

    @Prop({ default: false })
    private show_wish_be_called: boolean;

    @Prop({ default: 'VueMain' })
    private dom_id_to_capture: string;

    get isActive(): boolean {
        return ModuleFeedback.getInstance().actif && VueAppController.getInstance().has_access_to_feedback;
    }

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);

        if (!this.get_hidden) {
            this.fire_modal_inert('.feedback_handler_modal');
        }
    }
}