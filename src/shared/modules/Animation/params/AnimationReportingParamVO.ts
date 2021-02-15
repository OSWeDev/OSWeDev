import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import DataFilterOption from "../../DataRender/vos/DataFilterOption";

export default class AnimationReportingParamVO implements IAPIParamTranslator<AnimationReportingParamVO> {

    public static fromParams(
        filter_anim_theme_active_options: DataFilterOption[],
        filter_anim_module_active_options: DataFilterOption[],
        filter_role_active_options: DataFilterOption[],
        filter_user_active_options: DataFilterOption[],
        filter_module_termine_active_option: DataFilterOption,
        filter_module_valide_active_option: DataFilterOption
    ): AnimationReportingParamVO {
        return new AnimationReportingParamVO(
            filter_anim_theme_active_options,
            filter_anim_module_active_options,
            filter_role_active_options,
            filter_user_active_options,
            filter_module_termine_active_option,
            filter_module_valide_active_option);
    }

    public static getAPIParams(param: AnimationReportingParamVO): any[] {
        return [
            param.filter_anim_theme_active_options,
            param.filter_anim_module_active_options,
            param.filter_role_active_options,
            param.filter_user_active_options,
            param.filter_module_termine_active_option,
            param.filter_module_valide_active_option];
    }

    public constructor(
        public filter_anim_theme_active_options: DataFilterOption[],
        public filter_anim_module_active_options: DataFilterOption[],
        public filter_role_active_options: DataFilterOption[],
        public filter_user_active_options: DataFilterOption[],
        public filter_module_termine_active_option: DataFilterOption,
        public filter_module_valide_active_option: DataFilterOption) {
    }
}

export const AnimationReportingParamVOStatic: IAPIParamTranslatorStatic<AnimationReportingParamVO> = AnimationReportingParamVO;