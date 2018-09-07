import IDistantVOBase from '../../IDistantVOBase';

export default interface IImportedData extends IDistantVOBase {

    importation_state: number;

    not_validated_msg: string;
    not_imported_msg: string;
    not_posttreated_msg: string;

    creation_date: string;

    target_vo_id: number;
}