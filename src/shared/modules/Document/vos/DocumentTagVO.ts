import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class DocumentTagVO implements INamedVO, IWeightedItem {
    public static API_TYPE_ID: string = "dt";

    public id: number;
    public _type: string = DocumentTagVO.API_TYPE_ID;

    public name: string;
    public weight: number;
    public description: string;
}