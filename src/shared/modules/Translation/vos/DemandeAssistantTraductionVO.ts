import IDistantVOBase from '../../IDistantVOBase';

export default class DemandeAssistantTraductionVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "demande_assistant_traduction";

    public id: number;
    public _type: string = DemandeAssistantTraductionVO.API_TYPE_ID;
    public lang_id: number;
    public text_id: number;
    public oselia_run_id: number;

    public code_text: string;
    public code_lang: string;
    public traduction: string;
    public degre_certitude: number;
    public explication: string;

    public traduction_appliquee: boolean;
}