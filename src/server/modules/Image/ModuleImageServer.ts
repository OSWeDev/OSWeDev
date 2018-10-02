import ImageVO from '../../../shared/modules/Image/vos/ImageVO';
import ModuleImage from '../../../shared/modules/Image/ModuleImage';
import ModuleFileServerBase from '../File/ModuleFileServerBase';

export default class ModuleImageServer extends ModuleFileServerBase<ImageVO> {

    public static getInstance(): ModuleImageServer {
        if (!ModuleImageServer.instance) {
            ModuleImageServer.instance = new ModuleImageServer();
        }
        return ModuleImageServer.instance;
    }

    private static instance: ModuleImageServer = null;

    protected constructor() {
        super('/ModuleImageServer/upload', ModuleImage.getInstance().name);
    }

    protected getNewVo(): ImageVO {
        return new ImageVO();
    }
}