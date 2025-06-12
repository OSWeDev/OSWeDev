import IDistantVOBase from '../../IDistantVOBase';

export default class VocusInfoVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "vocus_info";

    public id: number;
    public _type: string = VocusInfoVO.API_TYPE_ID;

    public linked_type: string;
    public linked_label: string;
    public linked_id: number;
    public linked_field_id: string;

    public is_cascade: boolean;
}