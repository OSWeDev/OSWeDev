import * as $ from 'jquery';
import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ImageVO from '../../../../shared/modules/Image/vos/ImageVO';


export default class ImageComponentManager {

    /**
     * On lance l'upload
     * @param selector Selecteur CSS du input type file
     */
    public static async uploadImageVO(selector: string): Promise<ImageVO> {
        let imagevo: ImageVO = null;

        try {

            if (!ImageComponentManager.hasFileInputData(selector)) {
                return imagevo;
            }
            let file: File = $(selector)[0]['files'][0];

            let formData = new FormData();
            formData.append('file', file);

            imagevo = await ModuleAjaxCache.getInstance().post(
                '/modules/ModuleImage/UploadImage',
                [ImageVO.API_TYPE_ID],
                formData,
                null,
                null,
                false,
                30000) as ImageVO;
        } catch (error) {
        }
        return imagevo;
    }

    private static hasFileInputData(selector: string): boolean {
        return $(selector) && $(selector)[0] && $(selector)[0]['files'] && $(selector)[0]['files'][0];
    }
}