import IDistantVOBase from "../../IDistantVOBase";

/**
 * On encapsule les références vers un VO externe, soit en exportant le VO lui-même, soit en exportant uniquement un champ de référence : id ou field_name fourni dans la conf de l'export (et on rappelle donc le champs utilisé)
 */
export default class ExportedJSONForeignKeyRefVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "exported_json_foreign_key_ref";

    public static REF_TYPE_FULL_VO: number = 0;
    public static REF_TYPE_ID: number = 1;
    public static REF_TYPE_UNIQUE_FIELD_TYPE_STRING: number = 2;
    public static REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER: number = 3;
    public static REF_TYPE_LABELS: { [enum_value: number]: string } = {
        [ExportedJSONForeignKeyRefVO.REF_TYPE_FULL_VO]: "ExportedJSONForeignKeyRefVO.REF_TYPE_FULL_VO",
        [ExportedJSONForeignKeyRefVO.REF_TYPE_ID]: "ExportedJSONForeignKeyRefVO.REF_TYPE_ID",
        [ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_STRING]: "ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_STRING",
        [ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER]: "ExportedJSONForeignKeyRefVO.REF_TYPE_UNIQUE_FIELD_TYPE_NUMBER",
    };


    public id: number;
    public _type: string = ExportedJSONForeignKeyRefVO.API_TYPE_ID;

    /**
     * La méthode d'export, issue de la conf : Full VO, uniquement l'id du VO, ou un champ unique du VO
     */
    public ref_type: number;

    /**
     * Dans le cas où on exporte le VO entier, on le stocke ici en exported_json
     */
    public vo_exported_json: string;

    /**
     * Dans le cas où on exporte uniquement un champ, on stocke ici le champ utilisé
     */
    public unique_field_name: string;

    /**
     * Dans le cas où on exporte uniquement un champ, on stocke ici la valeur du champ utilisé : cas string
     */
    public unique_field_value_string: string;

    /**
     * Dans le cas où on exporte uniquement un champ, on stocke ici la valeur du champ utilisé : cas number
     */
    public unique_field_value_number: number;

    /**
     * Dans le cas où on exporte uniquement l'id, on stocke ici l'id du VO
     */
    public vo_id: number;
}