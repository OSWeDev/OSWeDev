/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import FileVO from '../../File/vos/FileVO';

export default class APIGPTAskAssistantParam implements IAPIParamTranslator<APIGPTAskAssistantParam> {

    public constructor(
        public assistant_id: string,
        public thread_id: string,
        public thread_title: string,
        public content: string,
        public files: FileVO[],
        public user_id: number,
        public hide_content: boolean,
    ) { }

    public static fromParams(
        assistant_id: string,
        thread_id: string,
        thread_title: string,
        content: string,
        files: FileVO[],
        user_id: number,
        hide_content: boolean,
    ): APIGPTAskAssistantParam {

        return new APIGPTAskAssistantParam(
            assistant_id,
            thread_id,
            thread_title,
            content,
            files,
            user_id,
            hide_content,
        );
    }

    public static getAPIParams(param: APIGPTAskAssistantParam): any[] {
        return [
            param.assistant_id,
            param.thread_id,
            param.thread_title,
            param.content,
            param.files,
            param.user_id,
            param.hide_content,
        ];
    }
}

export const APIGPTAskAssistantParamStatic: IAPIParamTranslatorStatic<APIGPTAskAssistantParam> = APIGPTAskAssistantParam;