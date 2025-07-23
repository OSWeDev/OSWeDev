import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';
import OseliaRunTemplateVO from '../../Oselia/vos/OseliaRunTemplateVO';
import GPTCompletionAPIConversationVO from '../vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../vos/GPTCompletionAPIMessageVO';

export default class APIRealtimeVoiceConnectParam implements IAPIParamTranslator<APIRealtimeVoiceConnectParam> {
    public constructor(
        public session_id: string,
        public conversation_id: string,
        public thread_id: string,
        public user_id: number,
        public oselia_run_template: OseliaRunTemplateVO | null = null,
        public initial_cache_key: string | null = null,
        public technical_message_prompt: string | null = null,
    ) {}


    public static fromParams(
        session_id: string,
        conversation_id: string,
        thread_id: string,
        user_id: number,
        oselia_run_template: OseliaRunTemplateVO | null = null,
        initial_cache_key: string | null = null,
        technical_message_prompt: string | null = null
    ): APIRealtimeVoiceConnectParam {

        return new APIRealtimeVoiceConnectParam(session_id, conversation_id, thread_id, user_id, oselia_run_template, initial_cache_key, technical_message_prompt);
    }

    public static getAPIParams(param: APIRealtimeVoiceConnectParam): any[] {
        return [param.session_id, param.conversation_id, param.thread_id, param.user_id, param.oselia_run_template, param.initial_cache_key, param.technical_message_prompt];
    }

}

export const APIRealtimeVoiceConnectParamStatic: IAPIParamTranslatorStatic<APIRealtimeVoiceConnectParam> = APIRealtimeVoiceConnectParam;