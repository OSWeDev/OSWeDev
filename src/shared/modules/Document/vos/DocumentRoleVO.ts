import IDistantVOBase from '../../IDistantVOBase';

export default class DocumentRoleVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "d_role";

    public id: number;
    public _type: string = DocumentRoleVO.API_TYPE_ID;

    public role_id: number;
    public d_id: number;
}