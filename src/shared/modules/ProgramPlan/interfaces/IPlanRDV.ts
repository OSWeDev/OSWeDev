import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanRDV extends IDistantVOBase {
    start_time: string;
    end_time: string;
    task_id?: number;
    program_id?: number;
    state: number;
    target_id: number;
    facilitator_id: number;
    target_validation: boolean;
}