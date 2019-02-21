import { Component } from 'vue-property-decorator';
import 'vue-tables-2';
import PerfMonController from '../../../../../../shared/modules/PerfMon/PerfMonController';
import PerfMonFuncStat from '../../../../../../shared/modules/PerfMon/vos/PerfMonFuncStat';
import VueComponentBase from '../../../VueComponentBase';
import { ModulePerfMonAction, ModulePerfMonGetter } from '../../store/PerfMonStore';
import './FuncStatsComponent.scss';
import moment = require('moment');

@Component({
    template: require('./FuncStatsComponent.pug')
})
export default class FuncStatsComponent extends VueComponentBase {

    @ModulePerfMonGetter
    public getPerfMonFuncStats: PerfMonFuncStat[];
    @ModulePerfMonAction
    public setPerfMonFuncStats: (perfMonFuncStats: PerfMonFuncStat[]) => void;

    public mounted() {
        PerfMonController.PERFMON_RUN = true;
        PerfMonController.getInstance().setPerfMonFuncStatsStoreFunc(this.setPerfMonFuncStats);
    }

    public destroyed() {
        PerfMonController.PERFMON_RUN = false;
        PerfMonController.getInstance().setPerfMonFuncStatsStoreFunc(null);
    }

    get datatable_datas(): any[] {
        let res: any[] = [];

        for (let i in this.getPerfMonFuncStats) {

            let getPerfMonFuncStat = {
                min_duration: 0,
                mean_duration: 0,
                max_duration: 0,
                total_duration: 0,
                function_uid: "",
                nb_calls: 0
            };
            getPerfMonFuncStat.min_duration = this.getPerfMonFuncStats[i].min_duration ? this.getPerfMonFuncStats[i].min_duration.asMilliseconds() : null;
            getPerfMonFuncStat.max_duration = this.getPerfMonFuncStats[i].max_duration ? this.getPerfMonFuncStats[i].max_duration.asMilliseconds() : null;
            getPerfMonFuncStat.mean_duration = this.getPerfMonFuncStats[i].mean_duration ? this.getPerfMonFuncStats[i].mean_duration.asMilliseconds() : null;
            getPerfMonFuncStat.max_duration = this.getPerfMonFuncStats[i].max_duration ? this.getPerfMonFuncStats[i].max_duration.asMilliseconds() : null;
            getPerfMonFuncStat.total_duration = this.getPerfMonFuncStats[i].total_duration ? this.getPerfMonFuncStats[i].total_duration.asMilliseconds() : null;
            getPerfMonFuncStat.function_uid = this.getPerfMonFuncStats[i].function_uid;
            getPerfMonFuncStat.nb_calls = this.getPerfMonFuncStats[i].nb_calls;
            res.push(getPerfMonFuncStat);
        }
        return res;
    }

    get datatable_columns(): string[] {
        return [
            "function_uid",
            "nb_calls",
            "total_duration",
            "min_duration",
            "mean_duration",
            "max_duration"
        ];
    }

    get datatable_options(): any {

        return {
            filterByColumn: true,
            headings: this.datatable_columns_labels,
            skin: 'table-striped table-hover'
        };
    }

    get datatable_columns_labels(): any {
        return {
            function_uid: "Fonction",
            nb_calls: "#",
            total_duration: "Total",
            min_duration: "Min",
            max_duration: "Max",
            mean_duration: "Moy"
        };
    }
}