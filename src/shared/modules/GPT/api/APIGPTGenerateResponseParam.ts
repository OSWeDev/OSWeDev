/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import GPTCompletionAPIConversationVO from '../vos/GPTCompletionAPIConversationVO';
import GPTCompletionAPIMessageVO from '../vos/GPTCompletionAPIMessageVO';

export default class APIGPTGenerateResponseParam implements IAPIParamTranslator<APIGPTGenerateResponseParam> {

    public static fromParams(
        conversation: GPTCompletionAPIConversationVO,
        newPrompt: GPTCompletionAPIMessageVO): APIGPTGenerateResponseParam {

        return new APIGPTGenerateResponseParam(conversation, newPrompt);
    }

    public static getAPIParams(param: APIGPTGenerateResponseParam): any[] {
        return [param.conversation, param.newPrompt];
    }

    public constructor(
        public conversation: GPTCompletionAPIConversationVO,
        public newPrompt: GPTCompletionAPIMessageVO) {
    }
}

export const APIGPTGenerateResponseParamStatic: IAPIParamTranslatorStatic<APIGPTGenerateResponseParam> = APIGPTGenerateResponseParam;