import { Moment } from 'moment';
import INamedVO from '../../../interfaces/INamedVO';
import IDistantVOBase from '../../IDistantVOBase';

export default interface ISupervisedItem extends IDistantVOBase, INamedVO {
    last_update: Moment;
    last_value: number;
    creation_date: Moment;
    first_update: Moment;

    state: number;
}