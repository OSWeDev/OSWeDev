import IDistantVOBase from '../../IDistantVOBase';
import INamedVO from '../../../interfaces/INamedVO';

export default interface IPlanTaskType extends IDistantVOBase, INamedVO {

    /**
     * Paramètre qui remplace la tache par le type de tache dans la liste des actions positionnables dans le planning
     *  et dans ce cas c'est le système qui calcul la tâche à positionner en fonction des poids des tâches et des limitations
     */
    order_tasks_on_same_target: boolean;
}