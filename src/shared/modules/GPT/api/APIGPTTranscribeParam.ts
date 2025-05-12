/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';

export default class APIGPTTranscribeParam implements IAPIParamTranslator<APIGPTTranscribeParam> {

    public constructor(
        public file_vo_id: number,
        public auto_commit_auto_input: boolean,
        public gpt_assistant_id: string,
        public gpt_thread_id: string,
        public user_id: number,
    ) { }

    public static fromParams(
        file_vo_id: number,
        auto_commit_auto_input: boolean,
        gpt_assistant_id: string,
        gpt_thread_id: string,
        user_id: number,
    ): APIGPTTranscribeParam {

        return new APIGPTTranscribeParam(
            file_vo_id,
            auto_commit_auto_input,
            gpt_assistant_id,
            gpt_thread_id,
            user_id,
        );
    }

    public static getAPIParams(param: APIGPTTranscribeParam): any[] {
        return [
            param.file_vo_id,
            param.auto_commit_auto_input,
            param.gpt_assistant_id,
            param.gpt_thread_id,
            param.user_id,
        ];
    }
}

export const APIGPTTranscribeParamStatic: IAPIParamTranslatorStatic<APIGPTTranscribeParam> = APIGPTTranscribeParam;