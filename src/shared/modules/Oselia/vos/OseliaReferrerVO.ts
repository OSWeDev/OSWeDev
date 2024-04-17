import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

/**
 * Le referrer est le VO qui défini l'interaction entre Osélia et un partenaire externe qui souhaite utiliser un assistant via Osélia
 */
export default class OseliaReferrerVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_referrer";

    public id: number;
    public _type: string = OseliaReferrerVO.API_TYPE_ID;

    /**
     * Le compte de contact / facturation associé au referrer
     */
    public user_id: number;

    public name: string;
    public description: string;

    public referrer_code: string;

    public actif: boolean;

    public activate_trigger_hooks: boolean;
    public triggers_hook_external_api_authentication_id: number;

    public trigger_hook_gpt_assistant_run_create_url: string;
    public trigger_hook_gpt_assistant_run_update_url: string;
    public trigger_hook_gpt_assistant_run_delete_url: string;

    public trigger_hook_gpt_assistant_thread_msg_content_create_url: string;
    public trigger_hook_gpt_assistant_thread_msg_content_update_url: string;
    public trigger_hook_gpt_assistant_thread_msg_content_delete_url: string;

    public trigger_hook_gpt_assistant_thread_message_file_create_url: string;
    public trigger_hook_gpt_assistant_thread_message_file_update_url: string;
    public trigger_hook_gpt_assistant_thread_message_file_delete_url: string;

    public trigger_hook_gpt_assistant_thread_msg_create_url: string;
    public trigger_hook_gpt_assistant_thread_msg_update_url: string;
    public trigger_hook_gpt_assistant_thread_msg_delete_url: string;

    public trigger_hook_gpt_assistant_thread_create_url: string;
    public trigger_hook_gpt_assistant_thread_update_url: string;
    public trigger_hook_gpt_assistant_thread_delete_url: string;

    /**
     * Hook qui prend 2 params : user_id: number interne OSWEDEV, api_key: string API key mise à jour de l'utilisateur
     */
    public trigger_hook_user_api_key_update_url: string;
    /**
     * Hook qui prend 2 params : user_id: number interne OSWEDEV, errors: string[] les erreurs qui ont empêché l'ouverture du DB Osélia
     */
    public trigger_hook_open_oselia_db_reject_url: string;
    /**
     * Hook qui prend 1 param : user_id: number interne OSWEDEV
     */
    public trigger_hook_open_oselia_db_resolve_url: string;

    public new_user_default_lang_id: number;
    public new_user_default_role_id: number;

    public failed_open_oselia_db_target_url: string;

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}