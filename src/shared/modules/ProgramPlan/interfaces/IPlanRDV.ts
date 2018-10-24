import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanRDV extends IDistantVOBase {
    start_time: string;
    end_time: string;
    program_id: number;
    state: number;
    target_id: number;
    facilitator_id: number;
}