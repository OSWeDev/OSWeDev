import DataFilterOption from "../../DataRender/vos/DataFilterOption";

export default class AnimationReportingParamVO {
    public static async translateCheckAccessParams(
        filter_anim_theme_active_options: DataFilterOption[],
        filter_anim_module_active_options: DataFilterOption[],
        filter_role_active_options: DataFilterOption[],
        filter_user_active_options: DataFilterOption[],
        filter_module_termine_active_option: DataFilterOption,
        filter_module_valide_active_option: DataFilterOption,
    ): Promise<AnimationReportingParamVO> {
        return new AnimationReportingParamVO(
            filter_anim_theme_active_options,
            filter_anim_module_active_options,
            filter_role_active_options,
            filter_user_active_options,
            filter_module_termine_active_option,
            filter_module_valide_active_option,
        );
    }

    public constructor(
        public filter_anim_theme_active_options: DataFilterOption[],
        public filter_anim_module_active_options: DataFilterOption[],
        public filter_role_active_options: DataFilterOption[],
        public filter_user_active_options: DataFilterOption[],
        public filter_module_termine_active_option: DataFilterOption,
        public filter_module_valide_active_option: DataFilterOption,
    ) { }
}