// import GPTConversationVO from "../vos/GPTConversationVO";
// import GPTMessageVO from "../vos/GPTMessageVO";

// export default class GPTAPIMessage {

//     public static ROLE_FROM_MESSAGEVO_ROLE: { [role_message_vo_id: number]: string } = {
//         0: 'system',
//         1: 'user',
//         2: 'assistant'
//     };

//     public static fromConversation(conversation: GPTConversationVO): GPTAPIMessage[] {
//         let res: GPTAPIMessage[] = [];

//         for (let i in conversation.messages) {
//             let message = conversation.messages[i];

//             res.push(GPTAPIMessage.fromMessage(message));
//         }

//         return res;
//     }

//     public static fromMessage(message: GPTMessageVO): GPTAPIMessage {
//         let res: GPTAPIMessage = new GPTAPIMessage();

//         res.role = GPTAPIMessage.ROLE_FROM_MESSAGEVO_ROLE[message.role_type];
//         res.content = message.content;

//         return res;
//     }

//     public role: string;
//     public content: string;



//     // The identifier, which can be referenced in API endpoints.
//     public id: string;


//     object
//     string
// The object type, which is always assistant.

//     created_at
// integer
// The Unix timestamp(in seconds) for when the assistant was created.

//     name
// string or null
// The name of the assistant.The maximum length is 256 characters.

//     description
// string or null
// The description of the assistant.The maximum length is 512 characters.

//     model
// string
// ID of the model to use.You can use the List models API to see all of your available models, or see our Model overview for descriptions of them.

//     instructions
// string or null
// The system instructions that the assistant uses.The maximum length is 32768 characters.

//     tools
// array
// A list of tool enabled on the assistant.There can be a maximum of 128 tools per assistant.Tools can be of types code_interpreter, retrieval, or function.


// Show possible types
// file_ids
// array
// A list of file IDs attached to this assistant.There can be a maximum of 20 files attached to the assistant.Files are ordered by their creation date in ascending order.

//     metadata
// map
// Set of 16 key - value pairs that can be attached to an object.This can be useful for storing additional information about the object in a structured format.Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
// }
