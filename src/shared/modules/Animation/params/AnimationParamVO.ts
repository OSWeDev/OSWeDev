export default class AnimationParamVO {
    public static async translateCheckAccessParams(
        user_ids: number[],
        theme_ids: number[],
        module_ids: number[],
    ): Promise<AnimationParamVO> {
        return new AnimationParamVO(user_ids, theme_ids, module_ids);
    }

    public constructor(
        public user_ids: number[],
        public theme_ids: number[],
        public module_ids: number[],
    ) { }
}