// A voir si c'est utile de continuer d'adapter ce manager, on l'utilise en composant a priori pour le moment import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
// import { RouteConfig } from 'vue-router';
// import CRUDComponent from '../../components/crud/component/CRUDComponent';
// import MenuBranch from '../../components/menu/vos/MenuBranch';
// import MenuElementBase from '../../components/menu/vos/MenuElementBase';
// import MenuPointer from '../../components/menu/vos/MenuPointer';
// import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
// import CRUDHandler from '../../../../shared/tools/CRUDHandler';
// import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
// import DataImportHandler from '../../../../shared/tools/DataImportHandler';

// export default class DataImportComponentManager {

//     public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
//         "__data_import__",
//         MenuElementBase.PRIORITY_HIGH,
//         "fa-upload",
//         []
//     );

//     public static getInstance() {

//         if (!DataImportComponentManager.instance) {
//             DataImportComponentManager.instance = new DataImportComponentManager();
//         }
//         return DataImportComponentManager.instance;
//     }

//     private static instance: DataImportComponentManager;

//     public registerDataImport<T extends IDistantVOBase>(
//         API_TYPE_IDs: string[],
//         menuPointer: MenuPointer,
//         routes: RouteConfig[],
//         read_query: any = null) {

//         let url: string = DataImportHandler.getDATAIMPORTLink(API_TYPE_IDs);
//         let route_name: string = 'Import_' + API_TYPE_IDs.join('_');

//         if (!crud) {
//             crud = CRUD.getNewCRUD(API_TYPE_ID);
//         }

//         DataImportComponentManager.getInstance().cruds_by_api_type_id[API_TYPE_ID] = crud;

//         routes.push({
//             path: url,
//             name: route_name,
//             component: CRUDComponent,
//             props: () => ({
//                 crud: crud,
//                 key: '__manage__' + API_TYPE_ID,
//                 read_query: read_query
//             })
//         });

//         routes.push({
//             path: url + "/update/:id",
//             name: route_name + " --UPDATE",
//             component: CRUDComponent,
//             props: (route) => ({
//                 crud: crud,
//                 key: '__manage__' + API_TYPE_ID,
//                 modal_show_update: true,
//                 modal_vo_id: parseInt(route.params.id)
//             })
//         });

//         if (!VOsTypesManager.getInstance().moduleTables_by_voType[crud.readDatatable.API_TYPE_ID].isModuleParamTable) {
//             routes.push({
//                 path: url + "/create",
//                 name: route_name + " --CREATE",
//                 component: CRUDComponent,
//                 props: (route) => ({
//                     crud: crud,
//                     key: '__manage__' + API_TYPE_ID,
//                     modal_show_create: true
//                 })
//             });

//             routes.push({
//                 path: url + "/delete/:id",
//                 name: route_name + " --DELETE",
//                 component: CRUDComponent,
//                 props: (route) => ({
//                     crud: crud,
//                     key: '__manage__' + API_TYPE_ID,
//                     modal_show_delete: true,
//                     modal_vo_id: parseInt(route.params.id)
//                 })
//             });
//         }

//         menuPointer.leaf.target = new MenuLeafRouteTarget(route_name);
//         menuPointer.addToMenu();
//     }



//     public defineMenuRouteToCRUD(
//         API_TYPE_ID: string,
//         menuPointer: MenuPointer,
//         routes: RouteConfig[],
//         read_query: any = null) {
//         let url: string = CRUDHandler.getCRUDLink(API_TYPE_ID);
//         let route_name: string = menuPointer.leaf.UID;

//         routes.push({
//             path: url,
//             name: route_name,
//             component: CRUDComponent,
//             props: () => ({
//                 crud: DataImportComponentManager.getInstance().cruds_by_api_type_id[API_TYPE_ID],
//                 key: '__manage__' + API_TYPE_ID,
//                 read_query: read_query
//             })
//         });

//         menuPointer.leaf.target = new MenuLeafRouteTarget(route_name);
//         menuPointer.addToMenu();
//     }
// }