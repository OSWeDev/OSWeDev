import IDistantVOBase from '../../IDistantVOBase';

export default class RolePolicyVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "rolepolicies";

    public id: number;
    public _type: string = RolePolicyVO.API_TYPE_ID;

    public accpol_id: number;
    public role_id: number;
    public granted: boolean = false;
}