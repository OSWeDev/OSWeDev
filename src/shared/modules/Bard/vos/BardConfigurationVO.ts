
import IDistantVOBase from '../../IDistantVOBase';
import AbstractVO from '../../VO/abstract/AbstractVO';

export default class BardConfigurationVO extends AbstractVO implements IDistantVOBase {

    public static API_TYPE_ID: string = "bard_configuration";

    public id: number;
    public _type: string = BardConfigurationVO.API_TYPE_ID;


    public user_id: number;
    public cookies: string;

    public date: number;
}