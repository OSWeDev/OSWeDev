import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import VueModuleBase from '../../modules/VueModuleBase';

export default class FeedbackClientVueModule extends VueModuleBase {

    private static instance: FeedbackClientVueModule = null;

    private constructor() {

        super(ModuleFeedback.getInstance().name);
        this.policies_needed = [
            ModuleFeedback.POLICY_FO_ACCESS
        ];
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): FeedbackClientVueModule {
        if (!FeedbackClientVueModule.instance) {
            FeedbackClientVueModule.instance = new FeedbackClientVueModule();
        }

        return FeedbackClientVueModule.instance;
    }

    public async initializeAsync() {
        if (!this.policies_loaded[ModuleFeedback.POLICY_FO_ACCESS]) {
            return;
        }

        this.routes.push({
            path: '/feedback_form',
            name: ModuleFeedback.ROUTE_NAME_FEEDBACK_FORM,
            component: () => import('./form/FeedbackHandlerFormComponent'),
        });
    }
}