import ISupervisedItem from './ISupervisedItem';
import ISupervisedItemURL from './ISupervisedItemURL';

export default interface ISupervisedItemController<T extends ISupervisedItem> {

    get_urls(supervised_item: T): ISupervisedItemURL[];
    get_description(supervised_item: T): string;
    get_description_html(supervised_item: T): string;
    is_actif(): boolean;
    get_execute_time_ms(): number;
    work_all(): Promise<boolean>;
    work_one(item: T, ...args): Promise<boolean>;
    work_invalid(): Promise<boolean>;
}