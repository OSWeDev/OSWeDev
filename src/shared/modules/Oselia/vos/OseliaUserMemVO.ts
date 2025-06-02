import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaUserMemVO implements IDistantVOBase, IVersionedVO {

    public static ASSISTANT_INSTRUCTIONS_APPENDED_TEXT_PARAM_NAME: string = "OseliaUserMemVO.ASSISTANT_INSTRUCTIONS_APPENDED_TEXT";

    public static API_TYPE_ID: string = "oselia_user_mem";

    public id: number;
    public _type: string = OseliaUserMemVO.API_TYPE_ID;

    /**
     * User lié
     */
    public user_id: number;

    /**
     * Nom de l'entrée
     */
    public key: string;

    /**
     * Valeur
     */
    public value: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}