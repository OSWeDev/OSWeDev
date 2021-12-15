
import INamedVO from '../../../interfaces/INamedVO';

export default class MailCategoryVO implements INamedVO {

    public static API_TYPE_ID: string = "mail_category";

    public id: number;
    public _type: string = MailCategoryVO.API_TYPE_ID;

    public name: string;
}