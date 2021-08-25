import IImportedData from "../../../../DataImport/interfaces/IImportedData";

export default class AnimationImportThemeVO implements IImportedData {

    public static API_TYPE_ID: string = "anim_import_theme";

    public id: number;
    public _type: string = AnimationImportThemeVO.API_TYPE_ID;

    public description: string;
    public name: string;
    public weight: string;
    public id_import: string; //id unique pour l'import

    public importation_state: number;
    public not_validated_msg: string;
    public not_imported_msg: string;
    public not_posttreated_msg: string;
    public creation_date: number;
    public target_vo_id: number;
    public historic_id: number;
    public imported_line_number: number;
}