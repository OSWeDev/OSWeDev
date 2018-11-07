import ConversionHandler from '../../../tools/ConversionHandler';
import IDistantVOBase from '../../IDistantVOBase';

export default class UserRoleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "userroles";

    public id: number;
    public _type: string = UserRoleVO.API_TYPE_ID;

    public user_id: number;
    public role_id: number;
}