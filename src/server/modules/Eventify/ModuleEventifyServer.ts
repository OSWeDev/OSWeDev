import EnvParamsVO from '../../../shared/modules/EnvParam/vos/EnvParamsVO';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import ModuleEventify from '../../../shared/modules/Eventify/ModuleEventify';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import { reflect } from '../../../shared/tools/ObjectHandler';
import ConfigurationService from '../../env/ConfigurationService';
import ModuleEnvParamServer from '../EnvParam/ModuleEnvParamServer';
import ModuleServerBase from '../ModuleServerBase';
import PerfReportServerController from '../PerfReport/PerfReportServerController';

export default class ModuleEventifyServer extends ModuleServerBase {

    private static instance: ModuleEventifyServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleEventify.getInstance().name);
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleEventifyServer.instance) {
            ModuleEventifyServer.instance = new ModuleEventifyServer();
        }
        return ModuleEventifyServer.instance;
    }

    // istanbul ignore next: cannot test registerAccessPolicies
    public async registerAccessPolicies(): Promise<void> { }

    // istanbul ignore next: cannot test configure
    public async configure() {

        PerfReportServerController.register_perf_module(this.name);

        EventsController.debug_slow_event_listeners = ConfigurationService.node_configuration.debug_slow_event_listeners;
        EventsController.debug_slow_event_listeners_ms_limit = ConfigurationService.node_configuration.debug_slow_event_listeners_ms_limit;
        // On s'intéresse à la modif des params de debug slow event listeners
        const debug_slow_event_listeners_listener = EventifyEventListenerInstanceVO.new_listener(
            ModuleEnvParamServer.UPDATE_ENVPARAM_EVENT_BASE_NAME + reflect<EnvParamsVO>().debug_slow_event_listeners,
            (event: EventifyEventInstanceVO) => {
                EventsController.debug_slow_event_listeners = event.param as boolean;
            }
        );
        EventsController.register_event_listener(debug_slow_event_listeners_listener);

        const debug_slow_event_listeners_ms_limit_listener = EventifyEventListenerInstanceVO.new_listener(
            ModuleEnvParamServer.UPDATE_ENVPARAM_EVENT_BASE_NAME + reflect<EnvParamsVO>().debug_slow_event_listeners_ms_limit,
            (event: EventifyEventInstanceVO) => {
                EventsController.debug_slow_event_listeners_ms_limit = event.param as number;
            }
        );
        EventsController.register_event_listener(debug_slow_event_listeners_ms_limit_listener);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }
}