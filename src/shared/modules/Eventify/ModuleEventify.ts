import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TimeSegment from '../DataRender/vos/TimeSegment';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
import EventifyEventConfVO from './vos/EventifyEventConfVO';
import EventifyEventInstanceVO from './vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from './vos/EventifyEventListenerConfVO';
import EventifyEventListenerInstanceVO from './vos/EventifyEventListenerInstanceVO';
import EventifyPerfReportVO from './vos/perfs/EventifyPerfReportVO';
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
        this.initialize_EventifyEventConfVO();
        this.initialize_EventifyEventListenerConfVO();

        this.initialize_EventifyEventInstanceVO();
        this.initialize_EventifyEventListenerInstanceVO();

        this.initialize_EventifyPerfReportVO();
    }

    public initialize_EventifyEventInstanceVO() {
        ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Template d\'évènement', false)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la conf d\'évènement', true).index();
        const label = ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().instance_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom unique de l\'évènement', true).unique();
        ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().emission_date_ms, ModuleTableFieldVO.FIELD_TYPE_float, 'Date d\'émission de l\'évènement (en ms)', true);
        ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().param, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Paramètre de l\'évènement', false);

        ModuleTableController.create_new(this.name, EventifyEventInstanceVO, label, 'Eventify - Event Instance');
    }

    public initialize_EventifyEventConfVO() {
        const label = ModuleTableFieldController.create_new(EventifyEventConfVO.API_TYPE_ID, field_names<EventifyEventConfVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom unique de l\'évènement', true).unique();

        ModuleTableController.create_new(this.name, EventifyEventConfVO, label, 'Eventify - Event Template');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[EventifyEventConfVO.API_TYPE_ID]);
    }

    public initialize_EventifyEventListenerInstanceVO() {
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().listener_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Template de listener', false)
            .set_many_to_one_target_moduletable_name(EventifyEventListenerConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la conf du listener', true);
        const label = ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().instance_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom unique du listener', true).unique();
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Template d\'évènement écouté', true)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().event_conf_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'évènement écouté', true);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cooldown_ms, ModuleTableFieldVO.FIELD_TYPE_int, 'Cooldown en ms', true, true, 0);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().remaining_calls, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb max d\'appels restants', true, true, 0);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().unlimited_calls, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Appels illimités', true, true, true);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().debounce_leading, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debounce leading call', true, true, true);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttled, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttled', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttle_first_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle first call', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttle_last_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle last call', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttle_triggered_event_during_cb, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle triggered event during cb', true, true, false);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().param_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de paramètre', true, true, EventifyEventListenerConfVO.PARAM_TYPE_NONE).setEnumValues(EventifyEventListenerConfVO.PARAM_TYPE_LABELS);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module du callback', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction du callback', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_is_running, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Callback en cours', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_is_cooling_down, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Callback cooling down', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().last_cb_run_start_date_ms, ModuleTableFieldVO.FIELD_TYPE_float, 'Date de début du dernier callback (ms)', true, true, 0);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().last_cb_run_end_date_ms, ModuleTableFieldVO.FIELD_TYPE_float, 'Date de fin du dernier callback (ms)', true, true, 0);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().current_params_stack, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Arguments du callback actuel - stack', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().current_params_map, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Arguments du callback actuel - map', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().next_params_stack, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Arguments du prochain callback - stack', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().next_params_map, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Arguments du prochain callback - map', false);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().run_as_soon_as_possible_event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Event qui déclenche le run as soon as possible', false)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().run_as_soon_as_possible_event_conf_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'event qui déclenche le run as soon as possible', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().run_as_soon_as_possible, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Run as soon as possible', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().is_bgthread, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Is bgthread', true, true, false);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cooling_down_timeout, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Timeout de cooldown', false);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().oselia_run_template_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du template oselia_run', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().oselia_run_param_cache_key, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé de cache du param oselia_run', true, true, "PARAM");
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().oselia_run_link_to_event, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lier l\'oselia_run à l\'event', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().oselia_run_link_to_listener, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lier l\'oselia_run au listener', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().oselia_run_linked_to_param, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lier l\'oselia_run au param - si possible', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().oselia_run_linked_to_param_field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Champ du param lié à l\'oselia_run', false);

        ModuleTableController.create_new(this.name, EventifyEventListenerInstanceVO, label, 'Eventify - Event Listener Instance');
    }


    public initialize_EventifyEventListenerConfVO() {
        const label = ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du listener', true).unique();
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Template d\'évènement écouté', true)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().event_conf_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'évènement écouté', true);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().cooldown_ms, ModuleTableFieldVO.FIELD_TYPE_int, 'Cooldown en ms', true, true, 0);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().max_calls, ModuleTableFieldVO.FIELD_TYPE_int, 'Nb max d\'appels', true, true, 0);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().throttled, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttled', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().debounce_leading, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Debounce leading call', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().throttle_first_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle first call', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().throttle_last_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle last call', true, true, true);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().param_type, ModuleTableFieldVO.FIELD_TYPE_enum, 'Type de paramètre', true, true, EventifyEventListenerConfVO.PARAM_TYPE_NONE).setEnumValues(EventifyEventListenerConfVO.PARAM_TYPE_LABELS);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().cb_module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module du callback', true);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().cb_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction du callback', true);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().run_as_soon_as_possible_event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Event qui déclenche le run as soon as possible', false)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().run_as_soon_as_possible_event_conf_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de l\'event qui déclenche le run as soon as possible', false);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().is_bgthread, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Is bgthread', true, true, false);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().oselia_run_template_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du template oselia_run', false);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().oselia_run_param_cache_key, ModuleTableFieldVO.FIELD_TYPE_string, 'Clé de cache du param oselia_run', true, true, "PARAM");
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().oselia_run_link_to_event, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lier l\'oselia_run à l\'event', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().oselia_run_link_to_listener, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lier l\'oselia_run au listener', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().oselia_run_linked_to_param, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Lier l\'oselia_run au param - si possible', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().oselia_run_linked_to_param_field_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Champ du param lié à l\'oselia_run', false);

        ModuleTableController.create_new(this.name, EventifyEventListenerConfVO, label, 'Eventify - Event Listener Template');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[EventifyEventListenerConfVO.API_TYPE_ID]);
    }

    private initialize_EventifyPerfReportVO() {
        const label = ModuleTableFieldController.create_new(EventifyPerfReportVO.API_TYPE_ID, field_names<EventifyPerfReportVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom du rapport', true).unique();
        ModuleTableFieldController.create_new(EventifyPerfReportVO.API_TYPE_ID, field_names<EventifyPerfReportVO>().start_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de début du rapport', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(EventifyPerfReportVO.API_TYPE_ID, field_names<EventifyPerfReportVO>().end_date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date de fin du rapport', true).set_segmentation_type(TimeSegment.TYPE_SECOND);
        ModuleTableFieldController.create_new(EventifyPerfReportVO.API_TYPE_ID, field_names<EventifyPerfReportVO>().start_date_perf_ms, ModuleTableFieldVO.FIELD_TYPE_float, 'Date de début du rapport (en ms)', true);
        ModuleTableFieldController.create_new(EventifyPerfReportVO.API_TYPE_ID, field_names<EventifyPerfReportVO>().end_date_perf_ms, ModuleTableFieldVO.FIELD_TYPE_float, 'Date de fin du rapport (en ms)', true);
        ModuleTableFieldController.create_new(EventifyPerfReportVO.API_TYPE_ID, field_names<EventifyPerfReportVO>().perf_datas, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Relevés de perf', false);
        ModuleTableController.create_new(this.name, EventifyPerfReportVO, label, 'Eventify - Perf Report');
    }
}