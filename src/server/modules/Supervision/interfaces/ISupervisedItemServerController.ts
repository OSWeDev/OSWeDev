import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';

export default interface ISupervisedItemServerController<T extends ISupervisedItem> {

    api_type_id: string;
    get_execute_time_ms(): number;
    work_all(): Promise<boolean>;
    work_one(item: T, ...args): Promise<boolean>;
    work_invalid(): Promise<boolean>;
}