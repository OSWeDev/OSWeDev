import INamedVO from '../../../interfaces/INamedVO';
import IDistantVOBase from '../../IDistantVOBase';

export default class SupervisedCategoryVO implements IDistantVOBase, INamedVO {

    public static API_TYPE_ID: string = "supervision_cat";

    public id: number;
    public _type: string = SupervisedCategoryVO.API_TYPE_ID;

    public name: string;
    public notify: boolean;
    public weight: number;

    public static createNew(
        name: string,
        notify: boolean,
        weight?: number,
    ): SupervisedCategoryVO {
        const res: SupervisedCategoryVO = new SupervisedCategoryVO();

        res.name = name;
        res.notify = notify;
        res.weight = weight ? weight : 0;

        return res;
    }
}