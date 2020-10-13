import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../shared/tools/DateHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import VarsServerController from './VarsServerController';

/**
 * On gère le buffer des mises à jour de vos en lien avec des vars pour invalider au plus vite les vars en cache en cas de modification d'un VO
 *  tout en empilant quelques centaines d'updates à la fois, pour ne pas invalider 100 fois les mêmes params, cette étape est coûteuse
 *  on sépare en revanche les vos par type_id et par type de modification (si on modifie 3 fois un vo on veut toutes les modifications pour l'invalidation donc on ignore rien par contre)
 */
export default class VarsDatasVoUpdateHandler {

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     *  - Everything in this controller needs to be running in the var calculation bg thread
     */
    public static getInstance(): VarsDatasVoUpdateHandler {
        if (!VarsDatasVoUpdateHandler.instance) {
            VarsDatasVoUpdateHandler.instance = new VarsDatasVoUpdateHandler();
        }
        return VarsDatasVoUpdateHandler.instance;
    }

    private static instance: VarsDatasVoUpdateHandler = null;

    private ordered_vos_cud: Array<DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase> = [];

    protected constructor() {
    }

    public register_vo_cud(vo_cud: DAOUpdateVOHolder<IDistantVOBase> | IDistantVOBase) {
        this.ordered_vos_cud.push(vo_cud);
    }

    /**
     * On passe en param le nombre max de cud qu'on veut gérer, et on dépile en FIFO
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon (et donc le buffer est vide)
     */
    public async handle_buffer(limit: number): Promise<number> {


        let vo_types: string[] = [];
        let vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> } = {};
        let vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] } = {};

        limit = this.prepare_updates(limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);

        for (let i in vo_types) {
            let vo_type = vo_types[i];

            /**
             * Pour chaque vo_type, on prend tous les varcontrollers concernés et on demande les intersecteurs en CD et en U
             *  On combine les intersecteurs en CD et U via une union
             */
        }

        /**
         * On veut partir du bas de l'arbre des deps => on doit pouvoir calculer cet arbre dès l'init de l'application
         *  et pour chaque var_id (en visite bottom->up + through sur chaque var_id concerné en premier niveau par ce batch)
         * Quand on a géré une var_id on peut marquer que c'est géré, donc on ignore et continue la visite par les autres noeuds
         *  Sachant qu'on a qu'un batch à la fois (sémaphore) on devrait pas avoir de soucis pour faire ce marquage
         * Et donc pour chaque var_id :
         *      - si on a des intersecteurs CD et U on les prend
         *      - si on a des intersecteurs déduits des enfants on les prend
         *      - on fait une union de tous les intersecteurs, et on déduit les intersecteurs de chaque var_id parents (qu'on ajoute à la liste si ils en ont déjà)
         *      - on marque le var_id comme géré
         */

        return limit;
    }

    /**
     * Préparation du batch d'invalidation des vars suite à des CUD de vos
     * @param limit nombre max de CUDs à prendre en compte dans ce batch
     * @param vos_update_buffer les updates par type à remplir
     * @param vos_create_or_delete_buffer les creates / deletes par type à remplir
     * @param vo_types la liste des vo_types à remplir
     * @returns 0 si on a géré limit éléments dans le buffer, != 0 sinon (et donc le buffer est vide)
     */
    private prepare_updates(limit: number, vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> }, vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] }, vo_types: string[]): number {
        while ((limit > 0) && this.ordered_vos_cud) {

            let vo_cud = this.ordered_vos_cud.shift();
            // Si on a un champ _type, on est sur un VO, sinon c'est un update
            if (!!vo_cud['_type']) {
                if (!vos_create_or_delete_buffer[vo_cud['_type']]) {

                    vo_types.push(vo_cud['_type']);
                    vos_create_or_delete_buffer[vo_cud['_type']] = [];
                }
                vos_create_or_delete_buffer[vo_cud['_type']].push(vo_cud as IDistantVOBase);
            } else {
                let update_holder: DAOUpdateVOHolder<IDistantVOBase> = vo_cud as DAOUpdateVOHolder<IDistantVOBase>;
                if (!vos_update_buffer[update_holder.post_update_vo._type]) {
                    if (!vos_create_or_delete_buffer[update_holder.post_update_vo._type]) {
                        vo_types.push(update_holder.post_update_vo._type);
                    }

                    vos_update_buffer[update_holder.post_update_vo._type] = [];
                }
                vos_update_buffer[update_holder.post_update_vo._type].push(update_holder);
            }

            limit--;
        }

        return limit;
    }

    /**
     * On a explicitement pas l'id à ce niveau donc on cherche par l'index plutôt
     */
    public async get_exact_param_from_buffer_or_bdd<T extends VarDataBaseVO>(var_data: T): Promise<T> {

        if (this.vars_datas_buffer[var_data.index]) {
            return this.vars_datas_buffer[var_data.index] as T;
        }

        if (var_data.id) {
            return await ModuleDAO.getInstance().getVoById<T>(var_data._type, var_data.id, VOsTypesManager.getInstance().moduleTables_by_voType[var_data._type].get_segmented_field_raw_value_from_vo(var_data));
        }

        let res: T[] = await ModuleDAO.getInstance().getVosByExactMatroids<T, T>(var_data._type, [var_data], null);

        if (res && res.length) {
            return res[0];
        }
        return null;
    }

    /**
     * On charge en priorité depuis le buffer, puisque si le client demande des calculs on va les mettre en priorité ici, avant de calculer puis les remettre en attente d'insertion en base
     *  (dont en fait elles partent juste jamais)
     * @param request_limit nombre max de vars_datas à renvoyer
     */
    public async get_vars_to_compute_from_buffer_or_bdd(request_limit: number): Promise<{ [index: string]: VarDataBaseVO }> {

        let res: { [index: string]: VarDataBaseVO } = {};

        /**
         * On commence par collecter le max de datas depuis le buffer : Les conditions de sélection d'un var :
         *  - est-ce que la data a une valeur undefined ? oui => sélectionnée
         *  - est-ce que la data peut expirer et a expiré ? oui => sélectionnée
         */
        for (let i in this.vars_datas_buffer) {

            if (request_limit <= 0) {
                return res;
            }

            let var_data = this.vars_datas_buffer[i];

            if (!var_data.has_valid_value) {
                res[var_data.index] = var_data;
                request_limit--;
                continue;
            }
        }

        if (request_limit <= 0) {
            return res;
        }

        /**
         * Attention : à ce stade en base on va trouver des datas qui sont pas computed mais qu'on retrouve par exemple comme computed
         *  et valide (donc pas sélectionnées) dans le buffer d'attente de mise à jour en bdd. Donc on doit ignorer tous les ids
         *  des vars qui sont dans le buffer... (avantage ça concerne pas celles qui sont pas créées puisqu'il faut un id et la liste
         *  des ids reste relativement dense)...
         */
        let bdd_datas: { [index: string]: VarDataBaseVO } = await this.get_vars_to_compute_from_bdd(request_limit, Object.values(this.vars_datas_buffer).filter((data) => !!data.id).map((data) => data.id));
        for (let i in bdd_datas) {
            let bdd_data = bdd_datas[i];

            res[bdd_data.index] = bdd_data;
        }

        return res;
    }

    /**
     * TODO FIXME REFONTE VARS c'est à que la plus grosse opti doit se faire, et peut-etre via du machine learning par ce que pas évident de savoir quelle est la bonne strat
     *  Il faut à tout prix pouvoir monitorer la performance de cette fonction
     */
    private async get_vars_to_compute_from_bdd(request_limit: number, ignore_ids_list: number[]): Promise<{ [index: string]: VarDataBaseVO }> {
        let vars_datas: { [index: string]: VarDataBaseVO } = {};
        let nb_vars_datas: number = 0;

        // OPTI TODO : possible de regrouper les requetes d'une meme api_type_id, en préparant en amont les condition de la requête et en faisant pour tous les var_id en 1 fois
        for (let api_type_id in VarsServerController.getInstance().varcacheconf_by_api_type_ids) {

            if (request_limit <= nb_vars_datas) {
                return vars_datas;
            }

            let varcacheconf_by_var_ids = VarsServerController.getInstance().varcacheconf_by_api_type_ids[api_type_id];
            for (let var_id in varcacheconf_by_var_ids) {
                let varcacheconf: VarCacheConfVO = varcacheconf_by_var_ids[var_id];

                // On doit aller chercher toutes les varsdatas connues pour être cachables (on se fout du var_id à ce stade on veut juste des api_type_ids des varsdatas compatibles)
                //  Attention les données importées ne doivent pas être remises en question
                let vars_datas_tmp: VarDataBaseVO[] = [];
                if (!!varcacheconf.cache_timeout_ms) {
                    let timeout: Moment = moment().utc(true).add(-varcacheconf.cache_timeout_ms, 'ms');
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(api_type_id, ' where ' +
                        ' var_id = ' + varcacheconf.var_id +
                        ' and (value_ts is null or value_ts < ' + DateHandler.getInstance().getUnixForBDD(timeout) + ') ' +
                        ((ignore_ids_list && ignore_ids_list.length) ? ' and id not in $1' : '') +
                        ' and value_type != ' + VarDataBaseVO.VALUE_TYPE_COMPUTED +
                        ' limit ' + request_limit + ';', [ignore_ids_list]);
                } else {
                    vars_datas_tmp = await ModuleDAOServer.getInstance().selectAll<VarDataBaseVO>(api_type_id, ' where ' +
                        ' value_ts is null' +
                        ' and var_id = ' + varcacheconf.var_id +
                        ((ignore_ids_list && ignore_ids_list.length) ? ' and id not in $1' : '') +
                        ' and value_type != ' + VarDataBaseVO.VALUE_TYPE_COMPUTED +
                        ' limit ' + request_limit + ';', [ignore_ids_list]);
                }

                for (let vars_datas_tmp_i in vars_datas_tmp) {
                    if (nb_vars_datas >= request_limit) {
                        return vars_datas;
                    }

                    let var_data_tmp = vars_datas_tmp[vars_datas_tmp_i];

                    nb_vars_datas++;
                    vars_datas[var_data_tmp.index] = var_data_tmp;
                }
                if (nb_vars_datas >= request_limit) {
                    return vars_datas;
                }
            }
            if (nb_vars_datas >= request_limit) {
                return vars_datas;
            }
        }

        return vars_datas;
    }
}