import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaChatVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_chat";

    public id: number;
    public _type: string = OseliaChatVO.API_TYPE_ID;

    /**
     * Le Regex qui permet de déterminer les urls
     */
    public regex: string;

    /**
     * Le partenaire
     */
    public referrer_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}