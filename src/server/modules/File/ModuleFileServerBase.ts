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
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';

export default abstract class ModuleFileServerBase<T extends FileVO> extends ModuleServerBase {

    protected constructor(
        public api_upload_uri: string,
        name: string) {
        super(name);
    }

    public registerExpressApis(app: Express): void {
        app.post(this.api_upload_uri, formidable(), this.uploadFile.bind(this));
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleFile.APINAME_TEST_FILE_EXISTENZ, this.testFileExistenz.bind(this));
    }

    /**
     *
     * @param old_path
     * @param toFolder
     * @returns the new path
     */
    public async moveFile(old_path: string, toFolder: string, file_name: string = null): Promise<string> {

        await this.makeSureThisFolderExists(toFolder);
        file_name = (file_name ? file_name : path.basename(old_path));
        let new_path = toFolder + file_name;
        while (fs.existsSync(new_path)) {
            file_name = '_' + file_name;
            new_path = toFolder + file_name;
        }
        fs.renameSync(old_path, new_path);
        return new_path;
    }

    /**
     *
     * @param srcFile
     * @param toFolder
     * @returns the new path
     */
    public async copyFile(srcFile: string, toFolder: string, file_name: string = null): Promise<string> {

        await this.makeSureThisFolderExists(toFolder);
        file_name = (file_name ? file_name : path.basename(srcFile));
        let new_path = toFolder + file_name;
        while (fs.existsSync(new_path)) {
            file_name = '_' + file_name;
            new_path = toFolder + file_name;
        }
        fs.copyFileSync(srcFile, new_path);
        return new_path;
    }

    public async copyFileVo(fileVo: T, toFolder: string): Promise<string> {
        fileVo.path = await this.copyFile(fileVo.path, toFolder);
        await ModuleDAO.getInstance().insertOrUpdateVO(fileVo);
        return fileVo.path;
    }

    /**
     *
     * @param old_path
     * @param toFolder
     * @returns the new path
     */
    public async moveFileVo(fileVo: T, toFolder: string): Promise<string> {
        fileVo.path = await this.moveFile(fileVo.path, toFolder);
        await ModuleDAO.getInstance().insertOrUpdateVO(fileVo);
        return fileVo.path;
    }

    public async makeSureThisFolderExists(folder: string) {
        return new Promise((resolve, reject) => {
            mkdirp(folder, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public async dirExists(filepath: string) {
        return new Promise((resolve, reject) => {
            fs.exists(filepath, (res) => {
                resolve(res);
            });
        });
    }

    public async dirCreate(filepath: string) {
        return new Promise((resolve, reject) => {
            fs.mkdir(filepath, (res) => {
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

    protected abstract getNewVo(): T;

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

        let filepath: string = import_file.path;
        let name: string = import_file.name;
        filepath = await this.copyFile(filepath, ModuleFile.FILES_ROOT + 'upload/', name);

        let filevo: T = this.getNewVo();
        filevo.path = filepath;
        let insertres: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(filevo);
        if ((!insertres) || (!insertres.id)) {
            ModulePushDataServer.getInstance().notifySimpleERROR(uid, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        filevo.id = parseInt(insertres.id.toString());
        res.json(JSON.stringify(filevo));
    }

    private async testFileExistenz(param: NumberParamVO): Promise<boolean> {

        try {
            let fileVo: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, param.num);
            return fs.existsSync(fileVo.path);
        } catch (error) {
        }
        return false;
    }
}