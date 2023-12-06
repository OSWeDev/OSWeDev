// import OpenAI from 'openai';
// import ThreadHandler from '../../../shared/tools/ThreadHandler';
// import ModuleGPTServer from './ModuleGPTServer';

// export default class GPTServerController {

//     public static async getAssistant(assistant_id: string): Promise<OpenAI.Beta.Assistant> {

//         return await ModuleGPTServer.getInstance().openai.Beta.Assistants.prototype.retrieve(assistant_id);
//     }

//     public static async askAssistant(assistant_id: string, question: string): Promise<string> {

//         let assistant: OpenAI.Beta.Assistant = await GPTServerController.getAssistant(assistant_id);

//         let thread = await ModuleGPTServer.getInstance().openai.Beta.Threads.prototype.create();

//         await ModuleGPTServer.getInstance().openai.Beta.Threads.Messages.prototype.create(
//             thread.id,
//             "user",
//             question
//         );

//         let run = await ModuleGPTServer.getInstance().openai.Beta.Threads.Runs.prototype.create(
//             thread.id,
//             assistant.id
//             // ,
//             // instructions = "Please address the user as Jane Doe. The user has a premium account."
//         );

//         while (run.status != "completed") {
//             await ThreadHandler.sleep(100, 'GPTServerController.askAssistant');
//             run = await ModuleGPTServer.getInstance().openai.Beta.Threads.Runs.prototype.retrieve(
//                 thread.id,
//                 run.id
//             );
//         }

//         let messages = await ModuleGPTServer.getInstance().openai.Beta.Threads.Messages.prototype.list(
//             thread.id
//         );

//         let res: string = "";

//         for (let i in messages.data) {
//             let message = messages.data[i];

//             if (message.role == "assistant") {
//                 res += message.text;
//             }
//         }

//         return res;
//     }
// }