/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ImageFormatVO from '../../../shared/modules/ImageFormat/vos/ImageFormatVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class InitBaseImageFormats implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): InitBaseImageFormats {
        if (!InitBaseImageFormats.instance) {
            InitBaseImageFormats.instance = new InitBaseImageFormats();
        }
        return InitBaseImageFormats.instance;
    }

    private static instance: InitBaseImageFormats = null;

    get uid(): string {
        return 'InitBaseImageFormats';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let existings: ImageFormatVO[] = await query(ImageFormatVO.API_TYPE_ID).select_vos();
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
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(img_format);

        img_format = new ImageFormatVO();
        img_format.name = 'Contain - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = false;
        img_format.remplir_larg = false;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(img_format);

        img_format = new ImageFormatVO();
        img_format.name = 'Cover width - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = false;
        img_format.remplir_larg = true;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(img_format);

        img_format = new ImageFormatVO();
        img_format.name = 'Cover height - centered';
        img_format.quality = 0.9;
        img_format.remplir_haut = true;
        img_format.remplir_larg = false;
        img_format.align_haut = ImageFormatVO.VALIGN_CENTER;
        img_format.align_larg = ImageFormatVO.HALIGN_CENTER;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(img_format);
    }
}