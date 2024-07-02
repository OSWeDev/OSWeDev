import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaPromptVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_prompt";

    public id: number;
    public _type: string = OseliaPromptVO.API_TYPE_ID;

    /**
     * Le nom (UNIQUE) du prompt
     */
    public name: string;

    /**
     * Le prompt principal, qui contient les placeholders pour les paramètres
     */
    public prompt: string;

    /**
     * La description du prompt - l'objectif de ce prompt
     */
    public prompt_description: string;

    /**
     * La description des paramètres du prompt, leur origine, format, but
     */
    public prompt_parameters_description: { [param_name: string]: string };

    /**
     * Le lien vers l'assistant qui doit répondre à ce prompt par défaut
     */
    public default_assistant_id: number;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}