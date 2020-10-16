import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../../shared/modules/ModuleTableField';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import VarServerControllerBase from '../VarServerControllerBase';
import VarsServerController from '../VarsServerController';
import DataSourcesController from './DataSourcesController';

export default abstract class DataSourceControllerBase<TData extends VarDataBaseVO> {

    protected constructor(
        /**
         * Le nom [unique] du Datasource
         */
        public name: string,

        /**
         * Les api_type_ids des params
         */
        public param_api_type_ids: string[],

        /**
         * Les api_type_ids qui engendrent un refresh potentiel du cache
         */
        public vo_api_type_ids: string[],

        // /**
        //  * Les mappings de fields de TData => les fields de chaque api_type_id
        //  */
        // public mapping_by_api_type_ids: { [api_type_id: string]: { [matroid_field_id: string]: string } } = {},

        // /**
        //  * Les mappings de fields de TData => les fields de chaque param potentiellement impacté api_type_id
        //  *  dans le cache
        //  */
        // public matroids_mapping_by_api_type_ids: { [matroid_b_api_type_id: string]: { [matroid_a_field_id: string]: string } } = {}
    ) { }

    /**
     * On utilise une clé unique (au sein d'un datasource) pour identifier la data liée à un var data
     *  et on fournit une fonction simple pour traduire le var_data en clé unique de manière à gérer le cache
     *  de façon centralisée. Par défaut on utilise l'index mais très important d'optimiser cette fonction sur chaque DS
     *  typiquement si on charge toujours la même data indépendemment du var_data....
     */
    public get_data_index(var_data: VarDataBaseVO): string {
        return var_data.index;
    }

    /**
     * Le chargement des données est fait var par var, c'est le moteur de calcul qui vérifie si en fonction de l'index on a vraiment besoin de faire un chargement
     *  de données. Donc pas de cache à gérer dans le datasource, juste répondre à la question posée.
     * ATTENTION : cette fonction a été réemployée mais le fonctionnalité est différente. Initialement utilisée pour charger la donnée depuis le cache
     *  là on veut vraiment charger la data depuis la source de données (base, fichier, ...)
     */
    public abstract get_data(param: TData): Promise<any>;

    // /**
    //  * Pour les matroids, on définit directement un comportement global pour le cache et pour
    //  *  l'update de l'arbre dans get_param_intersector_from_vo_update. Ici on retraduit pour l'arbre
    //  * En amont, on a vérifié évidemment qu'on demande que sur un VO de la liste des api_type_ids du datasource
    //  * @param vo
    //  */
    // public get_updated_params_from_vo_update(vo: IDistantVOBase, filtered_var_ids: { [var_id: number]: VarServerControllerBase<any> } = null): { [index: string]: VarDataBaseVO } {
    //     let res: { [index: string]: VarDataBaseVO } = {};

    //     let intersectors: { [var_id: number]: { [index: string]: TData } } = this.get_param_intersectors_from_vo_update_by_var_id(vo, filtered_var_ids);

    //     if (!intersectors) {
    //         return null;
    //     }

    //     //  On charge simplement tous les registered_vars des var_id concernés:
    //     let var_ids: { [id: number]: boolean } = {};
    //     for (let i in VarsServerController.getInstance().registered_vars_by_datasource[this.name]) {
    //         let var_controller: VarServerControllerBase<any> = VarsServerController.getInstance().registered_vars_by_datasource[this.name][i];

    //         // Si on a filtré des var_id, on ignore ceux qui ne sont pas filtrés
    //         if ((!!filtered_var_ids) && (!filtered_var_ids[var_controller.varConf.id])) {
    //             continue;
    //         }

    //         var_ids[var_controller.varConf.id] = true;
    //     }

    //     TODO FIXME REFONTE DES VARS on a plus d'arbre en mémoire faut aller chercher par les varcontroller pour savoir qui sont les matroids parents à
    //     appliquer en base / en cache pré - base

    //     // for (let i in VarsServerController.getInstance().varDAG.nodes) {
    //     //     let param: VarDataBaseVO = VarsServerController.getInstance().varDAG.nodes[i].var_data;

    //     //     if (!var_ids[param.id]) {
    //     //         continue;
    //     //     }

    //     //     if (!intersectors[param.var_id]) {
    //     //         // Si on n'a rien défini ou null, on invalide tout
    //     //         res[param.index] = param;
    //     //         continue;
    //     //     }

    //     //     for (let j in intersectors[param.var_id]) {
    //     //         let intersector = intersectors[param.var_id][j];

    //     //         // on sait que le param dépend du datasource, on doit pouvoir intersecter les 2 matroids, avec au besoin un mapping de fields
    //     //         if (param._type != intersector._type) {
    //     //             /**
    //     //              * On doit comparer en utilisant un mapping, suivant le type cible.
    //     //              * A voir si ça a du sens, si c'est automatisable, ...
    //     //              * Ce qu'on fait par défaut (peut-être pas une bonne idée non plus) c'est qu'on considère un mapping vide
    //     //              *  mais non null donc ça intersecte en cherchant les mêmes champs, et donc si ça trouve pas, ça ne teste pas
    //     //              *  l'intersection... ça peut simplifier à mort la mise en place, mais cacher des omissions donc à voir si
    //     //              *  c'est bien pertinent et où on peut stocker les mappings de params. Sachant que chaque Datasource/Var peut décider
    //     //              *  d'utiliser un param différemment...
    //     //              */
    //     //             let moduletable: ModuleTable<TData> = VOsTypesManager.getInstance().moduleTables_by_voType[intersector._type];

    //     //             // Si le mapping est null, on veut invalider dans tous les cas
    //     //             // TODO FIXME BUG? : pourquoi on voudrait tout invalider si rien n'est cohérent ? on intersecte rien a priori du coup, donc pourquoi on invalide ?
    //     //             if ((moduletable.mapping_by_api_type_ids[param._type] === null) ||
    //     //                 (MatroidController.getInstance().matroid_intersects_matroid(intersector, param, moduletable.mapping_by_api_type_ids[param._type]))) {
    //     //                 res[param.index] = param;
    //     //                 break;
    //     //             }
    //     //             continue;
    //     //         }

    //     //         if (MatroidController.getInstance().matroid_intersects_matroid(intersector, param)) {
    //     //             res[param.index] = param;
    //     //             break;
    //     //         }
    //     //     }
    //     // }

    //     return res;
    // }

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this);
    }

    /**
     * On filtre par une map de var_ids au besoin pour limiter les résultats en sortie. Sinon on prend tous les intercepteurs
     * @param vo
     */
    public abstract get_param_intersectors_from_vo_update_by_var_id(vo: IDistantVOBase, filtered_var_ids?: { [var_id: number]: VarServerControllerBase<any> }): { [var_id: number]: { [index: string]: TData } };

    /**
     * Base renvoyant des intersecteurs initialisés pour tous les var_id et au plus large => max ranges
     * @param vo
     */
    protected get_global_param_intersectors_by_var_id(filtered_var_ids: { [var_id: number]: VarServerControllerBase<any> } = null): { [var_id: number]: { [index: string]: TData } } {
        let res: { [var_id: number]: { [index: string]: TData } } = {};

        for (let i in VarsServerController.getInstance().registered_vars_by_datasource[this.name]) {
            let controller = VarsServerController.getInstance().registered_vars_by_datasource[this.name][i];

            if ((!!filtered_var_ids) && (!filtered_var_ids[controller.varConf.id])) {
                continue;
            }

            let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[controller.varConf.var_data_vo_type];
            let intersector: TData = moduletable.voConstructor();

            intersector.var_id = controller.varConf.id;

            let fields: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(controller.varConf.var_data_vo_type);
            for (let fields_i in fields) {
                let field = fields[fields_i];

                switch (field.field_type) {
                    case ModuleTableField.FIELD_TYPE_tstzrange_array:
                        intersector[field.field_id] = [RangeHandler.getInstance().getMaxTSRange()];
                    case ModuleTableField.FIELD_TYPE_refrange_array:
                        intersector[field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                    case ModuleTableField.FIELD_TYPE_numrange_array:
                        intersector[field.field_id] = [RangeHandler.getInstance().getMaxNumRange()];
                    case ModuleTableField.FIELD_TYPE_hourrange_array:
                        intersector[field.field_id] = [RangeHandler.getInstance().getMaxHourRange()];
                    default:
                }
            }

            if (!res[controller.varConf.id]) {
                res[controller.varConf.id] = {};
            }
            res[controller.varConf.id] = { [intersector.index]: intersector };
        }

        return res;
    }
}