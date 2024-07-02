import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

/**
 * Lien entre les threads et les referrers pour valider l'accès d'un referrer à un thread de discussion
 */
export default class OseliaThreadReferrerVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_thread_referrer";

    public id: number;
    public _type: string = OseliaThreadReferrerVO.API_TYPE_ID;

    public thread_id: number;
    public referrer_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}