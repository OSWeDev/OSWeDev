import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';

export default class PolicyGroupSegmentation {

    private static UID: number = 1;

    public id: number;

    constructor(
        public group_id: number,
        public name: string,
        public policies: AccessPolicyVO[]) {
        this.id = PolicyGroupSegmentation.UID++;
    }
}