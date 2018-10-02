import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleFileServerBase from './ModuleFileServerBase';

export default class ModuleFileServer extends ModuleFileServerBase<FileVO> {

    public static getInstance(): ModuleFileServer {
        if (!ModuleFileServer.instance) {
            ModuleFileServer.instance = new ModuleFileServer();
        }
        return ModuleFileServer.instance;
    }

    private static instance: ModuleFileServer = null;

    protected constructor() {
        super('/ModuleFileServer/upload', ModuleFile.getInstance().name);
    }

    protected getNewVo(): FileVO {
        return new FileVO();
    }
}