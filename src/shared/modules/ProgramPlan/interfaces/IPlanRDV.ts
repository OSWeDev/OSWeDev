import IDistantVOBase from '../../IDistantVOBase';
import { Moment } from 'moment';

export default interface IPlanRDV extends IDistantVOBase {
    start_time: Moment;
    end_time: Moment;
    task_id?: number;
    program_id?: number;
    state: number;
    target_id: number;
    facilitator_id: number;
    target_validation: boolean;
}