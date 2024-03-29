// import FileVO from '../../../../shared/modules/File/vos/FileVO';
// import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';


// export default class FileComponentManager {

//     /**
//      * On lance l'upload
//      * @param selector Selecteur CSS du input type file
//      */
//     public static async uploadFileVO(selector: string): Promise<FileVO> {
//         let fileVO: FileVO = null;

//         try {

//             if (!FileComponentManager.hasFileInputData(selector)) {
//                 return fileVO;
//             }
//             let file: File = $(selector)[0]['files'][0];

//             let formData = new FormData();
//             formData.append('file', file);

//             fileVO = await AjaxCacheClientController.getInstance().post(
//                 '/modules/ModuleFile/UploadFile',
//                 [FileVO.API_TYPE_ID],
//                 formData,
//                 null,
//                 null,
//                 false,
//                 30000) as FileVO;
//         } catch (error) {
//         }
//         return fileVO;
//     }

//     private static hasFileInputData(selector: string): boolean {
//         return $(selector) && $(selector)[0] && $(selector)[0]['files'] && $(selector)[0]['files'][0];
//     }
// }