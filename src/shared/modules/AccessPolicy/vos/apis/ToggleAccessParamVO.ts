import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class ToggleAccessParamVO implements IAPIParamTranslator<ToggleAccessParamVO> {

    public static URL: string = ':policy_id/:role_id';

    public static fromREQ(req): ToggleAccessParamVO {

        if (!(req && req.params)) {
            return null;
        }
        return new ToggleAccessParamVO(parseInt(req.params.policy_id), parseInt(req.params.role_id));
    }

    public static fromParams(policy_id: number, role_id: number): ToggleAccessParamVO {

        return new ToggleAccessParamVO(policy_id, role_id);
    }

    public static getAPIParams(param: ToggleAccessParamVO): any[] {
        return [param.policy_id, param.role_id];
    }

    public constructor(
        public policy_id: number,
        public role_id: number) {
    }

    public translateToURL(): string {

        return this.policy_id + '/' + this.role_id;
    }
}

export const ToggleAccessParamVOStatic: IAPIParamTranslatorStatic<ToggleAccessParamVO> = ToggleAccessParamVO;