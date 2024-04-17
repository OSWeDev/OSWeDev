/* istanbul ignore file : nothing to test in ParamVOs */

import { Request } from "express";
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class OpenOseliaDBParamVO implements IAPIParamTranslator<OpenOseliaDBParamVO> {

    public static URL: string = ':referrer_code/:referrer_user_uid/:openai_thread_id/:openai_assistant_id';

    public constructor(
        public referrer_code: string,
        public referrer_user_uid: string,
        public openai_thread_id: string,
        public openai_assistant_id: string,
    ) {
    }

    public static fromREQ(req: Request): OpenOseliaDBParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new OpenOseliaDBParamVO(
            req.params.referrer_code,
            req.params.referrer_user_uid,
            req.params.openai_thread_id,
            req.params.openai_assistant_id,
        );
    }

    public static fromParams(
        referrer_code: string,
        referrer_user_uid: string,
        openai_thread_id: string,
        openai_assistant_id: string,
    ): OpenOseliaDBParamVO {

        return new OpenOseliaDBParamVO(
            referrer_code,
            referrer_user_uid,
            openai_thread_id,
            openai_assistant_id,
        );
    }

    public static getAPIParams(param: OpenOseliaDBParamVO): any[] {
        return [
            param.referrer_code,
            param.referrer_user_uid,
            param.openai_thread_id,
            param.openai_assistant_id,
        ];
    }

    public translateToURL(): string {

        return this.referrer_code + '/' + this.referrer_user_uid + '/' + this.openai_thread_id + '/' + this.openai_assistant_id;
    }
}

export const OpenOseliaDBParamVOStatic: IAPIParamTranslatorStatic<OpenOseliaDBParamVO> = OpenOseliaDBParamVO;