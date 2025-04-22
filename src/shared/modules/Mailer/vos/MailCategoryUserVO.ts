
import IDistantVOBase from '../../IDistantVOBase';

export default class MailCategoryUserVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "mail_category_user";

    public id: number;
    public _type: string = MailCategoryUserVO.API_TYPE_ID;

    public mail_category_id: number;
    public user_id: number;
}