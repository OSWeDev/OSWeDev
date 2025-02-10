import { isArray } from "lodash";
import EventifyEventInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerInstanceVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import { all_promises } from "../../tools/PromiseTools";
import Dates from "../FormatDatesNombres/Dates/Dates";
import { StatThisMapKeys } from "../Stats/annotations/StatThisMapKeys";
import StatsController from "../Stats/StatsController";
import EventifyPerfReportVO from "../Eventify/vos/perfs/EventifyPerfReportVO";

export default class PerfReportController {

    /**
     * Les modules, qui sont activables individuellement dans les envparams et leur état
     */
    public static activated_perf_modules_by_name: { [perf_module_name: string]: boolean } = {};

    /**
     * Pour la gestion des perf reports
     */
    public static current_perf_report: EventifyPerfReportVO = null; // TODO généraliser et déplacer ce vo dans ce module

    /**
     * Si on est en mode report et que ce module est activé, on ajoute un event pour la perf identifiée
     */
    public static add_event(
        perf_module_name: string,
        perf_name: string,
        perf_line_name: string,
        perf_line_description: string,
        event_ts: number = null,
        event_description: string = null,
    ) {

        // Si on est en mode perf report, on enregistre le rapport de la requete
        if (PerfReportController.current_perf_report && PerfReportController.activated_perf_modules_by_name[perf_module_name]) {
            if (!PerfReportController.current_perf_report.perf_datas[perf_name]) {
                PerfReportController.current_perf_report.perf_datas[perf_name] = {
                    line_name: perf_line_name,
                    description: perf_line_description,
                    calls: [],
                    cooldowns: [],
                    events: [],
                };
            }

            PerfReportController.current_perf_report.perf_datas[perf_name].events.push({
                ts: event_ts ? event_ts : Dates.now_ms(),
                description: event_description,
            });
        }
    }

    /**
     * Si on est en mode report et que ce module est activé, on ajoute un call pour la perf identifiée
     */
    public static add_call(
        perf_module_name: string,
        perf_name: string,
        perf_line_name: string,
        perf_line_description: string,
        call_start_ts: number,
        call_end_ts: number = null,
        call_description: string = null,
    ) {
        // Si on est en mode perf report, on enregistre le rapport de la requete
        if (PerfReportController.current_perf_report && PerfReportController.activated_perf_modules_by_name[perf_module_name]) {
            if (!PerfReportController.current_perf_report.perf_datas[perf_name]) {
                PerfReportController.current_perf_report.perf_datas[perf_name] = {
                    line_name: perf_line_name,
                    description: perf_line_description,
                    calls: [],
                    cooldowns: [],
                    events: [],
                };
            }

            PerfReportController.current_perf_report.perf_datas[perf_name].calls.push({
                start: call_start_ts,
                end: call_end_ts ? call_end_ts : Dates.now_ms(),
                description: call_description,
            });
        }
    }

    /**
     * Si on est en mode report et que ce module est activé, on ajoute un call pour la perf identifiée
     */
    public static add_cooldown(
        perf_module_name: string,
        perf_name: string,
        perf_line_name: string,
        perf_line_description: string,
        cooldown_start_ts: number,
        cooldown_end_ts: number = null,
        cooldown_description: string = null,
    ) {
        // Si on est en mode perf report, on enregistre le rapport de la requete
        if (PerfReportController.current_perf_report && PerfReportController.activated_perf_modules_by_name[perf_module_name]) {
            if (!PerfReportController.current_perf_report.perf_datas[perf_name]) {
                PerfReportController.current_perf_report.perf_datas[perf_name] = {
                    line_name: perf_line_name,
                    description: perf_line_description,
                    calls: [],
                    cooldowns: [],
                    events: [],
                };
            }

            PerfReportController.current_perf_report.perf_datas[perf_name].cooldowns.push({
                start: cooldown_start_ts,
                end: cooldown_end_ts ? cooldown_end_ts : Dates.now_ms(),
                description: cooldown_description,
            });
        }
    }
}