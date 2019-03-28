import IDistantVOBase from '../../IDistantVOBase';
import INamedVO from '../../../interfaces/INamedVO';

export default interface IPlanTask extends IDistantVOBase, INamedVO {

    task_type_id?: number;

    /**
     * Poids par rapport aux autres tâches pour identifier l'ordre dans lequel on doit poser les tâches
     */
    weight: number;

    /**
     * Le nombre max de RDVs liés à cette tache sur une target
     */
    limit_on_same_target: number;
}