import INamedVO from '../../../interfaces/INamedVO';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class DocumentTagGroupVO implements INamedVO, IWeightedItem {
    public static API_TYPE_ID: string = "dtg";

    public id: number;
    public _type: string = DocumentTagGroupVO.API_TYPE_ID;

    public name: string;
    public weight: number;
    public description: string;
}