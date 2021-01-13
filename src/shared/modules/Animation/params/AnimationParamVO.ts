export default class AnimationParamVO {
    public static async translateCheckAccessParams(
        user_id: number,
        theme_ids: number[],
        module_ids: number[],
    ): Promise<AnimationParamVO> {
        return new AnimationParamVO(user_id, theme_ids, module_ids);
    }

    public constructor(
        public user_id: number,
        public theme_ids: number[],
        public module_ids: number[],
    ) { }
}