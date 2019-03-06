import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanTargetContact extends IDistantVOBase {

    target_id: number;
    contact_id: number;
}