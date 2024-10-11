import AccessPolicyTools from '../../tools/AccessPolicyTools';
import Module from '../Module';
export default class ModuleEventify extends Module {

    public static MODULE_NAME: string = 'Eventify';

    public static POLICY_GROUP: string = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleEventify.MODULE_NAME;
    public static POLICY_BO_ACCESS: string = AccessPolicyTools.POLICY_UID_PREFIX + ModuleEventify.MODULE_NAME + '.BO_ACCESS';

    private static instance: ModuleEventify = null;

    private constructor() {

        super("eventify", ModuleEventify.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleEventify {
        if (!ModuleEventify.instance) {
            ModuleEventify.instance = new ModuleEventify();
        }
        return ModuleEventify.instance;
    }

    public initialize() {
        // this.initializexxx();
    }

    // public initializeOseliaRunTemplateVO() {
    //     const label = ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().template_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du template', true);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'étape', true);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true)
    //         .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().thread_title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre du thread - si création', false);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().hide_prompt, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer le prompt', true, true, false);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().hide_outputs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer les messages Osélia', true, true, false);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().initial_content_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().initial_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', false)
    //         .set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);

    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().file_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Fichiers', false)
    //         .set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().use_splitter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Découper la tâche', true, true, false);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().use_validator, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Utiliser le validateur', true, true, false);

    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, OseliaRunVO.STATE_TODO).setEnumValues(OseliaRunVO.STATE_LABELS);

    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().childrens_are_multithreaded, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Les enfants sont multithreadés', true, true, false);

    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().parent_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Run parent', false)
    //         .set_many_to_one_target_moduletable_name(OseliaRunTemplateVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

    //     ModuleTableController.create_new(this.name, OseliaRunTemplateVO, label, 'Oselia - Run Template');
    //     VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[OseliaRunTemplateVO.API_TYPE_ID]);
    // }

    // public initializeOseliaRunVO() {

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'étape', true);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().assistant_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Assistant', true)
    //         .set_many_to_one_target_moduletable_name(GPTAssistantAPIAssistantVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().referrer_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Partenaire', false)
    //         .set_many_to_one_target_moduletable_name(OseliaReferrerVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Thread', false)
    //         .set_many_to_one_target_moduletable_name(GPTAssistantAPIThreadVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_title, ModuleTableFieldVO.FIELD_TYPE_string, 'Titre du thread - si création', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().hide_prompt, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer le prompt', true, true, false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().hide_outputs, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Masquer les messages Osélia', true, true, false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initial_content_text, ModuleTableFieldVO.FIELD_TYPE_string, 'Contenu', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initial_prompt_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Prompt', false)
    //         .set_many_to_one_target_moduletable_name(OseliaPromptVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initial_prompt_parameters, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Paramètres du prompt', false);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initialised_run_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt initialisé - run', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initialised_splitter_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt initialisé - splitter', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().initialised_validator_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Prompt initialisé - validateur', false);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Utilisateur', false)
    //         .set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().file_id_ranges, ModuleTableFieldVO.FIELD_TYPE_refrange_array, 'Fichiers', false)
    //         .set_many_to_one_target_moduletable_name(FileVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().use_splitter, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Découper la tâche', true, true, false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().use_validator, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Utiliser le validateur', true, true, false);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début du découpage', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin du découpage', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().waiting_split_end_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début d\'attente des runs enfants', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().waiting_split_end_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin d\'attente des runs enfants', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début du run', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin du run', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début de validation', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin de validation', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_ask_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de demande de rerun', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().state, ModuleTableFieldVO.FIELD_TYPE_enum, 'Etat', true, true, OseliaRunVO.STATE_TODO).setEnumValues(OseliaRunVO.STATE_LABELS);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().childrens_are_multithreaded, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Les enfants sont multithreadés', true, true, false);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().split_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run - SPLIT', false)
    //         .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().run_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run - RUN', false)
    //         .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().validation_gpt_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'GPT Run - VALIDATION', false)
    //         .set_many_to_one_target_moduletable_name(GPTAssistantAPIRunVO.API_TYPE_ID);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().parent_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Run parent', false)
    //         .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0);

    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().error_msg, ModuleTableFieldVO.FIELD_TYPE_string, 'Message d\'erreur', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du rerun', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_reason, ModuleTableFieldVO.FIELD_TYPE_string, 'Raison du rerun', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_new_initial_prompt, ModuleTableFieldVO.FIELD_TYPE_string, 'Nouveau prompt initial pour rerun', false);
    //     ModuleTableFieldController.create_new(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().rerun_of_run_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Rerun de', false)
    //         .set_many_to_one_target_moduletable_name(OseliaRunVO.API_TYPE_ID);

    //     ModuleTableController.create_new(this.name, OseliaRunVO, null, 'Oselia - Run');
    //     VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[OseliaRunVO.API_TYPE_ID]);
    // }

}