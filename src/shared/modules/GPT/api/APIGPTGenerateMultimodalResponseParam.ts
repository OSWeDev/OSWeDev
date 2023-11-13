/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import GPTMultiModalConversationVO from '../vos/GPTMultiModalConversationVO';
import GPTMultiModalMessageVO from '../vos/GPTMultiModalMessageVO';

export default class APIGPTGenerateMultimodalResponseParam implements IAPIParamTranslator<APIGPTGenerateMultimodalResponseParam> {

    public static fromParams(
        conversation: GPTMultiModalConversationVO,
        newPrompt: GPTMultiModalMessageVO): APIGPTGenerateMultimodalResponseParam {

        return new APIGPTGenerateMultimodalResponseParam(conversation, newPrompt);
    }

    public static getAPIParams(param: APIGPTGenerateMultimodalResponseParam): any[] {
        return [param.conversation, param.newPrompt];
    }

    public constructor(
        public conversation: GPTMultiModalConversationVO,
        public newPrompt: GPTMultiModalMessageVO) {
    }
}

export const APIGPTGenerateMultimodalResponseParamStatic: IAPIParamTranslatorStatic<APIGPTGenerateMultimodalResponseParam> = APIGPTGenerateMultimodalResponseParam;