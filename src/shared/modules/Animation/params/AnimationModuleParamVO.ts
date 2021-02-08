export default class AnimationModuleParamVO {
    public static async translateCheckAccessParams(
        user_id: number,
        module_id: number,
        support: number,
    ): Promise<AnimationModuleParamVO> {
        return new AnimationModuleParamVO(user_id, module_id, support);
    }

    public constructor(
        public user_id: number,
        public module_id: number,
        public support: number,
    ) { }
}