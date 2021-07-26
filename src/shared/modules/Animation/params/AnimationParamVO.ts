import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class AnimationParamVO implements IAPIParamTranslator<AnimationParamVO> {

    public static fromParams(user_ids: number[], theme_ids: number[], module_ids: number[]): AnimationParamVO {
        return new AnimationParamVO(user_ids, theme_ids, module_ids);
    }

    public static getAPIParams(param: AnimationParamVO): any[] {
        return [param.user_ids, param.theme_ids, param.module_ids];
    }

    public constructor(
        public user_ids: number[],
        public theme_ids: number[],
        public module_ids: number[]) {
    }
}

export const AnimationParamVOStatic: IAPIParamTranslatorStatic<AnimationParamVO> = AnimationParamVO;