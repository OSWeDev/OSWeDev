
import INamedVO from '../../../interfaces/INamedVO';
import NumRange from '../../DataRender/vos/NumRange';

export default class MailCategoryVO implements INamedVO {

    public static API_TYPE_ID: string = "mail_category";

    public static TYPE_OPTIN_OPTIN: number = 0;
    public static TYPE_OPTIN_OPTOUT: number = 1;
    public static TYPE_OPTIN_LABELS: string[] = [
        "mail_category.type_optin.optin",
        "mail_category.type_optin.optout",
    ];

    public id: number;
    public _type: string = MailCategoryVO.API_TYPE_ID;

    public name: string;
    public type_optin: number;

    /**
     * La liste des rôles qui peuvent optin/optout sur cette catégorie de mails dans mon-compte
     */
    public user_role_id_ranges: NumRange[];
}