import IDistantVOBase from '../../IDistantVOBase';
import IUserLinkedItem from '../../../tools/interfaces/IUserLinkedItem';
import INamedVO from '../../../interfaces/INamedVO';

export default interface IPlanTargetGroup extends IDistantVOBase, INamedVO, IUserLinkedItem {
    name: string;
    user_id: number;
}