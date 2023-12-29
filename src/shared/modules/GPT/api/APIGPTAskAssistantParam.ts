/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import FileVO from '../../File/vos/FileVO';

export default class APIGPTAskAssistantParam implements IAPIParamTranslator<APIGPTAskAssistantParam> {

    public static fromParams(
        assistant_id: string,
        thread_id: string,
        content: string,
        files: FileVO[],
        user_id: number
    ): APIGPTAskAssistantParam {

        return new APIGPTAskAssistantParam(
            assistant_id,
            thread_id,
            content,
            files,
            user_id
        );
    }

    public static getAPIParams(param: APIGPTAskAssistantParam): any[] {
        return [
            param.assistant_id,
            param.thread_id,
            param.content,
            param.files,
            param.user_id
        ];
    }

    public constructor(
        public assistant_id: string,
        public thread_id: string,
        public content: string,
        public files: FileVO[],
        public user_id: number
    ) {
    }
}

export const APIGPTAskAssistantParamStatic: IAPIParamTranslatorStatic<APIGPTAskAssistantParam> = APIGPTAskAssistantParam;