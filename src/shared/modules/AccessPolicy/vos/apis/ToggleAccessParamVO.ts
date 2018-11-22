export default class ToggleAccessParamVO {

    public static URL: string = ':policy_id/:role_id';

    public static async translateCheckAccessParams(
        policy_id: number,
        role_id: number): Promise<ToggleAccessParamVO> {

        return new ToggleAccessParamVO(policy_id, role_id);
    }

    public static async translateToURL(param: ToggleAccessParamVO): Promise<string> {

        return param ? param.policy_id + '/' + param.role_id : '';
    }
    public static async translateFromREQ(req): Promise<ToggleAccessParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new ToggleAccessParamVO(parseInt(req.params.policy_id), parseInt(req.params.role_id));
    }

    public constructor(
        public policy_id: number,
        public role_id: number) {
    }
}