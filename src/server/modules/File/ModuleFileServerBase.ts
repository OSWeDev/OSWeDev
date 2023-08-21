import { Express, Request, Response } from 'express';
import * as fileUpload from 'express-fileupload';
import * as fs from 'fs';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import NumberParamVO from '../../../shared/modules/API/vos/apis/NumberParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ServerBase from '../../ServerBase';
import StackContext from '../../StackContext';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import FileServerController from './FileServerController';

export default abstract class ModuleFileServerBase<T extends FileVO> extends ModuleServerBase {

    protected constructor(
        public api_upload_uri: string,
        name: string) {
        super(name);
    }

    public registerExpressApis(app: Express): void {
        app.post(this.api_upload_uri, ServerBase.getInstance().csrfProtection, fileUpload(), this.uploadFile.bind(this));
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
        return FileServerController.getInstance().moveFile(old_path, toFolder, file_name);
    }

    /**
     *
     * @param srcFile
     * @param toFolder
     * @returns the new path
     */
    public async copyFile(srcFile: string, toFolder: string, file_name: string = null): Promise<string> {
        return FileServerController.getInstance().copyFile(srcFile, toFolder, file_name);
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
        return FileServerController.getInstance().makeSureThisFolderExists(folder);
    }

    public async dirExists(filepath: string) {
        return FileServerController.getInstance().dirExists(filepath);
    }

    public async dirCreate(filepath: string) {
        return FileServerController.getInstance().dirCreate(filepath);
    }

    public async writeFile(filepath: string, fileContent: string) {
        return FileServerController.getInstance().writeFile(filepath, fileContent);
    }

    public async readFile(filepath: string): Promise<string> {
        return FileServerController.getInstance().readFile(filepath);
    }


    public async appendFile(filepath: string, fileContent: string) {
        return FileServerController.getInstance().appendFile(filepath, fileContent);
    }

    public getWriteStream(filepath: string, flags: string): fs.WriteStream {
        return FileServerController.getInstance().getWriteStream(filepath, flags);
    }

    protected abstract getNewVo(): T;

    private async uploadFile(req: Request, res: Response) {

        let import_file: fileUpload.UploadedFile = null;
        let uid: number = StackContext.getInstance().get('UID');

        try {
            import_file = req.files[Object.keys(req.files)[0]] as fileUpload.UploadedFile;
            if (!import_file) {
                throw new Error('uploadFile- No file found');
            }
        } catch (error) {
            console.error(error);
            PushDataServerController.getInstance().notifySimpleERROR(uid, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        PushDataServerController.getInstance().notifySimpleSUCCESS(uid, 'file.upload.success');

        let file_name: string = import_file.name;
        let folder_name: string = ModuleFile.FILES_ROOT + 'upload/';
        let filepath: string = folder_name + file_name;

        while (fs.existsSync(filepath)) {
            file_name = '_' + file_name;
            filepath = folder_name + file_name;
        }

        return import_file.mv(filepath, async (err) => {
            if (err) {
                console.error(err);
                PushDataServerController.getInstance().notifySimpleERROR(uid, 'file.upload.error');
                res.json(JSON.stringify(null));
                return;
            }

            let filevo: T = this.getNewVo();
            filevo.path = filepath;

            let insertres: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(filevo);
            if ((!insertres) || (!insertres.id)) {
                PushDataServerController.getInstance().notifySimpleERROR(uid, 'file.upload.error');
                res.json(JSON.stringify(null));
                return;
            }

            filevo.id = parseInt(insertres.id.toString());
            res.json(JSON.stringify(filevo));
        });
    }

    private async testFileExistenz(param: NumberParamVO): Promise<boolean> {

        try {
            let fileVo: FileVO = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, param.num);
            return fs.existsSync(fileVo.path);
        } catch (error) {
            console.error(error);
        }
        return false;
    }
}