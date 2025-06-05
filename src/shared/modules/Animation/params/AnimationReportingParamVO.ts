/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import DataFilterOptionVO from "../../DashboardBuilder/vos/widgets_options/tools/DataFilterOptionVO";

export default class AnimationReportingParamVO implements IAPIParamTranslator<AnimationReportingParamVO> {

    public static fromParams(
        filter_anim_theme_active_options: DataFilterOptionVO[],
        filter_anim_module_active_options: DataFilterOptionVO[],
        filter_role_active_options: DataFilterOptionVO[],
        filter_user_active_options: DataFilterOptionVO[],
        filter_module_termine_active_option: DataFilterOptionVO,
        filter_module_valide_active_option: DataFilterOptionVO
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
        public filter_anim_theme_active_options: DataFilterOptionVO[],
        public filter_anim_module_active_options: DataFilterOptionVO[],
        public filter_role_active_options: DataFilterOptionVO[],
        public filter_user_active_options: DataFilterOptionVO[],
        public filter_module_termine_active_option: DataFilterOptionVO,
        public filter_module_valide_active_option: DataFilterOptionVO) {
    }
}

export const AnimationReportingParamVOStatic: IAPIParamTranslatorStatic<AnimationReportingParamVO> = AnimationReportingParamVO;