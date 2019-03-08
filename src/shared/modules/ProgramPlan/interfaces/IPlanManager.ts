import IDistantVOBase from '../../IDistantVOBase';
import IUserLinkedItem from '../../../tools/interfaces/IUserLinkedItem';

export default interface IPlanManager extends IDistantVOBase, IUserLinkedItem {
    firstname: string;
    lastname: string;
    partner_id: number;
}