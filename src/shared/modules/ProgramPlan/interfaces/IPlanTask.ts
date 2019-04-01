import IDistantVOBase from '../../IDistantVOBase';
import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default interface IPlanTask extends IDistantVOBase, INamedVO, IWeightedItem {

    task_type_id?: number;

    /**
     * Le nombre max de RDVs liés à cette tache sur une target
     */
    limit_on_same_target: number;
}