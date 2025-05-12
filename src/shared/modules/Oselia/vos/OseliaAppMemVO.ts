import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaAppMemVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_app_mem";

    public id: number;
    public _type: string = OseliaAppMemVO.API_TYPE_ID;

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