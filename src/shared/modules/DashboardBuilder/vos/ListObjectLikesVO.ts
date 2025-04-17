import IDistantVOBase from "../../IDistantVOBase";

export default class ListObjectLikesVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "list_object_likes";

    public id: number;
    public _type: string = ListObjectLikesVO.API_TYPE_ID;

    public api_type_id: string;
    public vo_id: number;
    public list_user_likes: number[];
}