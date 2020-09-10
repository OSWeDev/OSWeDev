import ISupervisedItem from './ISupervisedItem';
import ISupervisedItemURL from './ISupervisedItemURL';
import ISupervisedItemGraphSegmentation from './ISupervisedItemGraphSegmentation';

export default interface ISupervisorClientController {

    get_urls(supervised_item: ISupervisedItem): Promise<ISupervisedItemURL[]>;
    get_description(supervised_item: ISupervisedItem): Promise<string>;
    get_hist_graph_segmentations(supervised_item: ISupervisedItem): Promise<ISupervisedItemGraphSegmentation[]>;
}