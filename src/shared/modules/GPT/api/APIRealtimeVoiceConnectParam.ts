import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import GPTCompletionAPIConversationVO from '../vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../vos/GPTCompletionAPIMessageVO';

export default class APIRealtimeVoiceConnectParam implements IAPIParamTranslator<APIRealtimeVoiceConnectParam> {

    public static fromParams(
        session_id: string,
        conversation_id: string,
        user_id: number,): APIRealtimeVoiceConnectParam {

        return new APIRealtimeVoiceConnectParam(session_id, conversation_id, user_id);
    }

    public static getAPIParams(param: APIRealtimeVoiceConnectParam): any[] {
        return [param.session_id, param.conversation_id, param.user_id];
    }

    public constructor(
        public session_id: string,
        public conversation_id: string,
        public user_id: number) {
    }
}

export const APIRealtimeVoiceConnectParamStatic: IAPIParamTranslatorStatic<APIRealtimeVoiceConnectParam> = APIRealtimeVoiceConnectParam;