/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';

export default class APIGPTCreateTechnicalMessageParam implements IAPIParamTranslator<APIGPTCreateTechnicalMessageParam> {

    public constructor(
        public gpt_thread_id: string,
        public content_text: string,
        public user_id: number,
    ) { }

    public static fromParams(
        gpt_thread_id: string,
        content_text: string,
        user_id: number,
    ): APIGPTCreateTechnicalMessageParam {

        return new APIGPTCreateTechnicalMessageParam(
            gpt_thread_id,
            content_text,
            user_id,
        );
    }

    public static getAPIParams(param: APIGPTCreateTechnicalMessageParam): any[] {
        return [
            param.gpt_thread_id,
            param.content_text,
            param.user_id,
        ];
    }

    public translateFromJSON(json: APIGPTCreateTechnicalMessageParam): APIGPTCreateTechnicalMessageParam {

        if ((!json) || (typeof json === "string")) {
            return null;
        }

        return APIGPTCreateTechnicalMessageParam.fromParams(
            json.gpt_thread_id,
            json.content_text,
            json.user_id,
        );
    }
}

export const APIGPTCreateTechnicalMessageParamStatic: IAPIParamTranslatorStatic<APIGPTCreateTechnicalMessageParam> = APIGPTCreateTechnicalMessageParam;
