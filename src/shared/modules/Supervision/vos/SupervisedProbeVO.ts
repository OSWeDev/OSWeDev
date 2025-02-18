import IDistantVOBase from '../../IDistantVOBase';

export default class SupervisedProbeVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "supervision_probe";

    public id: number;
    public _type: string = SupervisedProbeVO.API_TYPE_ID;

    public sup_item_api_type_id: string;
    public category_id: number;
    public notify: boolean;
    public weight: number;

    public static createNew(
        sup_item_api_type_id: string,
        category_id: number,
        notify: boolean,
        weight?: number,
    ): SupervisedProbeVO {
        const res: SupervisedProbeVO = new SupervisedProbeVO();

        res.sup_item_api_type_id = sup_item_api_type_id;
        res.category_id = category_id;
        res.notify = notify;
        res.weight = weight ? weight : 0;

        return res;
    }
}