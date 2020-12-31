export default class AnimationModuleParamVO {
    public static async translateCheckAccessParams(
        user_id: number,
        module_id: number,
    ): Promise<AnimationModuleParamVO> {
        return new AnimationModuleParamVO(user_id, module_id);
    }

    public constructor(
        public user_id: number,
        public module_id: number,
    ) { }
}