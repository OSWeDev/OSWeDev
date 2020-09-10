import ISupervisedItem from './ISupervisedItem';
import ISupervisedItemURL from './ISupervisedItemURL';
import ISupervisedItemGraphSegmentation from './ISupervisedItemGraphSegmentation';

export default interface ISupervisedItemClientController<T extends ISupervisedItem> {

    get_urls(supervised_item: T): ISupervisedItemURL[];
    get_description(supervised_item: T): string;
    get_graph_segmentation(supervised_item: T): ISupervisedItemGraphSegmentation[];
    get_graph_filter(supervised_item: T): string;
    get_graph_filter_additional_params(supervised_item: T): any;
    get_graph_options(supervised_item: T): string;
    get_graph_date_format(supervised_item: T): string;
    get_graph_label_translatable_code(supervised_item: T): string;
}