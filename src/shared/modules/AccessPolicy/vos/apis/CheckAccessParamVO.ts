export default class CheckAccessParamVO {

    public static URL: string = ':group_name/:policy_name';

    public static async translateCheckAccessParams(
        group_name: string,
        policy_name: string): Promise<CheckAccessParamVO> {

        return new CheckAccessParamVO(group_name, policy_name);
    }

    public static async translateToURL(param: CheckAccessParamVO): Promise<string> {

        return param ? param.group_name + '/' + param.policy_name : '';
    }
    public static async translateFromREQ(req): Promise<CheckAccessParamVO> {

        if (!(req && req.params)) {
            return null;
        }
        return new CheckAccessParamVO(req.params.group_name, req.params.policy_name);
    }

    public constructor(
        public group_name: string,
        public policy_name: string) {
    }
}