import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

/**
 * Surcharge du OseliaPromptVO pour les utilisateurs, dans le cas où un utilisateur a besoin d'un prompt spécifique/adapté
 */
export default class OseliaUserPromptVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_user_prompt";

    public id: number;
    public _type: string = OseliaUserPromptVO.API_TYPE_ID;

    public user_id: number;
    public prompt_id: number;

    /**
     * Le prompt surchargé, qui contient les placeholders pour les paramètres
     */
    public adapted_prompt: string;

    /**
     * La description de la spécialisation (qui explique pourquoi on n'a pas gardé le prompt par défaut, et ce qu'on a adapté)
     */
    public why_and_what_we_adapted_description: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}