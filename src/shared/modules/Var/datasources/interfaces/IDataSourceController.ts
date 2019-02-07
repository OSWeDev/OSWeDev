import IVarDataVOBase from '../../interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../interfaces/IVarDataParamVOBase';

export default interface IDateIndexedVarDataParam {

    load_for_batch(
        BATCH_UID: number,
        vars_params: { [index: string]: IVarDataParamVOBase },
        imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;

    get_data(BATCH_UID: number, param: IVarDataParamVOBase): any;

    clean_for_batch(
        BATCH_UID: number,
        vars_params: { [index: string]: IVarDataParamVOBase },
        imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;
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
    //     vars_params: { [index: string]: IVarDataParamVOBase },
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;

    // /**
    //  * Fonction qui réalise effectivement le chargement des datas pour toutes les demandes du batch (indépendamment du var_id)
    //  * @param BATCH_UID
    //  * @param imported_datas
    //  */
    // load_batch(
    //     BATCH_UID: number,
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;

    // /**
    //  * Donne accès à la data chargée pour un param
    //  * @param BATCH_UID
    //  * @param param
    //  */
    // get_data(BATCH_UID: number, param: IVarDataParamVOBase): any;

    // /**
    //  * Nettoyage des datas chargées
    //  */
    // clean_batch(
    //     BATCH_UID: number,
    //     vars_params: { [index: string]: IVarDataParamVOBase },
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): Promise<void>;
