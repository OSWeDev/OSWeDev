import IDistantVOBase from '../../IDistantVOBase';


export default interface IVersionedVO extends IDistantVOBase {
    parent_id: number;

    trashed: boolean;

    version_num: number;

    version_author_id: number;
    version_timestamp: number;
    version_edit_author_id: number;
    version_edit_timestamp: number;
}