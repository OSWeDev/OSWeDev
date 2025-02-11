import { isMainThread, threadId } from "worker_threads";
import TimeSegment from "../../../shared/modules/DataRender/vos/TimeSegment";
import EnvParamsVO from "../../../shared/modules/EnvParam/vos/EnvParamsVO";
import EventsController from "../../../shared/modules/Eventify/EventsController";
import EventifyEventInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import EventifyPerfReportVO from "../../../shared/modules/Eventify/vos/perfs/EventifyPerfReportVO";
import Dates from "../../../shared/modules/FormatDatesNombres/Dates/Dates";
import PerfReportController from "../../../shared/modules/PerfReport/PerfReportController";
import { reflect } from "../../../shared/tools/ObjectHandler";
import ConfigurationService from "../../env/ConfigurationService";
import ModuleDAOServer from "../DAO/ModuleDAOServer";
import ModuleEnvParamServer from "../EnvParam/ModuleEnvParamServer";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";

export default class PerfReportServerController {

    // istanbul ignore next: cannot test configure
    public static async configure() {
        // On s'intéresse à l'activation du perf report
        const create_event_perf_report_listener = EventifyEventListenerInstanceVO.new_listener(
            ModuleEnvParamServer.UPDATE_ENVPARAM_EVENT_BASE_NAME + reflect<EnvParamsVO>().create_event_perf_report,
            this.on_update_create_event_perf_report.bind(this)
        );
        EventsController.register_event_listener(create_event_perf_report_listener);
    }

    /**
     * Permet de synchroniser le param env et la conf du eventscontroller
     * @param perf_module_name la convention veut que le static_env qui param ce module s'appelle activate_module_perf_[perf_module_name]
     */
    public static register_perf_module(perf_module_name: string): void {
        const env_param_name: string = 'activate_module_perf_' + perf_module_name;
        PerfReportController.activated_perf_modules_by_name[perf_module_name] = ConfigurationService.node_configuration[env_param_name];

        const listener = EventifyEventListenerInstanceVO.new_listener(
            ModuleEnvParamServer.UPDATE_ENVPARAM_EVENT_BASE_NAME + env_param_name,
            (event: EventifyEventInstanceVO) => {
                PerfReportController.activated_perf_modules_by_name[perf_module_name] = !!event.param;
            }
        );
        EventsController.register_event_listener(listener);
    }

    private static async on_update_create_event_perf_report(event: EventifyEventInstanceVO) {

        if (!!event.param) {
            // on a activé le perf report, on crée un rapport dans le controller
            const report = new EventifyPerfReportVO();
            report.start_date = Dates.now();
            report.start_date_perf_ms = Dates.now_ms();
            report.name = Dates.format_segment(report.start_date, TimeSegment.TYPE_SECOND) + ' - ' + (isMainThread ? 'main' : ('thread ' + threadId));
            report.perf_datas = {};
            PerfReportController.current_perf_report = report;
        } else {
            // on désactive le perf report, on doit le retirer du controller, et on le stocke en base
            const perf_report = PerfReportController.current_perf_report;
            PerfReportController.current_perf_report = null;

            // Si le perf report est vide, on ne le stocke pas
            if (!perf_report || !perf_report.perf_datas || !Object.keys(perf_report.perf_datas).length) {
                ConsoleHandler.log('PerfReportServerController: perf report is empty, not storing it');
                return;
            }

            perf_report.end_date = Dates.now();
            perf_report.end_date_perf_ms = Dates.now_ms();
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(perf_report);
        }
    }
}