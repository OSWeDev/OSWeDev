import IDistantVOBase from '../IDistantVOBase';
import MatroidController from '../Matroid/MatroidController';
import ModuleTable from '../ModuleTable';
import VarDAG from '../Var/graph/var/VarDAG';
import IVarDataParamVOBase from '../Var/interfaces/IVarDataParamVOBase';
import IVarMatroidDataParamVO from '../Var/interfaces/IVarMatroidDataParamVO';
import IVarMatroidDataVO from '../Var/interfaces/IVarMatroidDataVO';
import VarsController from '../Var/VarsController';
import VOsTypesManager from '../VOsTypesManager';
import DataSourcesController from './DataSourcesController';
import IDataSourceController from './interfaces/IDataSourceController';
import VarControllerBase from '../Var/VarControllerBase';

export default abstract class DataSourceMatroidControllerBase<TData extends IVarMatroidDataVO & TDataParam, TDataParam extends IVarMatroidDataParamVO> implements IDataSourceController<TData, TDataParam> {

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

        public can_use_server_side: boolean,
        public can_use_client_side: boolean,

        // /**
        //  * Les mappings de fields de TDataParam => les fields de chaque api_type_id
        //  */
        // public mapping_by_api_type_ids: { [api_type_id: string]: { [matroid_field_id: string]: string } } = {},

        // /**
        //  * Les mappings de fields de TDataParam => les fields de chaque param potentiellement impacté api_type_id
        //  *  dans le cache
        //  */
        // public matroids_mapping_by_api_type_ids: { [matroid_b_api_type_id: string]: { [matroid_a_field_id: string]: string } } = {}
    ) { }

    public abstract load_for_batch(vars_params: { [index: string]: TDataParam }): Promise<void>;

    public abstract get_data(param: TDataParam): any;

    /**
     * Pour les matroids, on définit directement un comportement global pour le cache et pour
     *  l'update de l'arbre dans get_param_intersector_from_vo_update. Ici on retraduit pour l'arbre
     * En amont, on a vérifié évidemment qu'on demande que sur un VO de la liste des api_type_ids du datasource
     * @param vo
     */
    public get_updated_params_from_vo_update(vo: IDistantVOBase, filtered_var_ids: { [var_id: number]: VarControllerBase<any, any> } = null): { [index: string]: IVarDataParamVOBase } {
        let res: { [index: string]: IVarDataParamVOBase } = {};

        let intersectors: { [var_id: number]: TDataParam[] } = this.get_param_intersectors_from_vo_update_by_var_id(vo, filtered_var_ids);

        if (!intersectors) {
            return null;
        }

        //  On charge simplement tous les registered_vars des var_id concernés:
        for (let i in VarsController.getInstance().varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DATASOURCE_NAME + this.name]) {
            let index: string = VarsController.getInstance().varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DATASOURCE_NAME + this.name][i];
            let param: IVarDataParamVOBase = VarsController.getInstance().varDAG.nodes[index].param;

            // Si on a filtré des var_id, on ignore ceux qui ne sont pas filtrés
            if ((!!filtered_var_ids) && (!filtered_var_ids[param.var_id])) {
                continue;
            }

            if (!intersectors[param.var_id]) {
                // Si on n'a rien défini ou null, on invalide tout
                res[index] = param;
                continue;
            }

            for (let j in intersectors[param.var_id]) {
                let intersector = intersectors[param.var_id][j];

                // on sait que le param dépend du datasource, on doit pouvoir intersecter les 2 matroids, avec au besoin un mapping de fields
                if (param._type != intersector._type) {
                    /**
                     * On doit comparer en utilisant un mapping, suivant le type cible.
                     * A voir si ça a du sens, si c'est automatisable, ...
                     * Ce qu'on fait par défaut (peut-être pas une bonne idée non plus) c'est qu'on considère un mapping vide
                     *  mais non null donc ça intersecte en cherchant les mêmes champs, et donc si ça trouve pas, ça ne teste pas
                     *  l'intersection... ça peut simplifier à mort la mise en place, mais cacher des omissions donc à voir si
                     *  c'est bien pertinent et où on peut stocker les mappings de params. Sachant que chaque Datasource/Var peut décider
                     *  d'utiliser un param différemment...
                     */
                    let moduletable: ModuleTable<TDataParam> = VOsTypesManager.getInstance().moduleTables_by_voType[intersector._type];

                    // Si le mapping est null, on veut invalider dans tous les cas
                    if ((moduletable.mapping_by_api_type_ids[param._type] === null) ||
                        (MatroidController.getInstance().matroid_intersects_matroid(intersector, param, moduletable.mapping_by_api_type_ids[param._type]))) {
                        res[index] = param;
                        break;
                    }
                    continue;
                }

                if (MatroidController.getInstance().matroid_intersects_matroid(intersector, param)) {
                    res[index] = param;
                    break;
                }
            }
        }
        return res;
    }

    public registerDataSource() {
        DataSourcesController.getInstance().registerDataSource(this);
    }

    // /**
    //  * Dans le cas des matroids, on propose une nouvelle implémentation, qui s'adapte au cache côté serveur et à
    //  *  l'arbre côté client (ou serveur)
    //  * Dans ce cas on renvoie un intersecteur de même type que le paramètre du Datasource, qui viendra intersecter la bdd ou l'arbre
    //  * @param vo
    //  */
    // protected get_param_intersectors_from_vo_update(vo: IDistantVOBase): TDataParam[] {

    //     let moduletable: ModuleTable<TDataParam> = VOsTypesManager.getInstance().moduleTables_by_voType[this.param_api_type_id];
    //     let res: TDataParam[] = [];

    //     let param_intersector: TDataParam = moduletable.voConstructor();

    //     let matroid_fields: Array<ModuleTableField<any>> = MatroidController.getInstance().getMatroidFields(this.param_api_type_id);

    //     for (let i in matroid_fields) {
    //         let matroid_field: ModuleTableField<any> = matroid_fields[i];

    //         param_intersector[matroid_field.field_id] = moduletable.
    //     }
    //     param_intersector[]

    //     // Pour chaque var_id utilisant ce DS, on doit dupliquer et intersecter sur le var_id

    //     for (;

    //     // On dé
    //     res.var_id =
    // }

    /**
     * On filtre par une map de var_ids au besoin pour limiter les résultats en sortie. Sinon on prend tous les intercepteurs
     * @param vo
     */
    public abstract get_param_intersectors_from_vo_update_by_var_id(vo: IDistantVOBase, filtered_var_ids?: { [var_id: number]: VarControllerBase<any, any> }): { [var_id: number]: TDataParam[] };

    /**
     * Base renvoyant des intersecteurs initialisés pour tous les var_id et au plus large (on envoie null => pas de filtrage donc tout invalider)
     * @param vo
     */
    protected get_global_param_intersectors_by_var_id(filtered_var_ids: { [var_id: number]: VarControllerBase<any, any> } = null): { [var_id: number]: TDataParam[] } {
        let res: { [var_id: number]: TDataParam[] } = {};

        for (let i in VarsController.getInstance().registered_vars_by_datasource[this.name]) {
            let controller = VarsController.getInstance().registered_vars_by_datasource[this.name][i];

            if ((!!filtered_var_ids) && (!filtered_var_ids[controller.varConf.id])) {
                continue;
            }
            res[controller.varConf.id] = null;
        }

        return res;
    }
}