import { Duration } from 'moment';

export default class PerfMonFuncStat {
    public function_uid: string;

    public nb_calls: number = 0;
    public min_duration: Duration = null;
    public mean_duration: Duration = null;
    public max_duration: Duration = null;
    public total_duration: Duration = null;
}