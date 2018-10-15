import IDistantVOBase from '../../IDistantVOBase';

export default interface IPlanProgramCategory extends IDistantVOBase {
    name: string;
    weight: number;
    description: string;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    nb_targets: number;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    total_days: number;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    start_date: string;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    end_date: string;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    nb_closed_targets: number;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    nb_ongoing_targets: number;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    nb_created_targets: number;

    /**
     * Automatically calculated by triggers from the programs of this category
     */
    nb_late_targets: number;
}