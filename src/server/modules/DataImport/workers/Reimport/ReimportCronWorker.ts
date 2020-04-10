// import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
// import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
// import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
// import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
// import ThreadHandler from '../../../../../shared/tools/ThreadHandler';
// import ICronWorker from '../../../Cron/interfaces/ICronWorker';

// export default class ReimportCronWorker implements ICronWorker {

//     public static getInstance() {
//         if (!ReimportCronWorker.instance) {
//             ReimportCronWorker.instance = new ReimportCronWorker();
//         }
//         return ReimportCronWorker.instance;
//     }

//     private static instance: ReimportCronWorker = null;

//     private constructor() {
//     }

//     get worker_uid(): string {
//         return "ReimportCronWorker";
//     }

//     public async work() {
//         let historics: DataImportHistoricVO[] = await ModuleDAO.getInstance().getVos<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID);

//         for (let i in historics) {
//             let historic: DataImportHistoricVO = historics[i];

//             if (historic.state != ModuleDataImport.IMPORTATION_STATE_NEEDS_REIMPORT) {
//                 continue;
//             }

//             historic.state = ModuleDataImport.IMPORTATION_STATE_POSTTREATED;
//             await ModuleDAO.getInstance().insertOrUpdateVO(historic);

//             let new_historic = new DataImportHistoricVO();
//             new_historic.api_type_id = historic.api_type_id;
//             new_historic.autovalidate = true;
//             new_historic.file_id = historic.file_id;
//             new_historic.import_type = historic.import_type;
//             new_historic.segment_type = historic.segment_type;
//             new_historic.segment_date_index = historic.segment_date_index;
//             new_historic.params = historic.params;
//             new_historic.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
//             new_historic.user_id = historic.user_id;

//             console.debug('Début réimport :' + historic.historic_uid + ':');

//             let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_historic);

//             if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
//                 ConsoleHandler.getInstance().error('!insertOrDeleteQueryResult dans ReimportCronWorker');
//                 continue;
//             }
//             let id = parseInt(insertOrDeleteQueryResult.id);
//             if ((!id) || (!isNumber(id))) {
//                 ConsoleHandler.getInstance().error('!id dans ReimportCronWorker');
//                 continue;
//             }

//             // On attend la fin de l'import avant de passer au suivant
//             let import_running: boolean = true;

//             while (import_running) {
//                 console.debug('Réimport en cours :' + historic.historic_uid + ':');
//                 await ThreadHandler.getInstance().sleep(5000);
//                 new_historic = await ModuleDAO.getInstance().getVoById<DataImportHistoricVO>(DataImportHistoricVO.API_TYPE_ID, id);
//                 import_running = !((new_historic.state == ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION) ||
//                     (new_historic.state == ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT) ||
//                     (new_historic.state == ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED) ||
//                     (new_historic.state == ModuleDataImport.IMPORTATION_STATE_POSTTREATED));
//             }

//             console.debug('Fin réimport :' + historic.historic_uid + ':');
//         }
//     }
// }