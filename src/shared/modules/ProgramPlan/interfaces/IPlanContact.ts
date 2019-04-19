import IDistantVOBase from '../../IDistantVOBase';
import IUserLinkedItem from '../../../tools/interfaces/IUserLinkedItem';

export default interface IPlanContact extends IDistantVOBase, IUserLinkedItem {

    firstname: string;
    lastname: string;
    mail: string;
    mobile: string;
    infos: string;
    contact_type_id?: number;
}