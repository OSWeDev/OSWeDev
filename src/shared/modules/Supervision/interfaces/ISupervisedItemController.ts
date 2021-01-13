import ISupervisedItem from './ISupervisedItem';
import ISupervisedItemURL from './ISupervisedItemURL';

export default interface ISupervisedItemController<T extends ISupervisedItem> {

    already_work: boolean;

    get_urls(supervised_item: T): ISupervisedItemURL[];
    get_description(supervised_item: T): string;
    get_description_html(supervised_item: T): string;
    is_actif(): boolean;
}