// import VarsController from '../../../../shared/modules/Var/VarsController';
// import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
// import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
// import ICronWorker from '../../Cron/interfaces/ICronWorker';
// import ObjectHandler from '../../../../shared/tools/ObjectHandler';

// export default class CacheableinfoCronWorker implements ICronWorker {

//     public static getInstance() {
//         if (!CacheableinfoCronWorker.instance) {
//             CacheableinfoCronWorker.instance = new CacheableinfoCronWorker();
//         }
//         return CacheableinfoCronWorker.instance;
//     }

//     private static instance: CacheableinfoCronWorker = null;

//     private constructor() {
//     }

//     get worker_uid(): string {
//         return "CacheableinfoCronWorker";
//     }

//     /**
//      * On définit une var cacheable par :
//      *  - Matroid
//      *  - A des DS (donc plusieurs DS)
//      *  - Ne dépend pas d'une var en cache => pour éviter d'avoir à impacter des caches entre eux
//      *  - Idem, aucune var en cache ne dépend de cette var
//      *  - n'a pas d'import (can load precompiled false)
//      */
//     public async work() {

//         for (let i in VarsController.getInstance().registered_vars_controller) {
//             let controller = VarsController.getInstance().registered_vars_controller[i];

//             if (!!VarsController.getInstance().cached_var_by_var_id[controller.varConf.id]) {
//                 continue;
//             }

//             if (!VOsTypesManager.getInstance().moduleTables_by_voType[controller.varConf.var_data_vo_type].isMatroidTable) {
//                 continue;
//             }

//             let dss = controller.getDataSourcesDependencies();
//             if ((!dss) || (dss.length <= 1)) {
//                 continue;
//             }

//             if (controller.can_load_precompiled_or_imported_datas_client_side || controller.can_load_precompiled_or_imported_datas_server_side) {
//                 continue;
//             }

//             let deps_ids: number[] = controller.getVarsIdsDependencies();

//             /**
//              * FIXME TODO Pour le moment si une var caché a des deps, il ya un trou dans les triggers d'invalidation en base
//              */
//             if (deps_ids && deps_ids.length) {
//                 continue;
//             }

//             let refuse: boolean = false;
//             // while ((!refuse) && deps_ids && deps_ids.length) {

//             //     let new_deps_ids: number[] = [];

//             //     for (let j in deps_ids) {
//             //         let dep = VarsController.getInstance().getVarControllerById(deps_ids[j]);

//             //         if (!!VarsController.getInstance().cached_var_by_var_id[dep.varConf.id]) {
//             //             refuse = true;
//             //             break;
//             //         }

//             //         let dep_deps = dep.getVarsIdsDependencies();
//             //         if (dep_deps && dep_deps.length) {
//             //             new_deps_ids.concat(dep_deps);
//             //         }
//             //     }

//             //     deps_ids = new_deps_ids;
//             // }

//             // if (refuse) {
//             //     continue;
//             // }

//             let parents_ids = VarsController.getInstance().parent_vars_by_var_id[controller.varConf.id];
//             refuse = false;
//             while ((!refuse) && parents_ids && ObjectHandler.getInstance().hasAtLeastOneAttribute(parents_ids)) {

//                 let new_parents_ids: { [parent_id: number]: VarControllerBase<any> } = {};

//                 for (let j in parents_ids) {
//                     let dep = parents_ids[j];

//                     if (!!VarsController.getInstance().cached_var_by_var_id[dep.varConf.id]) {
//                         refuse = true;
//                         break;
//                     }

//                     let dep_deps = VarsController.getInstance().parent_vars_by_var_id[dep.varConf.id];
//                     if (dep_deps && ObjectHandler.getInstance().hasAtLeastOneAttribute(dep_deps)) {

//                         for (let k in dep_deps) {
//                             let dep_dep = dep_deps[k];

//                             new_parents_ids[dep_dep.varConf.id] = dep_dep;
//                         }
//                     }
//                 }

//                 parents_ids = new_parents_ids;
//             }

//             if (refuse) {
//                 continue;
//             }


//             ConsoleHandler.getInstance().log('CacheableinfoCronWorker:var_id:' + controller.varConf.id + ':name:' + controller.varConf.name + ':');
//         }
//     }
// }