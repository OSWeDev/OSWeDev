import { Moment } from 'moment';
import ISupervisedItem from './ISupervisedItem';

export default interface ISupervisor {

    supervised_items_api_type: string;
    observe(supervised_items: ISupervisedItem[]): Promise<boolean>;
}