import ISupervisedItem from './ISupervisedItem';
import ISupervisedItemURL from './ISupervisedItemURL';

export default interface ISupervisedItemController<T extends ISupervisedItem> {

    get_urls(supervised_item: T): ISupervisedItemURL[];
    get_description(supervised_item: T): string;
    is_actif(): boolean;
}