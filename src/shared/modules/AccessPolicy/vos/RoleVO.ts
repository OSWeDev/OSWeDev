import ConversionHandler from '../../../tools/ConversionHandler';

export default class RoleVO {
    public static API_TYPE_ID: string = "role";

    public id: number;
    public _type: string = RoleVO.API_TYPE_ID;

    public translatable_name: string;
}