import { Express, Request, Response } from 'express';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import ServerBase from '../../ServerBase';
import ModuleServerBase from '../ModuleServerBase';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import * as fs from 'fs';

export default class ModuleFileServer extends ModuleServerBase {

    public static getInstance(): ModuleFileServer {
        if (!ModuleFileServer.instance) {
            ModuleFileServer.instance = new ModuleFileServer();
        }
        return ModuleFileServer.instance;
    }

    private static instance: ModuleFileServer = null;

    private constructor() {
        super(ModuleFile.getInstance().name);
    }

    public registerExpressApis(app: Express): void {
        app.post('/ModuleFileServer/upload', this.uploadFile.bind(this));
    }

    public async moveFile(fileVo: FileVO, toFolder: string) {
        await fs.rename(fileVo.path, toFolder);
    }

    private async uploadFile(req: Request, res: Response) {

        let import_file = null;
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;

        try {
            import_file = req.files[Object.keys(req.files)[0]];
        } catch (error) {
            console.error(error);
            ModulePushDataServer.getInstance().notifySimpleERROR(uid, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        ModulePushDataServer.getInstance().notifySimpleSUCCESS(uid, 'file.upload.success');

        let filevo: FileVO = new FileVO();

        filevo.path = import_file;
        let insertres: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(filevo);
        if ((!insertres) || (!insertres.id)) {
            ModulePushDataServer.getInstance().notifySimpleERROR(uid, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        res.json(JSON.stringify(filevo));
    }
}