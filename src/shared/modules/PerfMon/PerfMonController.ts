import PerfMonData from './vos/PerfMonData';
import moment = require('moment');
import PerfMonFuncStat from './vos/PerfMonFuncStat';
import * as debounce from 'lodash/debounce';

export default class PerfMonController {

    public static PERFMON_RUN: boolean = true;

    public static getInstance(): PerfMonController {
        if (!PerfMonController.instance) {
            PerfMonController.instance = new PerfMonController();
        }
        return PerfMonController.instance;
    }

    private static PERFMON_UID: number = 0;

    private static instance: PerfMonController = null;

    public perfMonDataByFunctionUID: { [function_uid: string]: PerfMonData[] } = {};
    public perfMonDataByUID: { [uid: string]: PerfMonData } = {};
    public perfMonFuncStatByFunctionUID: { [function_uid: string]: PerfMonFuncStat } = {};
    public setPerfMonFuncStats: (perfMonFuncStat: PerfMonFuncStat[]) => void = null;

    private toUpdate_perfMonFuncStats: PerfMonFuncStat[] = [];

    private constructor() { }

    public async initialize() {
    }

    /**
     * Returns the UID of this tracker
     */
    public startPerfMon(function_uid: string): string {

        if (!PerfMonController.PERFMON_RUN) {
            return null;
        }

        let UID: string = PerfMonController.PERFMON_UID++ + "##" + function_uid;
        let perfMonData: PerfMonData = new PerfMonData();
        perfMonData.function_uid = function_uid;
        perfMonData.UID = UID;
        perfMonData.start_time = moment();

        this.perfMonDataByUID[UID] = perfMonData;

        if (!this.perfMonDataByFunctionUID[function_uid]) {
            this.perfMonDataByFunctionUID[function_uid] = [];
        }
        this.perfMonDataByFunctionUID[function_uid].push(perfMonData);

        return UID;
    }


    public endPerfMon(perfMon_UID: string) {

        if ((!PerfMonController.PERFMON_RUN) || (!perfMon_UID)) {
            return null;
        }

        let perfMonData: PerfMonData = this.perfMonDataByUID[perfMon_UID];
        perfMonData.end_time = moment();
        perfMonData.duration = moment.duration(perfMonData.end_time.diff(perfMonData.start_time));

        if (!this.perfMonFuncStatByFunctionUID[perfMonData.function_uid]) {
            this.perfMonFuncStatByFunctionUID[perfMonData.function_uid] = new PerfMonFuncStat();
            this.perfMonFuncStatByFunctionUID[perfMonData.function_uid].function_uid = perfMonData.function_uid;
        }

        let perfMonFuncStat: PerfMonFuncStat = this.perfMonFuncStatByFunctionUID[perfMonData.function_uid];
        if ((!perfMonFuncStat.min_duration) || (perfMonFuncStat.min_duration.asMilliseconds() > perfMonData.duration.asMilliseconds())) {
            perfMonFuncStat.min_duration = perfMonData.duration;
        }

        if ((!perfMonFuncStat.max_duration) || (perfMonFuncStat.max_duration.asMilliseconds() < perfMonData.duration.asMilliseconds())) {
            perfMonFuncStat.max_duration = perfMonData.duration;
        }

        perfMonFuncStat.nb_calls++;
        if (!perfMonFuncStat.total_duration) {
            perfMonFuncStat.total_duration = perfMonData.duration;
        } else {
            perfMonFuncStat.total_duration.add(perfMonData.duration);
        }

        if (!perfMonFuncStat.mean_duration) {
            perfMonFuncStat.mean_duration = perfMonData.duration;
        } else {
            perfMonFuncStat.mean_duration = moment.duration(
                (perfMonFuncStat.mean_duration.asMilliseconds() * (perfMonFuncStat.nb_calls - 1) + perfMonData.duration.asMilliseconds()) /
                perfMonFuncStat.nb_calls, 'milliseconds');
        }

        if (!!this.setPerfMonFuncStats) {
            this.toUpdate_perfMonFuncStats.push(perfMonFuncStat);
            this.debounced_setPerfMonFuncStat();
        }
    }

    get debounced_setPerfMonFuncStat() {

        let self = this;
        return debounce(async () => {

            if (!!self.setPerfMonFuncStats) {

                self.setPerfMonFuncStats(self.toUpdate_perfMonFuncStats);
            }
        }, 500);
    }

    public getLastPerfMonFuncData(function_uid: string): PerfMonData {
        return ((!!this.perfMonDataByFunctionUID[function_uid]) && (this.perfMonDataByFunctionUID[function_uid].length > 0)) ?
            this.perfMonDataByFunctionUID[function_uid][this.perfMonDataByFunctionUID[function_uid].length - 1] : null;
    }
    public getPerfMonFuncStat(function_uid: string): PerfMonFuncStat {
        return this.perfMonFuncStatByFunctionUID[function_uid];
    }
}