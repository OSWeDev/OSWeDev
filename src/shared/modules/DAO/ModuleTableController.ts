import { isArray } from "lodash";
import TableFieldTypesManager from "../TableFieldTypes/TableFieldTypesManager";
import DefaultTranslationVO from "../Translation/vos/DefaultTranslationVO";
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from "./vos/ModuleTableFieldVO";
import IDistantVOBase from "../IDistantVOBase";
import VOsTypesManager from "../VO/manager/VOsTypesManager";
import ModuleTableVO from "./vos/ModuleTableVO";

export default class ModuleTableController {

    public static create_new(
        tmp_module: Module,
        tmp_vo_type: string,
        voConstructor: () => T,
        tmp_fields: Array<ModuleTableFieldVO<any>>,
        default_label_field: ModuleTableFieldVO<any>,
        label: string | DefaultTranslationVO = null
    ) {

        let res: ModuleTableVO = new ModuleTableVO();
    }

    /**
     * Permet de récupérer un clone dont les fields sont trasférable via l'api (en gros ça passe par un json.stringify).
     * Cela autorise l'usage en VO de fields dont les types sont incompatibles nativement avec json.stringify (moment par exemple qui sur un parse reste une string)
     * @param e Le VO dont on veut une version api
     * @param translate_field_id Si on veut traduire les field_id en api_field_id (false pour l'usage du update_vos que la context query)
     * @param translate_plain_obj_inside_fields_ids Si on veut traduire les plain obj à l'intérieur des fields (a priori true tout le temps, même dans le cas des context query)
     */
    public static default_get_api_version<T extends IDistantVOBase>(e: T, translate_field_id: boolean = true, translate_plain_obj_inside_fields_ids: boolean = true): any {
        if (!e) {
            return null;
        }

        let table = VOsTypesManager.moduleTables_by_voType[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res = {};
        if (!table.fields_) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = table.getFieldIdToAPIMap();

        /**
         * Cas des matroids, on ignore les champs du matroid dans ce cas, on recréera le matroid de l'autre côté via l'index
         *  et par contre on crée un field fictif _api_only_index avec l'index dedans
         */
        let ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable) {
            let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (let i in ignore_fields_) {
                let ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_id] = true;
            }
            res['_api_only_index'] = (e as any as VarDataBaseVO).index;
        }

        for (let i in table.fields_) {
            let field = table.fields_[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_id]) {
                continue;
            }

            let new_id = translate_field_id ? fieldIdToAPIMap[field.field_id] : field.field_id;
            res[new_id] = table.default_get_field_api_version(e[field.field_id], field, translate_plain_obj_inside_fields_ids);
        }

        return res;
    }

    /**
     * On obtient enfin un vo instancié correctement depuis la classe cible. Donc on pourra théoriquement utiliser
     * des méthodes sur les vos et de l'héritage de vo normalement ... théoriquement
     */
    public static default_from_api_version<T extends IDistantVOBase>(e: any): T {
        if (e == null) {
            return null;
        }

        let table = VOsTypesManager.moduleTables_by_voType[e._type];
        if ((!e._type) || !table) {
            return cloneDeep(e);
        }

        let res: T = table.getNewVO();

        if ((!table.fields_) || (!res)) {
            return cloneDeep(e);
        }

        res['_type'] = e._type;
        res['id'] = e.id;

        // C'est aussi ici qu'on peut décider de renommer les fields__ en fonction de l'ordre dans la def de moduletable
        //  pour réduire au max l'objet envoyé, et l'offusquer un peu
        let fieldIdToAPIMap: { [field_id: string]: string } = table.getFieldIdToAPIMap();

        /**
         * Cas des matroids, on recrée le matroid de l'autre côté via l'index dans _api_only_index
         */
        let ignore_fields: { [field_id: string]: boolean } = {};
        if (table.isMatroidTable && !!e['_api_only_index']) {
            let a: T = MatroidIndexHandler.from_normalized_vardata(e['_api_only_index']) as any as T;
            a._type = res._type;
            a.id = res.id;
            res = a;
            let ignore_fields_ = MatroidController.getMatroidFields(table.vo_type);
            for (let i in ignore_fields_) {
                let ignore_field_ = ignore_fields_[i];
                ignore_fields[ignore_field_.field_id] = true;
            }
        }

        for (let i in table.fields_) {
            let field = table.fields_[i];

            if (field.is_readonly) {
                continue;
            }

            if (ignore_fields[field.field_id]) {
                continue;
            }

            let old_id = fieldIdToAPIMap[field.field_id];
            res[field.field_id] = table.default_field_from_api_version(e[old_id], field);
        }

        /// Dans TOUS les cas, le field is_server est forcé à FALSE quand on vient du client
        if (!!res[reflect<IIsServerField>().is_server]) {
            res[reflect<IIsServerField>().is_server] = false;
        }

        return res;
    }

}