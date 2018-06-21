export default class RegisterModuleAccessPolicyParamVO {

    public static async translateCheckAccessParams(
        group_name: string, policy_name: string): Promise<RegisterModuleAccessPolicyParamVO> {

        return new RegisterModuleAccessPolicyParamVO(group_name, policy_name);
    }

    public constructor(
        public group_name: string, public policy_name: string) {
    }
}