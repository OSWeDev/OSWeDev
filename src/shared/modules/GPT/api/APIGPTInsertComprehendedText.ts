/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IPlanRDVCR from '../../ProgramPlan/interfaces/IPlanRDVCR';

export default class APIGPTInsertComprehendedText implements IAPIParamTranslator<APIGPTInsertComprehendedText> {

    public constructor(
        public target_thread_id: string,
        public comprehension: string,
        public user_id: number
    ) { }

    public static fromParams(
        target_thread_id: string,
        comprehension: string,
        user_id: number
    ): APIGPTInsertComprehendedText {

        return new APIGPTInsertComprehendedText(
            target_thread_id,
            comprehension,
            user_id
        );
    }

    public static getAPIParams(param: APIGPTInsertComprehendedText): any[] {
        return [
            param.target_thread_id,
            param.comprehension,
            param.user_id
        ];
    }
}

export const APIGPTInsertComprehendedTextStatic: IAPIParamTranslatorStatic<APIGPTInsertComprehendedText> = APIGPTInsertComprehendedText;