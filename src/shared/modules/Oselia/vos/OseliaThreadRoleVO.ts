import IDistantVOBase from '../../IDistantVOBase';

export default class OseliaThreadRoleVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "oselia_thread_role";

    public id: number;
    public _type: string = OseliaThreadRoleVO.API_TYPE_ID;

    public translatable_name: string;
}