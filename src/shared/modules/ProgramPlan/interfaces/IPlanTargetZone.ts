import IDistantVOBase from '../../IDistantVOBase';
import INamedVO from '../../../interfaces/INamedVO';

export default interface IPlanTargetZone extends IDistantVOBase, INamedVO {
    name: string;

    region_id?: number;

    zone_manager_uid: number;
}