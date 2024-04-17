import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

/**
 * Le referrer est le VO qui défini l'interaction entre Osélia et un partenaire externe qui souhaite utiliser un assistant via Osélia
 */
export default class OseliaReferrerExternalAPIVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_referrer_external_api";

    public static API_METHOD_LABELS: string[] = [
        'OseliaReferrerExternalAPIVO.API_METHOD_GET',
        'OseliaReferrerExternalAPIVO.API_METHOD_POST'
    ];
    public static API_METHOD_GET: number = 0;
    public static API_METHOD_POST: number = 1;

    public id: number;
    public _type: string = OseliaReferrerExternalAPIVO.API_TYPE_ID;

    public referrer_id: number;

    public name: string;
    public description: string;

    public actif: boolean;

    public external_api_authentication_id: number;
    public external_api_method: number;
    public external_api_url: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}