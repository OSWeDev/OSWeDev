import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaRunFunctionCallVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_run_function_call";

    public static STATE_LABELS: string[] = [
        "OseliaRunFunctionCallVO.STATE_TODO",
        "OseliaRunFunctionCallVO.STATE_RUNNING",
        "OseliaRunFunctionCallVO.STATE_DONE",
        "OseliaRunFunctionCallVO.STATE_ERROR",
    ];
    public static STATE_TODO: number = 0;
    public static STATE_RUNNING: number = 1;
    public static STATE_DONE: number = 2;
    public static STATE_ERROR: number = 3;

    public id: number;
    public _type: string = OseliaRunFunctionCallVO.API_TYPE_ID;

    /**
     * Le thread associé à ce run. Si null, on le crée, et on peut le créer avec un titre
     */
    public thread_id: number;

    /**
     * Si c'est une run GPT, on a l'id du run
     */
    public gpt_run_id: number;

    /**
     * Si c'est une oselia run, on a l'id du run
     */
    public oselia_run_id: number;

    /**
     * Si c'est une fonction GPT, on a l'id de la fonction
     */
    public gpt_function_id: number;

    /**
     * Si c'est une external API, on a l'id de l'external API
     */
    public external_api_id: number;

    /**
     * Les paramètres de la fonction - tels que demandés par l'assistant
     */
    public function_call_parameters_initial: { [param_name: string]: any };

    /**
     * Les paramètres de la fonction - une fois les transcriptions potentielles faites
     */
    public function_call_parameters_transcripted: { [param_name: string]: any };

    /**
     * Le résultat de la fonction
     */
    public result: any;

    /**
     * Utilisateur qui initie la demande, si null, c'est le système
     */
    public user_id: number;

    /**
     * Date de création de la demande
     */
    public creation_date: number;

    /**
     * Date de début de la fonction
     */
    public start_date: number;

    /**
     * Date de fin de la fonction
     */
    public end_date: number;

    /**
     * Statut du run
     */
    public state: number;

    public error_msg: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}