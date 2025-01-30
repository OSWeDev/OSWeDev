import { isMainThread, threadId } from 'worker_threads';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import EnvParamsVO from '../../../shared/modules/EnvParam/vos/EnvParamsVO';
import EventsController from '../../../shared/modules/Eventify/EventsController';
import ModuleEventify from '../../../shared/modules/Eventify/ModuleEventify';
import EventifyPerfReportVO from '../../../shared/modules/Eventify/vos/perfs/EventifyPerfReportVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import ModuleServerBase from '../ModuleServerBase';
import ModuleTriggerServer from '../Trigger/ModuleTriggerServer';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import EventifyEventListenerInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import ModuleEnvParamServer from '../EnvParam/ModuleEnvParamServer';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import EventifyEventInstanceVO from '../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import ConfigurationService from '../../env/ConfigurationService';

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

        // On s'intéresse à l'activation du perf report
        const create_event_perf_report_listener = EventifyEventListenerInstanceVO.new_listener(
            ModuleEnvParamServer.UPDATE_ENVPARAM_EVENT_BASE_NAME + reflect<EnvParamsVO>().create_event_perf_report,
            this.on_update_create_event_perf_report.bind(this)
        );
        EventsController.register_event_listener(create_event_perf_report_listener);
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
    }

    private async on_update_create_event_perf_report(event: EventifyEventInstanceVO) {

        if (!!event.param) {
            // on a activé le perf report, on crée un rapport dans le controller
            const report = new EventifyPerfReportVO();
            report.start_date = Dates.now();
            report.start_date_perf_ms = Dates.now_ms();
            report.name = Dates.format_segment(report.start_date, TimeSegment.TYPE_SECOND) + ' - ' + (isMainThread ? 'main' : ('thread ' + threadId));
            report.perf_datas = {};
            EventsController.current_perf_report = report;
        } else {
            // on désactive le perf report, on doit le retirer du controller, et on le stocke en base
            const perf_report = EventsController.current_perf_report;
            EventsController.current_perf_report = null;
            perf_report.end_date = Dates.now();
            perf_report.end_date_perf_ms = Dates.now_ms();
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(perf_report);
        }
    }
}