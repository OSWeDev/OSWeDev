import IDistantVOBase from '../../IDistantVOBase';


export default class CRUDFieldRemoverConfVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "crud_field_rmv";

    public id: number;
    public _type: string = CRUDFieldRemoverConfVO.API_TYPE_ID;

    public module_table_vo_type: string;
    public module_table_field_ids: string[];
    public is_update: boolean;
}