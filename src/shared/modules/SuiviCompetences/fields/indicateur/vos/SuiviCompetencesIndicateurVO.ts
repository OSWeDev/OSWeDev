import DatatableField from "../../../../DAO/vos/datatable/DatatableField";
import SimpleDatatableFieldVO from "../../../../DAO/vos/datatable/SimpleDatatableFieldVO";
import ModuleTable from "../../../../ModuleTable";
import ModuleTableField from "../../../../ModuleTableField";
import DefaultTranslation from "../../../../Translation/vos/DefaultTranslation";
import ModuleSuiviCompetences from "../../../ModuleSuiviCompetences";

export default class SuiviCompetencesIndicateurVO {
    public static API_TYPE_ID: string = 'suivi_comp_indicateur';

    public static moduleTable(): ModuleTable<any> {
        let datatable_fields = [
            new ModuleTableField('titre', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Titre' })),
            new ModuleTableField('description', ModuleTableField.FIELD_TYPE_string, new DefaultTranslation({ 'fr-fr': 'Description' })),
        ];

        return new ModuleTable(ModuleSuiviCompetences.getInstance(), SuiviCompetencesIndicateurVO.API_TYPE_ID, null, datatable_fields, null);
    }

    public static fields(): Array<DatatableField<any, any>> {
        let fields: Array<DatatableField<any, any>> = [];
        let moduleTable: ModuleTable<any> = SuiviCompetencesIndicateurVO.moduleTable();
        let moduleTable_fields: Array<ModuleTableField<any>> = moduleTable.get_fields();

        if (moduleTable_fields) {
            for (let i in moduleTable_fields) {
                let field: ModuleTableField<any> = moduleTable_fields[i];
                let data_field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field.field_id);
                data_field.setModuleTable(moduleTable);
                fields.push(data_field);
            }
        }

        return fields;
    }

    public static createNew(
        titre: string,
        description: string,
    ): SuiviCompetencesIndicateurVO {
        let res: SuiviCompetencesIndicateurVO = new SuiviCompetencesIndicateurVO();

        res.titre = titre;
        res.description = description;

        return res;
    }

    public titre: string;
    public description: string;
}