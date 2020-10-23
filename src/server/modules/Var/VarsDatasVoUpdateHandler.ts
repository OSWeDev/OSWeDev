import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../shared/modules/Matroid/MatroidController';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import DateHandler from '../../../shared/tools/DateHandler';
import ObjectHandler from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import VarsDatasProxy from './VarsDatasProxy';
import VarServerControllerBase from './VarServerControllerBase';
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

        let intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] } = {};

        let ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> } = [];

        limit = this.prepare_updates(limit, vos_update_buffer, vos_create_or_delete_buffer, vo_types);

        this.init_leaf_intersectors(vo_types, intersectors_by_var_id, vos_update_buffer, vos_create_or_delete_buffer, ctrls_to_update_1st_stage);

        /**
         * ALGO en photo... TODO FIXME a remettre au propre
         */
        let markers: { [var_id: number]: number } = {};
        await this.init_markers(ctrls_to_update_1st_stage, markers);
        await this.compute_intersectors(ctrls_to_update_1st_stage, markers, intersectors_by_var_id);

        /**
         * Une fois qu'on a tous les intercepteurs à appliquer, on charge tous les var_data correspondant de la base
         *  et on les enfilent dans le buffer de calcul / mise à jour des var_datas
         */
        this.find_invalid_datas_and_push_for_update(intersectors_by_var_id);

        return limit;
    }

    /**
     * Recherche en BDD par intersection des var_datas qui correspondent aux intersecteurs, et on push les invalidations dans le buffer de vars
     * @param intersectors_by_var_id
     */
    private async find_invalid_datas_and_push_for_update(intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] }) {
        for (let var_id_s in intersectors_by_var_id) {
            let intersectors = intersectors_by_var_id[var_id_s];

            if ((!intersectors) || (!intersectors.length)) {
                continue;
            }

            let sample_inter = intersectors[0];

            let var_datas: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroidsIntersections(sample_inter._type, intersectors, null);

            /**
             * Tout sauf les imports
             */
            var_datas = var_datas.filter((vd: VarDataBaseVO) => vd.value_type != VarDataBaseVO.VALUE_TYPE_IMPORT);

            if (var_datas && var_datas.length) {
                var_datas.forEach((vd: VarDataBaseVO) => {
                    delete vd.value;
                    vd.value_ts = null;
                });
            }

            VarsDatasProxy.getInstance().append_var_datas(var_datas);
        }
    }

    private async compute_intersectors(
        ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> },
        markers: { [var_id: number]: number },
        intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] }) {

        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(ctrls_to_update_1st_stage)) {

            for (let i in ctrls_to_update_1st_stage) {
                let ctrl = ctrls_to_update_1st_stage[i];

                if (markers[ctrl.varConf.id] != 1) {
                    continue;
                }

                let Nx = VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, ctrl);

                await this.compute_deps_intersectors_and_union(Nx, intersectors_by_var_id);
                let self = this;

                await DAGController.getInstance().visit_bottom_up_from_node(Nx, async (Ny: VarCtrlDAGNode) => {
                    markers[Ny.var_controller.varConf.id]--;

                    if (!markers[Ny.var_controller.varConf.id]) {
                        await self.compute_deps_intersectors_and_union(Ny, intersectors_by_var_id);
                    }
                });

                delete ctrls_to_update_1st_stage[i];
                break;
            }
        }
    }

    private async compute_deps_intersectors_and_union(
        Nx: VarCtrlDAGNode,
        intersectors_by_var_id: { [var_id: number]: VarDataBaseVO[] }
    ) {
        let intersectors = intersectors_by_var_id[Nx.var_controller.varConf.id];
        intersectors = intersectors ? intersectors : [];

        for (let j in Nx.outgoing_deps) {
            let dep = Nx.outgoing_deps[j];

            intersectors = intersectors.concat(await Nx.var_controller.get_invalid_params_intersectors_from_dep(dep.dep_name, intersectors_by_var_id[dep.outgoing_node.var_controller.varConf.id]));
        }

        intersectors_by_var_id[Nx.var_controller.varConf.id] = MatroidController.getInstance().union(intersectors);
    }

    private async init_markers(ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> }, markers: { [var_id: number]: number }) {
        for (let i in ctrls_to_update_1st_stage) {
            let ctrl = ctrls_to_update_1st_stage[i];

            await DAGController.getInstance().visit_bottom_up_from_node(
                VarCtrlDAGNode.getInstance(VarsServerController.getInstance().varcontrollers_dag, ctrl),
                async (node) => {
                    if (!markers[node.var_controller.varConf.id]) {
                        markers[node.var_controller.varConf.id] = 0;
                    }
                    markers[node.var_controller.varConf.id]++;
                });
        }
    }

    /**
     * Pour chaque vo_type, on prend tous les varcontrollers concernés et on demande les intersecteurs en CD et en U
     *  On combinera les intersecteurs en CD et U via une union quand on aura validé qu'on a pas une autre variable qui pourrait impacter celle-ci
     */
    private init_leaf_intersectors(
        vo_types: string[],
        intersectors_by_var_id: { [var_id: string]: VarDataBaseVO[] },
        vos_update_buffer: { [vo_type: string]: Array<DAOUpdateVOHolder<IDistantVOBase>> },
        vos_create_or_delete_buffer: { [vo_type: string]: IDistantVOBase[] },
        ctrls_to_update_1st_stage: { [var_id: number]: VarServerControllerBase<VarDataBaseVO> }) {

        for (let i in vo_types) {
            let vo_type = vo_types[i];

            for (let j in VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type]) {
                let var_controller = VarsServerController.getInstance().registered_vars_controller_by_api_type_id[vo_type][j];

                ctrls_to_update_1st_stage[vo_type] = var_controller;

                if (!intersectors_by_var_id[vo_type]) {
                    intersectors_by_var_id[vo_type] = [];
                }

                for (let k in vos_create_or_delete_buffer[vo_type]) {
                    let vo_create_or_delete = vos_create_or_delete_buffer[vo_type][k];

                    intersectors_by_var_id[vo_type] = intersectors_by_var_id[vo_type].concat(var_controller.get_invalid_params_intersectors_on_POST_C_POST_D(vo_create_or_delete));
                }

                for (let k in vos_update_buffer[vo_type]) {
                    let vo_update_buffer = vos_update_buffer[vo_type][k];

                    intersectors_by_var_id[vo_type] = intersectors_by_var_id[vo_type].concat(var_controller.get_invalid_params_intersectors_on_POST_U(vo_update_buffer));
                }
            }
        }
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