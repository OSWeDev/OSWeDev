import INamedVO from '../../../interfaces/INamedVO';
import IDistantVOBase from '../../IDistantVOBase';

export default class SupervisedCategoryVO implements IDistantVOBase, INamedVO {

    public static API_TYPE_ID: string = "supervision_cat";

    public static createNew(
        name: string,
        notify: boolean,
    ): SupervisedCategoryVO {
        let res: SupervisedCategoryVO = new SupervisedCategoryVO();

        res.name = name;
        res.notify = notify;

        return res;
    }

    public id: number;
    public _type: string = SupervisedCategoryVO.API_TYPE_ID;

    public name: string;
    public notify: boolean;
}