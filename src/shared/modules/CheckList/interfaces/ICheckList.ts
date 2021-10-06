import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckList extends IDistantVOBase {
    name: string;
    limit_affichage: number;
}