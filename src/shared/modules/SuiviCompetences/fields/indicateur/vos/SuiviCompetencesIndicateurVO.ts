import ModuleTableController from "../../../../DAO/ModuleTableController";
import ModuleTableFieldVO from "../../../../DAO/vos/ModuleTableFieldVO";
import ModuleTableVO from "../../../../DAO/vos/ModuleTableVO";
import DatatableField from "../../../../DAO/vos/datatable/DatatableField";
import SimpleDatatableFieldVO from "../../../../DAO/vos/datatable/SimpleDatatableFieldVO";
import IDistantVOBase from "../../../../IDistantVOBase";

export default class SuiviCompetencesIndicateurVO implements IDistantVOBase {
    public static API_TYPE_ID: string = 'suivi_comp_indicateur';

    public id: number;
    public _type: string = SuiviCompetencesIndicateurVO.API_TYPE_ID;

    public titre: string;
    public description: string;

    public static createNew(
        titre: string,
        description: string,
    ): SuiviCompetencesIndicateurVO {
        const res: SuiviCompetencesIndicateurVO = new SuiviCompetencesIndicateurVO();

        res.titre = titre;
        res.description = description;

        return res;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    public static fields(): Array<DatatableField<any, any>> {
        const fields: Array<DatatableField<any, any>> = [];
        const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[SuiviCompetencesIndicateurVO.API_TYPE_ID];
        const moduleTable_fields: Array<ModuleTableFieldVO> = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (const i in moduleTable_fields) {
                const field: ModuleTableFieldVO = moduleTable_fields[i];
                const data_field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field.field_id);
                data_field.setModuleTable(moduleTable);
                fields.push(data_field);
            }
        }

        return fields;
    }
}