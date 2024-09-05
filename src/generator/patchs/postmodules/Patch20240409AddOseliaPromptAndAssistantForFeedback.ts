import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240409AddOseliaPromptAndAssistantForFeedback implements IGeneratorWorker {

    private static instance: Patch20240409AddOseliaPromptAndAssistantForFeedback = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240409AddOseliaPromptAndAssistantForFeedback';
    }

    public static getInstance(): Patch20240409AddOseliaPromptAndAssistantForFeedback {
        if (!Patch20240409AddOseliaPromptAndAssistantForFeedback.instance) {
            Patch20240409AddOseliaPromptAndAssistantForFeedback.instance = new Patch20240409AddOseliaPromptAndAssistantForFeedback();
        }
        return Patch20240409AddOseliaPromptAndAssistantForFeedback.instance;
    }

    public async work(db: IDatabase<unknown>) {

        // const assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
        //     .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, ModuleFeedbackServer.FEEDBACK_ASSISTANT_NAME)
        //     .exec_as_server()
        //     .select_vo<GPTAssistantAPIAssistantVO>();

        // if (!assistant) {
        //     assistant = new GPTAssistantAPIAssistantVO();
        //     assistant.nom = ModuleFeedbackServer.FEEDBACK_ASSISTANT_NAME;
        // }

        // const prompt = new OseliaPromptVO();
        // prompt.name = 'Feedback - Demande de résumé';
        // prompt.default_assistant_id =
    }
}