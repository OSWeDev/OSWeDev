import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import GPTCompletionAPIConversationVO from '../vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../vos/GPTCompletionAPIMessageVO';

export default class APIRealtimeVoiceConnectParam implements IAPIParamTranslator<APIRealtimeVoiceConnectParam> {
    public constructor(
        public session_id: string,
        public conversation_id: string,
        public thread_id: string,
        public user_id: number) {
    }

    public static fromParams(
        session_id: string,
        conversation_id: string,
        thread_id: string,
        user_id: number): APIRealtimeVoiceConnectParam {

        return new APIRealtimeVoiceConnectParam(session_id, conversation_id, thread_id, user_id);
    }

    public static getAPIParams(param: APIRealtimeVoiceConnectParam): any[] {
        return [param.session_id, param.conversation_id, param.thread_id, param.user_id];
    }

}

export const APIRealtimeVoiceConnectParamStatic: IAPIParamTranslatorStatic<APIRealtimeVoiceConnectParam> = APIRealtimeVoiceConnectParam;