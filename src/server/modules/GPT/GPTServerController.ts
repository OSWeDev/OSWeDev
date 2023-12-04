import OpenAI from 'openai';
import ThreadHandler from '../../../shared/tools/ThreadHandler';

export default class GPTServerController {

    public static async getAssistant(assistant_id: string): Promise<OpenAI.Beta.Assistant> {

        return await OpenAI.Beta.Assistants.retrieve(assistant_id);
    }

    public static async askAssistant(assistant_id: string, question: string): Promise<string> {

        let assistant: OpenAI.Beta.Assistant = await GPTServerController.getAssistant(assistant_id);

        let thread = await OpenAI.Beta.Threads.create();

        await OpenAI.Beta.Threads.Messages.create(
            thread.id,
            "user",
            question
        );

        let run = await OpenAI.Beta.Threads.Runs.create(
            thread.id,
            assistant.id
            // ,
            // instructions = "Please address the user as Jane Doe. The user has a premium account."
        );

        while (run.status != "completed") {
            await ThreadHandler.sleep(100, 'GPTServerController.askAssistant');
            run = await OpenAI.Beta.Threads.Runs.retrieve(
                thread.id,
                run.id
            );
        }

        let messages = await OpenAI.Beta.Threads.Messages.list(
            thread.id
        );

        let res: string = "";

        for (let i in messages.data) {
            let message = messages.data[i];

            if (message.role == "assistant") {
                res += message.text;
            }
        }

        return res;
    }
}