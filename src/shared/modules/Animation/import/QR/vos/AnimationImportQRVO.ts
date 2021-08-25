import IImportedData from "../../../../DataImport/interfaces/IImportedData";


export default class AnimationImportQRVO implements IImportedData {

    public static API_TYPE_ID: string = "anim_import_qr";

    public id: number;
    public _type: string = AnimationImportQRVO.API_TYPE_ID;

    public description: string;
    public reponses: string;
    public explicatif: string;
    public external_video: string;

    public name: string;
    public weight: string;

    public question_file_id: string;
    public reponse_file_id: string;

    public module_id_import: string;

    public importation_state: number;
    public not_validated_msg: string;
    public not_imported_msg: string;
    public not_posttreated_msg: string;
    public creation_date: number;
    public target_vo_id: number;
    public historic_id: number;
    public imported_line_number: number;
}