import IWeightedItem from '../../../tools/interfaces/IWeightedItem';
import IDistantVOBase from '../../IDistantVOBase';

export default class AccessPolicyGroupVO implements IDistantVOBase, IWeightedItem {
    public static API_TYPE_ID: string = "accpolgrp";

    public id: number;
    public _type: string = AccessPolicyGroupVO.API_TYPE_ID;

    public translatable_name: string;
    public weight: number;
}