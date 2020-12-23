import IDistantVOBase from '../../IDistantVOBase';

export default interface ICheckPointDep extends IDistantVOBase {
    checkpoint_id: number;
    dependson_id: number;
}