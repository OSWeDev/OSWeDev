import IDistantVOBase from '../../IDistantVOBase';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default interface IInstantiatedPageComponent extends IDistantVOBase, IWeightedItem {
    page_id: number;
    weight: number;
}