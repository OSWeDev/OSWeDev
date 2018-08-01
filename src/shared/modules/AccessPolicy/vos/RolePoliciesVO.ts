import ConversionHandler from '../../../tools/ConversionHandler';
import IDistantVOBase from '../../IDistantVOBase';

export default class RolePoliciesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "rolepolicies";

    public id: number;
    public _type: string = RolePoliciesVO.API_TYPE_ID;

    public accpol_id: number;
    public role_id: number;
    public granted: boolean = false;
}