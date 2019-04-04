import IDistantVOBase from '../../IDistantVOBase';
import INamedVO from '../../../interfaces/INamedVO';

export default interface IPlanTargetRegion extends IDistantVOBase, INamedVO {
    name: string;

    region_director_uid: number;
}