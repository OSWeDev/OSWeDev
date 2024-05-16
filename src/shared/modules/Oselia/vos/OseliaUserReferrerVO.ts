import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

/**
 * Lien entre les users et les referrers pour valider l'accès d'un user à Osélia via un referrer
 */
export default class OseliaUserReferrerVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_user_referrer";

    public id: number;
    public _type: string = OseliaUserReferrerVO.API_TYPE_ID;

    public user_id: number;
    public referrer_id: number;

    public actif: boolean;
    public user_validated: boolean;
    public referrer_user_uid: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}