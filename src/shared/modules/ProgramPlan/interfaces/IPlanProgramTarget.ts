import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanProgramTarget extends IDistantVOBase {
    target_id: number;
    program_id: number;
    state: number;
}