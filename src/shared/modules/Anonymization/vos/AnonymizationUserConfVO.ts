import IDistantVOBase from "../../../../shared/modules/IDistantVOBase";

export default class AnonymizationUserConfVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "anonym_user_conf";

    public id: number;
    public _type: string = AnonymizationUserConfVO.API_TYPE_ID;

    public user_id: number;
    public anon_field_name: number;
}