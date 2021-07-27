import IDistantVOBase from '../../IDistantVOBase';


export default interface IImportedData extends IDistantVOBase {

    importation_state: number;

    /**
     * 0 indexed line from imported file
     */
    imported_line_number: number;

    not_validated_msg: string;
    not_imported_msg: string;
    not_posttreated_msg: string;

    creation_date: number;

    historic_id: number;
}