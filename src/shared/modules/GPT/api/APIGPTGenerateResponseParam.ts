/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import GPTConversationVO from '../vos/GPTConversationVO';
import GPTMessageVO from '../vos/GPTMessageVO';

export default class APIGPTGenerateResponseParam implements IAPIParamTranslator<APIGPTGenerateResponseParam> {

    public static fromParams(
        conversation: GPTConversationVO,
        newPrompt: GPTMessageVO): APIGPTGenerateResponseParam {

        return new APIGPTGenerateResponseParam(conversation, newPrompt);
    }

    public static getAPIParams(param: APIGPTGenerateResponseParam): any[] {
        return [param.conversation, param.newPrompt];
    }

    public constructor(
        public conversation: GPTConversationVO,
        public newPrompt: GPTMessageVO
    ) {

    }
}

export const APIGPTGenerateResponseParamStatic: IAPIParamTranslatorStatic<APIGPTGenerateResponseParam> = APIGPTGenerateResponseParam;