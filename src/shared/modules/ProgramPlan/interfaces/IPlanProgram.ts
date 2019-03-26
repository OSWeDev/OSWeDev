import IDistantVOBase from '../../IDistantVOBase';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default interface IPlanProgram extends IDistantVOBase, IWeightedItem {
    name: string;
    start_date: string;
    end_date: string;

    description: string;

    category_id?: number;
    weight: number;

    days_by_target: number;

    /**
     * Automatically calculated by triggers from the count(*) of program targets
     */
    nb_targets: number;

    /**
     * Automatically calculated by triggers from the program targets
     */
    nb_created_targets: number;

    /**
     * Automatically calculated by triggers from the program targets
     */
    nb_late_targets: number;

    /**
     * Automatically calculated by triggers from the program targets
     */
    nb_ongoing_targets: number;

    /**
     * Automatically calculated by triggers from the program targets
     */
    nb_closed_targets: number;
}