/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ImageFormatVO from '../../../shared/modules/ImageFormat/vos/ImageFormatVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200806InitBaseImageFormats implements IGeneratorWorker {

    public static getInstance(): Patch20200806InitBaseImageFormats {
        if (!Patch20200806InitBaseImageFormats.instance) {
            Patch20200806InitBaseImageFormats.instance = new Patch20200806InitBaseImageFormats();
        }
        return Patch20200806InitBaseImageFormats.instance;
    }

    private static instance: Patch20200806InitBaseImageFormats = null;

    get uid(): string {
        return 'Patch20200806InitBaseImageFormats';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let existings: ImageFormatVO[] = await ModuleDAO.getInstance().getVos(ImageFormatVO.API_TYPE_ID);
        if ((!!existings) && (!!existings.length)) {
            return;
        }

        let img_format: ImageFormatVO = new ImageFormatVO();
        img_format.name = 'Cover - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = true;
        img_format.remplir_larg = true;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAO.getInstance().insertOrUpdateVO(img_format);

        img_format = new ImageFormatVO();
        img_format.name = 'Contain - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = false;
        img_format.remplir_larg = false;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAO.getInstance().insertOrUpdateVO(img_format);

        img_format = new ImageFormatVO();
        img_format.name = 'Cover width - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = false;
        img_format.remplir_larg = true;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAO.getInstance().insertOrUpdateVO(img_format);

        img_format = new ImageFormatVO();
        img_format.name = 'Cover height - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = true;
        img_format.remplir_larg = false;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAO.getInstance().insertOrUpdateVO(img_format);
    }
}