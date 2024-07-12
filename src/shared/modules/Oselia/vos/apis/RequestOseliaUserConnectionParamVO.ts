/* istanbul ignore file : nothing to test in ParamVOs */

import { Request } from "express";
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class RequestOseliaUserConnectionParamVO implements IAPIParamTranslator<RequestOseliaUserConnectionParamVO> {

    public static URL: string = ':referrer_code/:user_email/:referrer_user_uid';

    public constructor(
        public referrer_code: string,
        public user_email: string,
        public referrer_user_uid: string,
    ) {
    }

    public static fromREQ(req: Request): RequestOseliaUserConnectionParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new RequestOseliaUserConnectionParamVO(
            req.params.referrer_code,
            req.params.user_email,
            req.params.referrer_user_uid,
        );
    }

    public static fromParams(
        referrer_code: string,
        user_email: string,
        referrer_user_uid: string,
    ): RequestOseliaUserConnectionParamVO {

        return new RequestOseliaUserConnectionParamVO(
            referrer_code,
            user_email,
            referrer_user_uid,
        );
    }

    public static getAPIParams(param: RequestOseliaUserConnectionParamVO): any[] {
        return [
            param.referrer_code,
            param.user_email,
            param.referrer_user_uid,
        ];
    }

    public translateToURL(): string {

        return this.referrer_code + '/' + this.user_email + '/' + this.referrer_user_uid;
    }
}

export const RequestOseliaUserConnectionParamVOStatic: IAPIParamTranslatorStatic<RequestOseliaUserConnectionParamVO> = RequestOseliaUserConnectionParamVO;