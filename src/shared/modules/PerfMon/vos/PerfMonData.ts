import { Moment, Duration } from 'moment';

export default class PerfMonData {
    public start_time: Moment = null;
    public end_time: Moment = null;
    public duration: Duration = null;
    public UID: string = null;
    public function_uid: string = null;
}