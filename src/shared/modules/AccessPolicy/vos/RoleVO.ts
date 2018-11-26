import IDistantVOBase from '../../IDistantVOBase';
import IWeightedItem from '../../../tools/interfaces/IWeightedItem';

export default class RoleVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "role";

    public id: number;
    public _type: string = RoleVO.API_TYPE_ID;

    public translatable_name: string;
    public parent_role_id: number;
    public weight: number;
}