import IDistantVOBase from '../../IDistantVOBase';
import IUserLinkedItem from '../../../tools/interfaces/IUserLinkedItem';

export default interface IPlanFacilitator extends IDistantVOBase, IUserLinkedItem {
    firstname: string;
    lastname: string;
    manager_id?: number;
    partner_id?: number;
    region_id?: number;

    activated: boolean;
}