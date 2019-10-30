import IDistantVOBase from '../../IDistantVOBase';
import IVarDataParamVOBase from '../../Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../Var/interfaces/IVarDataVOBase';

export default interface IDataSourceController<TData extends IVarDataVOBase & TDataParam, TDataParam extends IVarDataParamVOBase> {

    name: string;

    /**
     * Déclarer un datasource utilisable côté serveur
     */
    can_use_server_side: boolean;

    /**
     * Déclarer une datasource utilisable côté client
     */
    can_use_client_side: boolean;

    load_for_batch(vars_params: { [index: string]: TDataParam }): Promise<void>;

    get_data(param: TDataParam): any;

    // clean_for_batch(vars_params: { [index: string]: TDataParam }): Promise<void>;

    get_updated_params_from_vo_update(vo: IDistantVOBase): { [index: string]: IVarDataParamVOBase };

    registerDataSource();
}
    // TODO DATASOURCES : chargements plus intelligents mais qui nécessite une gestion très flexible des dépendances entre vars,
    // pour le moment on doit charger les datasources pour savoir les dépendances, donc on peut pas regrouper tous les chargements
    // comme ça c'est compliqué
    // /**
    //  * On veut pouvoir stocker toutes les demandes de chaque type de var, avant de lancer effectivement le chargement
    //  *  sur l'ensemble des params de toutes les vars
    //  * @param BATCH_UID
    //  * @param vars_params
    //  * @param imported_datas
    //  */
    // add_params_to_batch_loading(
    //     BATCH_UID: number,
    //     vars_params: { [index: string]: TDataParam },
    //     imported_datas: { [var_id: number]: { [param_index: string]: TData } }): Promise<void>;

    // /**
    //  * Fonction qui réalise effectivement le chargement des datas pour toutes les demandes du batch (indépendamment du var_id)
    //  * @param BATCH_UID
    //  * @param imported_datas
    //  */
    // load_batch(
    //     BATCH_UID: number,
    //     imported_datas: { [var_id: number]: { [param_index: string]: TData } }): Promise<void>;

    // /**
    //  * Donne accès à la data chargée pour un param
    //  * @param BATCH_UID
    //  * @param param
    //  */
    // get_data(BATCH_UID: number, param: TDataParam): any;

    // /**
    //  * Nettoyage des datas chargées
    //  */
    // clean_batch(
    //     BATCH_UID: number,
    //     vars_params: { [index: string]: TDataParam },
    //     imported_datas: { [var_id: number]: { [param_index: string]: TData } }): Promise<void>;
