/* istanbul ignore file : nothing to test in ParamVOs */

import { Request } from "express";
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class OpenOseliaDBParamVO implements IAPIParamTranslator<OpenOseliaDBParamVO> {

    public static URL: string = ':referrer_user_ott/:openai_thread_id/:openai_assistant_id';

    public constructor(
        public referrer_user_ott: string,
        public openai_thread_id: string,
        public openai_assistant_id: string,
    ) {
    }

    public static fromREQ(req: Request): OpenOseliaDBParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new OpenOseliaDBParamVO(
            req.params.referrer_user_ott,
            req.params.openai_thread_id,
            req.params.openai_assistant_id,
        );
    }

    public static fromParams(
        referrer_user_ott: string,
        openai_thread_id: string,
        openai_assistant_id: string,
    ): OpenOseliaDBParamVO {

        return new OpenOseliaDBParamVO(
            referrer_user_ott,
            openai_thread_id,
            openai_assistant_id,
        );
    }

    public static getAPIParams(param: OpenOseliaDBParamVO): any[] {
        return [
            param.referrer_user_ott,
            param.openai_thread_id,
            param.openai_assistant_id,
        ];
    }

    public translateToURL(): string {

        return this.referrer_user_ott + '/' + this.openai_thread_id + '/' + this.openai_assistant_id;
    }
}

export const OpenOseliaDBParamVOStatic: IAPIParamTranslatorStatic<OpenOseliaDBParamVO> = OpenOseliaDBParamVO;