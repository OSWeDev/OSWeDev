import AccessPolicyVO from '../AccessPolicyVO';
import RoleVO from '../RoleVO';

export default class AddDefaultRolePolicyIfNotExistsParamVO {

    public static URL: string = ':group_name/:policy_name';

    public static async translateCheckAccessParams(
        role: RoleVO,
        policy: AccessPolicyVO,
        granted: boolean): Promise<AddDefaultRolePolicyIfNotExistsParamVO> {

        return new AddDefaultRolePolicyIfNotExistsParamVO(role, policy, granted);
    }

    public constructor(
        public role: RoleVO,
        public policy: AccessPolicyVO,
        public granted: boolean) {
    }
}