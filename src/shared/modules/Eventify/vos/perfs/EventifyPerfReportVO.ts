import IDistantVOBase from "../../../IDistantVOBase";

export default class EventifyPerfReportVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "eventify_perf_report";

    public id: number;
    public _type: string = EventifyPerfReportVO.API_TYPE_ID;

    /**
     * Nom unique du rapport, permettant de s'y référer
     */
    public name: string;

    /**
     * Date de début du rapport
     */
    public start_date: number;

    /**
     * La version issue des perfs, en ms
     */
    public start_date_perf_ms: number;

    /**
     * Date de création du rapport (donc de fin du perf log)
     */
    public end_date: number;

    /**
     * La version issue des perfs, en ms
     */
    public end_date_perf_ms: number;

    /**
     * Les relevés de perf
     * au format :
     * {
     *     [event_listner_name : string]: {
     *          "event_name": string,
     *          "listener_name": string,
     *          "calls": [{
     *              "start": number, // perf time ms
     *              "end": number, // perf time ms
     *          }],
     *          "cooldowns": [{
     *             "start": number, // perf time ms
     *              "end": number, // perf time ms
     *          }],
     *          "events": number[], // perf time ms of each emitted events since creation of this listener
     *     }
     * }
     */
    public perf_datas: {
        [event_listner_name: string]: {
            "event_name": string,
            "listener_name": string,
            "description"?: string,
            "calls": Array<{
                "start": number, // perf time ms
                "end": number, // perf time ms
            }>,
            "cooldowns": Array<{
                "start": number, // perf time ms
                "end": number, // perf time ms
            }>,
            "events": number[], // perf time ms of each emitted events since creation of this listener
        }
    };
}