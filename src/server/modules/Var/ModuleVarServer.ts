import { Duration, Moment } from 'moment';
import AccessPolicyGroupVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import APISimpleVOParamVO from '../../../shared/modules/DAO/vos/APISimpleVOParamVO';
import APISimpleVOsParamVO from '../../../shared/modules/DAO/vos/APISimpleVOsParamVO';
import NumRange from '../../../shared/modules/DataRender/vos/NumRange';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';

import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfIds from '../../../shared/modules/Var/vos/VarConfIds';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../shared/modules/Var/vos/VarDataValueResVO';

import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import StackContext from '../../StackContext';
import ModuleAccessPolicyServer from '../AccessPolicy/ModuleAccessPolicyServer';
import ModuleBGThreadServer from '../BGThread/ModuleBGThreadServer';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import DAOPostCreateTriggerHook from '../DAO/triggers/DAOPostCreateTriggerHook';
import DAOPostDeleteTriggerHook from '../DAO/triggers/DAOPostDeleteTriggerHook';
import DAOPostUpdateTriggerHook from '../DAO/triggers/DAOPostUpdateTriggerHook';
import DAOUpdateVOHolder from '../DAO/vos/DAOUpdateVOHolder';

import ForkedTasksController from '../Fork/ForkedTasksController';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import ModulesManagerServer from '../ModulesManagerServer';
import PushDataServerController from '../PushData/PushDataServerController';
import VarsdatasComputerBGThread from './bgthreads/VarsdatasComputerBGThread';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import VarCronWorkersHandler from './VarCronWorkersHandler';
import VarsDatasProxy from './VarsDatasProxy';
import VarsDatasVoUpdateHandler from './VarsDatasVoUpdateHandler';
import VarServerControllerBase from './VarServerControllerBase';
import VarsServerController from './VarsServerController';
import VarsTabsSubsController from './VarsTabsSubsController';

const moment = require('moment');

export default class ModuleVarServer extends ModuleServerBase {

    public static TASK_NAME_getSimpleVarDataCachedValueFromParam = ModuleVar.getInstance().name + '.getSimpleVarDataCachedValueFromParam';
    public static TASK_NAME_delete_varcacheconf_from_cache = ModuleVar.getInstance().name + '.delete_varcacheconf_from_cache';
    public static TASK_NAME_update_varcacheconf_from_cache = ModuleVar.getInstance().name + '.update_varcacheconf_from_cache';

    public static getInstance() {
        if (!ModuleVarServer.instance) {
            ModuleVarServer.instance = new ModuleVarServer();
        }
        return ModuleVarServer.instance;
    }

    private static instance: ModuleVarServer = null;



    private constructor() {
        super(ModuleVar.getInstance().name);
    }

    public async configure() {

        ModuleBGThreadServer.getInstance().registerBGThread(VarsdatasComputerBGThread.getInstance());

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Valeur' }, 'var.desc_mode.var_data.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Description' }, 'var.desc_mode.var_description.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Paramètres' }, 'var.desc_mode.var_params.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({ fr: 'Dépendances' }, 'var.desc_mode.var_deps.___LABEL___'));

        let postCTrigger: DAOPostCreateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostCreateTriggerHook.DAO_POST_CREATE_TRIGGER);
        let postUTrigger: DAOPostUpdateTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostUpdateTriggerHook.DAO_POST_UPDATE_TRIGGER);
        let postDTrigger: DAOPostDeleteTriggerHook = ModuleTrigger.getInstance().getTriggerHook(DAOPostDeleteTriggerHook.DAO_POST_DELETE_TRIGGER);

        // Trigger sur les varcacheconfs pour mettre à jour les confs en cache en même temps qu'on les modifie dans l'outil
        postCTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onCVarCacheConf);
        postUTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onUVarCacheConf);
        postDTrigger.registerHandler(VarCacheConfVO.API_TYPE_ID, this.onPostDVarCacheConf);

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Calculée'
        }, 'var_data.value_type.computed'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Importée'
        }, 'var_data.value_type.import'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Datasources'
        }, 'var.desc_mode.var_datasources.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Vider l\'arbre'
        }, 'var_desc.clearDag.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser la HeatMap des deps'
        }, 'var_desc.refreshDependenciesHeatmap.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Matroids calculés'
        }, 'var.desc_mode.computed_datas_matroids.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valeur totale des matroids chargés'
        }, 'var.desc_mode.loaded_datas_matroids_sum_value.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variable invalidée, calcul en cours...'
        }, 'var.desc_mode.update_var_data.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Invalidation impossible sur un import'
        }, 'var.desc_mode.update_var_data.not_allowed_on_imports.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Indicateurs - Objectif'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_objectif_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Indicateurs - Réalisé'
        }, 'fields.labels.ref.module_psa_primes_indicateur.___LABEL____var_realise_id'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Var conf cache'
        }, 'menu.menuelements.VarCacheConfVO.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Nombre de deps'
        }, 'var.desc_mode.dependencies_number.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Deps en % de l\'arbre'
        }, 'var.desc_mode.dependencies_tree_prct.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '% de vars enregistrées'
        }, 'var_desc_registrations.vardag_registered_prct.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: '% de vars enregistrées / var_id'
        }, 'var_desc_registrations.vardag_registered_prct_by_var_id.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Taille de l\'arbre'
        }, 'var_desc_registrations.vardag_size.___LABEL___'));


        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Import ?'
        }, 'var_desc.var_data_is_import.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Date màj : {last_update}'
        }, 'var_desc.var_data_last_update.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Explication du calcul'
        }, 'var_desc.explaination.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Markers'
        }, 'var.desc_mode.var_markers.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Actualiser le graph'
        }, 'var_desc.create_graph.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'StepByStep'
        }, 'var_desc.pause.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variable'
        }, 'var_desc.var_controller_label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Valeur non formatée'
        }, 'var_desc.var_data_label.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Source de données'
        }, 'var_desc.var_ds_label.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer le cache par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher les données exactes'
        }, 'vars_datas_explorer_actions.get_exact.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher les données incluses'
        }, 'vars_datas_explorer_actions.get_included.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Afficher les données intersectées'
        }, 'vars_datas_explorer_actions.get_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Invalider le cache par intersection'
        }, 'vars_datas_explorer_actions.invalidate_cache_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Supprimer le cache et les imports par intersection'
        }, 'vars_datas_explorer_actions.delete_cache_and_import_intersection.___LABEL___'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Variables'
        }, 'vars_datas_explorer_filters.vars_confs.___LABEL___'));

        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Performances'
        }, 'menu.menuelements.VarPerfVO.___LABEL___'));


        // ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, this.delete_varcacheconf_from_cache.bind(this));
        ForkedTasksController.getInstance().register_task(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, this.update_varcacheconf_from_cache.bind(this));

        ModuleServiceBase.getInstance().post_modules_installation_hooks.push(() => {

            /**
             * Ajout des triggers d'invalidation des données de cache en BDD
             *  - on part de la liste des vars qui ont un cache et des datasources
             */
            for (let api_type_id in VarsServerController.getInstance().registered_vars_controller_by_api_type_id) {

                postCTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo_cd);
                postUTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo_u);
                postDTrigger.registerHandler(api_type_id, this.invalidate_var_cache_from_vo_cd);
            }

            VarsServerController.getInstance().init_varcontrollers_dag();
        });
    }

    /**
     * Trigger qui gère l'invalidation des vars en fonction du vo passé en param
     *  On doit par ailleurs utiliser un buffer des invalidations pour pas tout invalider en boucle => exemple sur un import de 100 facture 1 jour,
     *      le CA du jour devrait être invalidé une fois
     * @param vo
     */
    public async invalidate_var_cache_from_vo_cd(vo: IDistantVOBase): Promise<void> {

        try {
            VarsDatasVoUpdateHandler.getInstance().register_vo_cud(vo);
            // BGThreadServerController.getInstance().executeBGThread(VarsdatasComputerBGThread.getInstance().name);
        } catch (error) {
            ConsoleHandler.getInstance().error('invalidate_var_cache_from_vo:type:' + vo._type + ':id:' + vo.id + ':' + vo + ':' + error);
        }
    }

    /**
     * Trigger qui gère l'invalidation des vars en fonction des vos passés en param
     *  On doit par ailleurs utiliser un buffer des invalidations pour pas tout invalider en boucle => exemple sur un import de 100 facture 1 jour,
     *      le CA du jour devrait être invalidé une fois
     * @param vo_update_handler
     */
    public async invalidate_var_cache_from_vo_u(vo_update_handler: DAOUpdateVOHolder<IDistantVOBase>): Promise<void> {

        try {
            VarsDatasVoUpdateHandler.getInstance().register_vo_cud(vo_update_handler);
            // BGThreadServerController.getInstance().executeBGThread(VarsdatasComputerBGThread.getInstance().name);
        } catch (error) {
            ConsoleHandler.getInstance().error('invalidate_var_cache_from_vo:type:' + vo_update_handler.post_update_vo._type + ':id:' + vo_update_handler.post_update_vo.id + ':' + vo_update_handler.post_update_vo + ':' + error);
        }
    }

    // public async invalidate_var_cache_from_vo(vo: IDistantVOBase): Promise<void> {

    //     try {

    //         let to_check_interceptors_by_var_ids: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};
    //         for (let ds_name in VarsServerController.getInstance().cached_var_id_by_datasource_by_api_type_id[vo._type]) {

    //             // Pour chaque DS on doit demander les intercepteurs, sans filtre
    //             //  ensuite on va remonter les deps parents sur chaque var_id des intersecteurs, et on remonte jusqu'en haut des deps
    //             //  quand on a tout checké, on peut invalider en base les var_id qui sont effectivement en cache, les autres osef c'est côté client qu'il faut les invalider

    //             // Pour l'instant on ne sait faire ça que sur des DS matroids
    //             let ds: DataSourceControllerBase<any> = DataSourcesController.getInstance().registeredDataSourcesController[ds_name] as DataSourceControllerBase<any>;
    //             let interceptors_by_var_ids: { [var_id: number]: { [index: string]: VarDataBaseVO } } = ds.get_param_intersectors_from_vo_update_by_var_id(vo);

    //             for (let interceptors_by_var_idi in interceptors_by_var_ids) {
    //                 let interceptors = interceptors_by_var_ids[interceptors_by_var_idi];

    //                 for (let interceptori in interceptors) {
    //                     let interceptor = interceptors[interceptori];

    //                     if (!to_check_interceptors_by_var_ids[interceptor.var_id]) {
    //                         to_check_interceptors_by_var_ids[interceptor.var_id] = {};
    //                     }
    //                     to_check_interceptors_by_var_ids[interceptor.var_id][interceptor.index] = interceptor;
    //                 }
    //             }
    //         }

    //         let checked_interceptors_by_var_ids: { [var_id: number]: { [index: string]: VarDataBaseVO } } = {};

    //         while (ObjectHandler.getInstance().hasAtLeastOneAttribute(to_check_interceptors_by_var_ids)) {
    //             let var_id: number = parseInt(ObjectHandler.getInstance().getFirstAttributeName(to_check_interceptors_by_var_ids));
    //             let interceptors: { [index: string]: VarDataBaseVO } = to_check_interceptors_by_var_ids[var_id];
    //             let controller = VarsServerController.getInstance().getVarControllerById(var_id);

    //             while (ObjectHandler.getInstance().hasAtLeastOneAttribute(interceptors)) {
    //                 let index: string = ObjectHandler.getInstance().getFirstAttributeName(interceptors);
    //                 let interceptor = interceptors[index];

    //                 // On récupère les deps parents, qu'on ajoute à check
    //                 let deps_parents: VarDataBaseVO[] = controller.getParamDependents(interceptor);

    //                 for (let deps_parenti in deps_parents) {
    //                     let dep_parent = deps_parents[deps_parenti];

    //                     if (!to_check_interceptors_by_var_ids[dep_parent.var_id]) {
    //                         to_check_interceptors_by_var_ids[dep_parent.var_id] = {};
    //                     }
    //                     to_check_interceptors_by_var_ids[dep_parent.var_id][dep_parent.index] = dep_parent;
    //                 }

    //                 // On supprime ce param des params à check
    //                 delete to_check_interceptors_by_var_ids[var_id][index];

    //                 // On ajout ce param dans les params checked
    //                 if (!checked_interceptors_by_var_ids[var_id]) {
    //                     checked_interceptors_by_var_ids[var_id] = {};
    //                 }
    //                 checked_interceptors_by_var_ids[var_id][index] = interceptor;
    //             }
    //         }

    //         // on a tous les intercepteurs on doit s'intéresser à ceux qui sont en base et aller invalider
    //         for (let cached_var_by_var_idi in VarsServerController.getInstance().cached_var_by_var_id) {
    //             let cached_var = VarsServerController.getInstance().cached_var_by_var_id[cached_var_by_var_idi];
    //             let moduletable_vardata: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[cached_var.varConf.var_data_vo_type];

    //             if (!checked_interceptors_by_var_ids[cached_var_by_var_idi]) {
    //                 continue;
    //             }

    //             let checked_interceptors = checked_interceptors_by_var_ids[cached_var_by_var_idi];
    //             for (let checked_interceptori in checked_interceptors) {
    //                 let checked_interceptor = checked_interceptors[checked_interceptori];

    //                 let moduletable_interceptor: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[checked_interceptor._type];

    //                 let needs_mapping: boolean = moduletable_vardata.vo_type != moduletable_interceptor.vo_type;
    //                 let mappings: { [field_id_a: string]: string } = moduletable_interceptor.mapping_by_api_type_ids[moduletable_vardata.vo_type];

    //                 if (needs_mapping && (typeof mappings === 'undefined')) {
    //                     throw new Error('Mapping missing:from:' + checked_interceptor._type + ":to:" + moduletable_vardata.vo_type + ":");
    //                 }

    //                 //En mettant null on dit qu'on veut pas mapper, donc on veut tout invalider
    //                 //  par exemple en cas de modif(undefined pas de mapping, null mapping impossible donc dans le doute on invalide tout)
    //                 if (needs_mapping && !mappings) {

    //                     await this.invalider_tout(moduletable_vardata);

    //                 } else {

    //                     if (moduletable_vardata.is_segmented) {

    //                         // Si segmenté, on cherche le segment et on fait une requête par segment
    //                         let moduletable_vardata_segment_field_name: string = moduletable_vardata.table_segmented_field.field_id;

    //                         // On prend l'équivalent dans le matroid
    //                         let mapping_intersector_to_vardata: { [field_id_a: string]: string; } = moduletable_interceptor.mapping_by_api_type_ids[moduletable_vardata.vo_type];
    //                         let intersector_segment_field_name: string = moduletable_vardata_segment_field_name;
    //                         for (let field_a in mapping_intersector_to_vardata) {
    //                             let field_b = mapping_intersector_to_vardata[field_a];

    //                             if (field_b == moduletable_vardata_segment_field_name) {
    //                                 intersector_segment_field_name = field_a;
    //                             }
    //                         }

    //                         // et on foreach sur le champ de l'intersector qui est segmenté
    //                         await RangeHandler.getInstance().foreach_ranges(checked_interceptor[intersector_segment_field_name], async (segment: number | Duration | Moment) => {

    //                             // On enlève le filtrage sur le champ segmenté, inutile
    //                             let segment_interceptor = Object.assign({}, checked_interceptor);
    //                             delete segment_interceptor[intersector_segment_field_name];

    //                             let request: string = 'update ' + moduletable_vardata.get_segmented_full_name(segment) + ' t set value_ts=null where ' +
    //                                 ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(
    //                                     moduletable_vardata.vo_type,
    //                                     checked_interceptor,
    //                                     mappings
    //                                 ) + ';';
    //                             await ModuleServiceBase.getInstance().db.query(request);
    //                         }, moduletable_vardata.table_segmented_field_segment_type);
    //                     } else {
    //                         let request: string = 'update ' + moduletable_vardata.full_name + ' t set value_ts=null where ' +
    //                             ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(
    //                                 moduletable_vardata.vo_type,
    //                                 checked_interceptor,
    //                                 mappings
    //                             ) + ';';
    //                         await ModuleServiceBase.getInstance().db.query(request);
    //                     }
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         ConsoleHandler.getInstance().error('invalidate_var_cache_from_vo:type:' + vo._type + ':id:' + vo.id + vo + ':' + error);
    //     }
    //     return true;
    // }

    // public async invalider_tout(moduletable_vardata: ModuleTable<VarDataBaseVO>) {
    //     if (moduletable_vardata.is_segmented) {

    //         let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

    //         await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number | Duration | Moment) => {
    //             let request: string = 'update ' + moduletable_vardata.get_segmented_full_name(segment) + ' t set value_ts=null;';
    //             await ModuleServiceBase.getInstance().db.query(request);
    //         }, moduletable_vardata.table_segmented_field_segment_type);

    //     } else {
    //         let request: string = 'update ' + moduletable_vardata.full_name + ' t set value_ts=null;';
    //         await ModuleServiceBase.getInstance().db.query(request);
    //     }
    // }

    public async invalidate_cache_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let moduletable_vardata = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
            let query: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(vo._type, vo, null);

            if (moduletable_vardata.is_segmented) {

                let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

                await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number | Duration | Moment) => {
                    let request: string = 'update ' + moduletable_vardata.get_segmented_full_name(segment) + ' t set value=null, value_ts=null where ' +
                        query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
                    await ModuleServiceBase.getInstance().db.query(request);
                }, moduletable_vardata.table_segmented_field_segment_type);

            } else {
                let request: string = 'update ' + moduletable_vardata.full_name + ' t set value=null, value_ts=null where ' +
                    query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
                await ModuleServiceBase.getInstance().db.query(request);
            }
        }
    }

    public async delete_cache_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let moduletable_vardata = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
            let query: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(vo._type, vo, null);

            if (moduletable_vardata.is_segmented) {

                let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

                await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number | Duration | Moment) => {
                    let request: string = 'delete from ' + moduletable_vardata.get_segmented_full_name(segment) + ' t where ' +
                        query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
                    await ModuleServiceBase.getInstance().db.query(request);
                }, moduletable_vardata.table_segmented_field_segment_type);

            } else {
                let request: string = 'delete from ' + moduletable_vardata.full_name + ' t where ' +
                    query + ' and value_type=' + VarDataBaseVO.VALUE_TYPE_COMPUTED + ';';
                await ModuleServiceBase.getInstance().db.query(request);
            }
        }
    }

    public async delete_cache_and_imports_intersection(vos: VarDataBaseVO[]) {

        if ((!vos) || (!vos.length)) {
            return;
        }

        for (let i in vos) {
            let vo = vos[i];

            if (!vo.check_param_is_valid(vo._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            let moduletable_vardata = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];
            let query: string = ModuleDAOServer.getInstance().getWhereClauseForFilterByMatroidIntersection(vo._type, vo, null);

            if (moduletable_vardata.is_segmented) {

                let ranges: NumRange[] = ModuleDAOServer.getInstance().get_all_ranges_from_segmented_table(moduletable_vardata);

                await RangeHandler.getInstance().foreach_ranges(ranges, async (segment: number | Duration | Moment) => {
                    let request: string = 'delete from ' + moduletable_vardata.get_segmented_full_name(segment) + ' t where ' +
                        query + ';';
                    await ModuleServiceBase.getInstance().db.query(request);
                }, moduletable_vardata.table_segmented_field_segment_type);

            } else {
                let request: string = 'delete from ' + moduletable_vardata.full_name + ' t where ' +
                    query + ';';
                await ModuleServiceBase.getInstance().db.query(request);
            }
        }
    }

    public registerServerApiHandlers() {
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_INVALIDATE_MATROID, this.invalidate_matroid.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_register_matroid_for_precalc, this.register_matroid_for_precalc.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getSimpleVarDataValueSumFilterByMatroids, this.getSimpleVarDataValueSumFilterByMatroids.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getSimpleVarDataCachedValueFromParam, this.getSimpleVarDataCachedValueFromParam.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_configureVarCache, this.configureVarCache.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_register_params, this.register_params.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_unregister_params, this.unregister_params.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_get_var_id_by_names, this.get_var_id_by_names.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarControllerVarsDeps, this.getVarControllerVarsDeps.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarControllerDSDeps, this.getVarControllerDSDeps.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getParamDependencies, this.getParamDependencies.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_getVarParamDatas, this.getVarParamDatas.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_invalidate_cache_intersection, this.invalidate_cache_intersection.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_delete_cache_intersection, this.delete_cache_intersection.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleVar.APINAME_delete_cache_and_imports_intersection, this.delete_cache_and_imports_intersection.bind(this));
    }
    public registerCrons(): void {
        VarCronWorkersHandler.getInstance();
    }

    /**
     * On définit les droits d'accès du module
     */
    public async registerAccessPolicies(): Promise<void> {
        let group: AccessPolicyGroupVO = new AccessPolicyGroupVO();
        group.translatable_name = ModuleVar.POLICY_GROUP;
        group = await ModuleAccessPolicyServer.getInstance().registerPolicyGroup(group, new DefaultTranslation({
            fr: 'Variables'
        }));

        let POLICY_FO_ACCESS: AccessPolicyVO = new AccessPolicyVO();
        POLICY_FO_ACCESS.group_id = group.id;
        POLICY_FO_ACCESS.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        POLICY_FO_ACCESS.translatable_name = ModuleVar.POLICY_FO_ACCESS;
        POLICY_FO_ACCESS = await ModuleAccessPolicyServer.getInstance().registerPolicy(POLICY_FO_ACCESS, new DefaultTranslation({
            fr: 'Accès aux Variables sur le front'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let desc_mode_access: AccessPolicyVO = new AccessPolicyVO();
        desc_mode_access.group_id = group.id;
        desc_mode_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        desc_mode_access.translatable_name = ModuleVar.POLICY_DESC_MODE_ACCESS;
        desc_mode_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(desc_mode_access, new DefaultTranslation({
            fr: 'Accès au "Mode description"'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_access: AccessPolicyVO = new AccessPolicyVO();
        bo_access.group_id = group.id;
        bo_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_access.translatable_name = ModuleVar.POLICY_BO_ACCESS;
        bo_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_access, new DefaultTranslation({
            fr: 'Administration des vars'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));

        let bo_varconf_access: AccessPolicyVO = new AccessPolicyVO();
        bo_varconf_access.group_id = group.id;
        bo_varconf_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_varconf_access.translatable_name = ModuleVar.POLICY_BO_VARCONF_ACCESS;
        bo_varconf_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_varconf_access, new DefaultTranslation({
            fr: 'Configuration des types de vars'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        let access_dependency: PolicyDependencyVO = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = bo_varconf_access.id;
        access_dependency.depends_on_pol_id = bo_access.id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);


        let bo_imported_access: AccessPolicyVO = new AccessPolicyVO();
        bo_imported_access.group_id = group.id;
        bo_imported_access.default_behaviour = AccessPolicyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED_TO_ALL_BUT_ADMIN;
        bo_imported_access.translatable_name = ModuleVar.POLICY_BO_IMPORTED_ACCESS;
        bo_imported_access = await ModuleAccessPolicyServer.getInstance().registerPolicy(bo_imported_access, new DefaultTranslation({
            fr: 'Configuration des données importées'
        }), await ModulesManagerServer.getInstance().getModuleVOByName(this.name));
        access_dependency = new PolicyDependencyVO();
        access_dependency.default_behaviour = PolicyDependencyVO.DEFAULT_BEHAVIOUR_ACCESS_DENIED;
        access_dependency.src_pol_id = bo_imported_access.id;
        access_dependency.depends_on_pol_id = bo_access.id;
        access_dependency = await ModuleAccessPolicyServer.getInstance().registerPolicyDependency(access_dependency);
    }

    public async get_var_data_or_ask_to_bgthread(param: VarDataBaseVO): Promise<VarDataBaseVO> {

        // TODO FIXME OPTI - ou pas ... - on peut aller demander aussi aux vars en attente de maj en bdd - mais une perte de perf légère tout le temps pour un gain très ponctuel mais probablement élevé
        let varsdata: VarDataBaseVO[] = await ModuleDAO.getInstance().getVosByExactMatroids<VarDataBaseVO, VarDataBaseVO>(param._type, [param as any], {});

        // Si on a plus de 1 vardata il faut supprimer les plus anciens et logger un pb
        let vardata: VarDataBaseVO = null;

        if (varsdata && (varsdata.length > 1)) {
            ConsoleHandler.getInstance().error('get_var_data_or_ask_to_bgthread:On ne devrait trouver qu\'une var de cet index :' + param.index + ':on en trouve:' + varsdata.length + ':Suppression auto des plus anciennes...');

            let maxid = 0;
            let maxi = 0;
            for (let i in varsdata) {
                let tmp = varsdata[i];
                if (maxid < tmp.id) {
                    maxid = tmp.id;
                    maxi = parseInt(i.toString());
                    vardata = tmp;
                }
            }

            varsdata.splice(maxi, 1);
            await ModuleDAO.getInstance().deleteVOs(varsdata);
        }

        vardata = vardata ? vardata : ((varsdata && (varsdata.length == 1)) ? varsdata[0] : null);

        if (!vardata) {

            // On a rien en base, on le crée et on attend le résultat
            param.value_ts = null;
            param.value = null;
            param.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;

            // On push dans le buffer de mise à jour de la BDD
            VarsDatasProxy.getInstance().prepend_var_datas([param]);
            return null;
        } else {

            if (!!vardata.value_ts) {
                return vardata;
            }
        }

        return null;
    }

    private async onCVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vcc);
    }

    private async onUVarCacheConf(vo_update_handler: DAOUpdateVOHolder<VarCacheConfVO>) {
        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_update_varcacheconf_from_cache, vo_update_handler.post_update_vo);
    }

    private update_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        VarsServerController.getInstance().varcacheconf_by_var_ids[vcc.var_id] = vcc;
        if (!VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type]) {
            VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type] = {};
        }
        VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id] = vcc;
    }

    private delete_varcacheconf_from_cache(vcc: VarCacheConfVO) {
        delete VarsServerController.getInstance().varcacheconf_by_var_ids[vcc.var_id];

        if ((!!VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type]) &&
            (!!VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id])) {
            delete VarsServerController.getInstance().varcacheconf_by_api_type_ids[VarsServerController.getInstance().getVarConfById(vcc.var_id).var_data_vo_type][vcc.var_id];
        }
    }

    private async onPostDVarCacheConf(vcc: VarCacheConfVO) {
        if (!vcc) {
            return;
        }

        await ForkedTasksController.getInstance().broadexec(ModuleVarServer.TASK_NAME_delete_varcacheconf_from_cache, vcc);
    }

    private async get_var_id_by_names(): Promise<VarConfIds> {
        let res: VarConfIds = new VarConfIds();
        let var_confs: VarConfVO[] = await ModuleDAO.getInstance().getVos<VarConfVO>(VarConfVO.API_TYPE_ID);
        res.var_id_by_names = {};

        for (let i in var_confs) {
            let var_conf = var_confs[i];

            res.var_id_by_names[var_conf.name] = var_conf.id;
        }

        return res;
    }

    /**
     * Fonction qui demande l'abonnement d'un socket (celui par lequel arrive la demande) sur la mise à jour des
     *  valeurs des vardatas correspondants aux params. Et si on a déjà une valeur à fournir, alors on l'envoie directement
     * @param api_param
     */
    private async register_params(api_param: APISimpleVOsParamVO): Promise<void> {

        if (!api_param) {
            return;
        }

        let params: VarDataBaseVO[] = api_param.vos as VarDataBaseVO[];
        let uid = StackContext.getInstance().get('UID');
        let client_tab_id = StackContext.getInstance().get('CLIENT_TAB_ID');

        VarsTabsSubsController.getInstance().register_sub(uid, client_tab_id, params ? params.map((param) => param.index) : []);

        /**
         * Si on trouve des datas existantes et valides en base, on les envoie, sinon on indique qu'on attend ces valeurs
         */
        let promises = [];

        let vars_to_notif: VarDataValueResVO[] = [];
        let needs_var_computation: boolean = false;
        for (let i in params) {
            let param = params[i];

            if (!param.check_param_is_valid(param._type)) {
                ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
                continue;
            }

            promises.push((async () => {

                let in_db_data: VarDataBaseVO = await ModuleVarServer.getInstance().get_var_data_or_ask_to_bgthread(param);
                if (!in_db_data) {
                    needs_var_computation = true;
                    return;
                }

                vars_to_notif.push(new VarDataValueResVO().set_from_vardata(in_db_data));
            })());
        }

        await Promise.all(promises);

        // if (needs_var_computation) {
        //     BGThreadServerController.getInstance().executeBGThread(VarsdatasComputerBGThread.getInstance().name);
        // }

        if (vars_to_notif && vars_to_notif.length) {
            await PushDataServerController.getInstance().notifyVarsDatas(uid, client_tab_id, vars_to_notif);
        }
    }

    /**
     * Fonction qui demande la suppression de l'abonnement d'un socket (celui par lequel arrive la demande) sur la mise à jour des
     *  valeurs des vardatas correspondants aux params. Donc on les supprime de l'abonnement et c'est tout
     * @param api_param
     */
    private async unregister_params(api_param: APISimpleVOsParamVO): Promise<void> {

        if (!api_param) {
            return;
        }

        let uid = StackContext.getInstance().get('UID');
        let client_tab_id = StackContext.getInstance().get('CLIENT_TAB_ID');
        VarsTabsSubsController.getInstance().unregister_sub(uid, client_tab_id, api_param.vos ? (api_param.vos as VarDataBaseVO[]).map((param) => param.check_param_is_valid(param._type) ? param.index : null) : []);
    }

    private async getVarControllerDSDeps(params: StringParamVO): Promise<string[]> {
        if ((!params) || (!params.text) || (!VarsController.getInstance().var_conf_by_name[params.text])) {
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[params.text];

        let res: string[] = [];
        let deps: DataSourceControllerBase[] = var_controller.getDataSourcesDependencies();

        for (let i in deps) {
            res.push(deps[i].name);
        }
        return res;
    }


    private async getVarControllerVarsDeps(params: StringParamVO): Promise<{ [dep_name: string]: string }> {
        if ((!params) || (!params.text) || (!VarsController.getInstance().var_conf_by_name[params.text])) {
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[params.text];

        let res: { [dep_name: string]: string } = {};
        let deps: { [dep_name: string]: VarServerControllerBase<any> } = var_controller.getVarControllerDependencies();

        for (let i in deps) {
            res[i] = deps[i].varConf.name;
        }
        return res;
    }

    private async getParamDependencies(params: APISimpleVOParamVO): Promise<{ [dep_id: string]: VarDataBaseVO }> {
        if ((!params) || (!params.vo) || (!params.vo._type)) {
            return null;
        }

        let param: VarDataBaseVO = params.vo as VarDataBaseVO;

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[VarsController.getInstance().var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        return var_controller.UT__getParamDependencies(params.vo, await this.getVarParamDatas(params));
    }

    private async getVarParamDatas(params: APISimpleVOParamVO): Promise<{ [ds_name: string]: string }> {
        if ((!params) || (!params.vo) || (!params.vo._type)) {
            return null;
        }

        /**
         * On limite à 10k caractères par ds et si on dépasse on revoie '[... >10k ...]' pour indiquer qu'on
         *  a filtré et garder un json valide
         */
        let value_size_limit: number = 10000;

        let param: VarDataBaseVO = params.vo as VarDataBaseVO;

        if (!param.check_param_is_valid(param._type)) {
            ConsoleHandler.getInstance().error('Les champs du matroid ne correspondent pas à son typage');
            return null;
        }

        let var_controller = VarsServerController.getInstance().registered_vars_controller_[VarsController.getInstance().var_conf_by_id[param.var_id].name];

        if (!var_controller) {
            return null;
        }

        let datasources_values: { [ds_name: string]: any; } = {};
        let datasources_deps: DataSourceControllerBase[] = var_controller.getDataSourcesDependencies();

        // WARNING on se base sur un fake node par ce que je vois pas comment faire autrement...
        let dag: DAG<VarDAGNode> = new DAG();
        let varDAGNode: VarDAGNode = VarDAGNode.getInstance(dag, param);

        for (let i in datasources_deps) {
            let datasource_dep = datasources_deps[i];

            let cache = {};
            await datasource_dep.get_data(param, cache);
            await datasource_dep.load_node_data(varDAGNode, cache);
            let data = varDAGNode.datasources[datasource_dep.name];

            let data_jsoned: string = null;
            try {
                data_jsoned = JSON.stringify(data);
            } catch (error) {
                ConsoleHandler.getInstance().error('getVarParamDatas:failed JSON:' + error);
            }

            if ((!data_jsoned) || (!data_jsoned.length)) {
                continue;
            }
            if (data_jsoned.length > value_size_limit) {
                datasources_values[datasource_dep.name] = "[... >10ko ...]";
            } else {
                datasources_values[datasource_dep.name] = data_jsoned;
            }
        }
        return datasources_values;
    }
}