export default class AnimationParamVO {
    public static async translateCheckAccessParams(
        user_id: number,
        module_ids: number[],
        theme_ids: number[],
    ): Promise<AnimationParamVO> {
        return new AnimationParamVO(user_id, module_ids, theme_ids);
    }

    public constructor(
        public user_id: number,
        public module_ids: number[],
        public theme_ids: number[],
    ) { }
}