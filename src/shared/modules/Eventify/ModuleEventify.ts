import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import ModuleTableController from '../DAO/ModuleTableController';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import Module from '../Module';
import VersionedVOController from '../Versioned/VersionedVOController';
import EventifyEventConfVO from './vos/EventifyEventConfVO';
import EventifyEventInstanceVO from './vos/EventifyEventInstanceVO';
import EventifyEventListenerConfVO from './vos/EventifyEventListenerConfVO';
import EventifyEventListenerInstanceVO from './vos/EventifyEventListenerInstanceVO';
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
    }

    public initialize_EventifyEventInstanceVO() {
        ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Template d\'évènement', false)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().name, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom de la conf d\'évènement', true).index();
        const label = ModuleTableFieldController.create_new(EventifyEventInstanceVO.API_TYPE_ID, field_names<EventifyEventInstanceVO>().instance_uid, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom unique de l\'évènement', true).unique();

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

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttled, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttled', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttle_first_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle first call', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttle_last_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle last call', true, true, true);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().throttle_triggered_event_during_cb, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle triggered event during cb', true, true, false);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module du callback', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction du callback', false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_is_running, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Callback en cours', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cb_is_cooling_down, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Callback cooling down', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().last_cb_run_end_date_ms, ModuleTableFieldVO.FIELD_TYPE_int, 'Date de fin du dernier callback (ms)', true, true, 0);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().run_as_soon_as_possible_event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Event qui déclenche le run as soon as possible', false)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().run_as_soon_as_possible, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Run as soon as possible', true, true, false);
        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().is_bgthread, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Is bgthread', true, true, false);

        ModuleTableFieldController.create_new(EventifyEventListenerInstanceVO.API_TYPE_ID, field_names<EventifyEventListenerInstanceVO>().cooling_down_timeout, ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj, 'Timeout de cooldown', false);

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
        // ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().throttle_first_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle first call', true, true, false);
        // ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().throttle_last_call, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Throttle last call', true, true, true);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().cb_module_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Module du callback', true);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().cb_function_name, ModuleTableFieldVO.FIELD_TYPE_string, 'Fonction du callback', true);

        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().run_as_soon_as_possible_event_conf_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Event qui déclenche le run as soon as possible', false)
            .set_many_to_one_target_moduletable_name(EventifyEventConfVO.API_TYPE_ID);
        ModuleTableFieldController.create_new(EventifyEventListenerConfVO.API_TYPE_ID, field_names<EventifyEventListenerConfVO>().is_bgthread, ModuleTableFieldVO.FIELD_TYPE_boolean, 'Is bgthread', true, true, false);

        ModuleTableController.create_new(this.name, EventifyEventListenerConfVO, label, 'Eventify - Event Listener Template');
        VersionedVOController.getInstance().registerModuleTable(ModuleTableController.module_tables_by_vo_type[EventifyEventListenerConfVO.API_TYPE_ID]);
    }
}