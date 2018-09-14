import { Express, Request, Response } from 'express';
import * as formidable from 'express-formidable';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import ServerBase from '../../ServerBase';
import ModuleServerBase from '../ModuleServerBase';
import ModulePushDataServer from '../PushData/ModulePushDataServer';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

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
        app.post('/ModuleFileServer/upload', formidable(), this.uploadFile.bind(this));
    }

    /**
     * 
     * @param old_path 
     * @param toFolder 
     * @returns the new path
     */
    public async moveFile(old_path: string, toFolder: string): Promise<string> {

        await this.makeSureThisFolderExists(toFolder);
        let new_path = toFolder + path.basename(old_path);
        await fs.rename(old_path, new_path);
        return new_path;
    }

    /**
     * 
     * @param old_path 
     * @param toFolder 
     * @returns the new path
     */
    public async moveFileVo(fileVo: FileVO, toFolder: string): Promise<string> {
        await this.moveFile(fileVo.path, toFolder);
        fileVo.path = toFolder + path.basename(fileVo.path);
        await ModuleDAO.getInstance().insertOrUpdateVO(fileVo);
        return fileVo.path;
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

        let path: string = import_file.path;
        path = await ModuleFileServer.getInstance().moveFile(path, ModuleFile.FILES_ROOT + 'upload/');

        let filevo: FileVO = new FileVO();
        filevo.path = path;
        let insertres: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(filevo);
        if ((!insertres) || (!insertres.id)) {
            ModulePushDataServer.getInstance().notifySimpleERROR(uid, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        filevo.id = parseInt(insertres.id.toString());
        res.json(JSON.stringify(filevo));
    }

    public async makeSureThisFolderExists(folder: string) {
        return new Promise((resolve, reject) => {
            mkdirp(folder, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    public async dirExists(path: string) {
        return new Promise((resolve, reject) => {
            fs.exists(path, (res) => {
                resolve(res);
            });
        });
    }

    public async dirCreate(path: string) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, (res) => {
                resolve(res);
            });
        });
    }

    public async writeFile(filepath: string, fileContent: string) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filepath, fileContent, function (err) {
                if (err) {
                    console.error(err);
                    resolve(err);
                    return;
                }
                console.log("File overwritten : " + filepath);
                resolve();
            });
        });
    }

    public async appendFile(filepath: string, fileContent: string) {
        return new Promise((resolve, reject) => {
            fs.appendFile(filepath, fileContent, function (err) {
                if (err) {
                    console.error(err);
                    resolve(err);
                    return;
                }
                resolve();
            });
        });
    }

    public getWriteStream(filepath: string, flags: string): fs.WriteStream {
        return fs.createWriteStream(filepath, { flags: flags });
    }
}