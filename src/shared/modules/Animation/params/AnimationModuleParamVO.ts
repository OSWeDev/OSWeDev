/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class AnimationModuleParamVO implements IAPIParamTranslator<AnimationModuleParamVO> {

    public static fromParams(user_id: number, module_id: number, support: number): AnimationModuleParamVO {
        return new AnimationModuleParamVO(user_id, module_id, support);
    }

    public static getAPIParams(param: AnimationModuleParamVO): any[] {
        return [param.user_id, param.module_id, param.support];
    }

    public constructor(
        public user_id: number,
        public module_id: number,
        public support: number) {
    }
}

export const AnimationModuleParamVOStatic: IAPIParamTranslatorStatic<AnimationModuleParamVO> = AnimationModuleParamVO;