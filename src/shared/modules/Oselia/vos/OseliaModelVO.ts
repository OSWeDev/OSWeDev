import TSRange from '../../DataRender/vos/TSRange';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaModelVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_model";

    public id: number;
    public _type: string = OseliaModelVO.API_TYPE_ID;

    /**
     * Le nom (UNIQUE) du modèle
     */
    public name: string;

    /**
     * La description du modèle
     * Par exemple, sa compatibilité avec Vision, le fait que ce soit le modèle actuel par défaut pour les petites tâches, ...
     */
    public description: string;

    /**
     * Plage de dates de validité de ce modèle (principalement utilisée pour les modèles alias)
     */
    public ts_range: TSRange;

    /**
     * Typiquement les modèles GPT-4 ou GPT-4o qui sont en fait des alias des modèles gpt-4o-2024-08-06 par exemple
     */
    public is_alias: boolean;

    /**
     * Lien vers le modèle original (si c'est un alias) correspondant à cet alias pendant la période de validité
     */
    public alias_model_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}