import ConsoleHandler from '../../tools/ConsoleHandler';
import { query } from '../ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import ModuleFile from '../File/ModuleFile';
import FileVO from '../File/vos/FileVO';
import Dates from '../FormatDatesNombres/Dates/Dates';
import ModuleOselia from './ModuleOselia';
import OseliaChatVO from './vos/OseliaChatVO';

export default class OseliaController {

    public static PARAM_NAME_UNBLOCK_REALTIME_API: string = 'OseliaController.unblock_realtime_api';

    public static async get_referrer_id(url: string): Promise<number> {
        const vos: OseliaChatVO[] = await query(OseliaChatVO.API_TYPE_ID).select_vos<OseliaChatVO>()
        for (const i in vos) {
            const chat_instance: OseliaChatVO = vos[i];
            if (new RegExp(chat_instance.regex).test(url)) {
                return chat_instance.referrer_id;
            }
        }
        return null;
    }


    public static async take_screenshot() {
        try {

            let track = await ModuleOselia.getInstance().get_screen_track();
            if (!track) {
                // Capture de l'écran
                const options: MediaStreamConstraints = {
                    preferCurrentTab: true,
                };
                const captureStream = (await navigator.mediaDevices as MediaDevices).getDisplayMedia(options);
                track = (await captureStream).getVideoTracks()[0];
                await ModuleOselia.getInstance().set_screen_track(track);
            }
            const imageCapture = new (window as any).ImageCapture(track);
            // Capture de l'image du flux vidéo
            let imageBitmap = await imageCapture.grabFrame();

            // Création du canvas et dessin de l'image capturée
            let canvas = document.createElement("canvas");
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            canvas.getContext("2d").drawImage(imageBitmap, 0, 0);

            // Retourner le canvas
            return canvas;
        } catch (error) {
            ConsoleHandler.error("Erreur lors de la capture de l'écran :" + JSON.stringify(error));
            return null;
        }
    }

    public static async do_take_screenshot() {
        try {

            const canvas = await OseliaController.take_screenshot();

            // Encapsuler canvas.toBlob dans une Promise
            const imgData = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/png');
            });

            if (!imgData) {
                ConsoleHandler.error('No imgData');
                return;
            }


            const fileName = 'screenshot_' + "oselia_" + Dates.now() + '.png';

            const new_file = new FileVO();
            new_file.path = ModuleFile.FILES_ROOT + 'upload/' + fileName;
            const resnew_file: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(new_file); // Renvoie un InsertOrDeleteQueryResult qui contient l'id cherché
            new_file.id = resnew_file.id;

            return { imgData, new_file, fileName };
        } catch (error) {
            ConsoleHandler.error("Erreur lors de la capture de l'écran :" + JSON.stringify(error));
        }
    }
}