import { Moment } from "moment";
import IImportedData from "../../../../DataImport/interfaces/IImportedData";

export default class AnimationImportModuleVO implements IImportedData {

    public static API_TYPE_ID: string = "anim_import_module";

    public id: number;
    public _type: string = AnimationImportModuleVO.API_TYPE_ID;

    public description: string;
    public messages: string;

    public name: string;
    public computed_name: string;
    public weight: string;

    public theme_id_import: string;
    public document_id: string;
    public role_id_ranges: string;

    public id_import: string;

    public importation_state: number;
    public not_validated_msg: string;
    public not_imported_msg: string;
    public not_posttreated_msg: string;
    public creation_date: Moment;
    public target_vo_id: number;
    public historic_id: number;
    public imported_line_number: number;
}