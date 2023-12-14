/* istanbul ignore file : nothing to test in ParamVOs */

import { Request } from "express";
import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class CheckAccessParamVO implements IAPIParamTranslator<CheckAccessParamVO> {

    public static URL: string = ':group_name/:policy_name';

    public static fromREQ(req: Request): CheckAccessParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new CheckAccessParamVO(req.params.group_name, req.params.policy_name);
    }

    public static fromParams(group_name: string, policy_name: string): CheckAccessParamVO {

        return new CheckAccessParamVO(group_name, policy_name);
    }

    public static getAPIParams(param: CheckAccessParamVO): any[] {
        return [param.group_name, param.policy_name];
    }

    public constructor(
        public group_name: string,
        public policy_name: string) {
    }

    public translateToURL(): string {

        return this.group_name + '/' + this.policy_name;
    }
}

export const CheckAccessParamVOStatic: IAPIParamTranslatorStatic<CheckAccessParamVO> = CheckAccessParamVO;