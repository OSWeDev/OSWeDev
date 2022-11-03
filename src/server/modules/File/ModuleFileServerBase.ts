import { Express, Request, Response } from 'express';
import * as fileUpload from 'express-fileupload';
import * as fs from 'fs';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ServerBase from '../../ServerBase';
import StackContext from '../../StackContext';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import FileServerController from './FileServerController';
import ArchiveFilesWorkersHandler from './ArchiveFilesWorkersHandler';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileFormatVO from '../../../shared/modules/File/vos/FileFormatVO';
import path = require('path');
import * as sharp from 'sharp';

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
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleFile.APINAME_TEST_FILE_EXISTENZ, this.testFileExistenz.bind(this));
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleFile.APINAME_resize_image_with_style, this.resize_image_with_style.bind(this));
    }

    public registerCrons(): void {
        ArchiveFilesWorkersHandler.getInstance();
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
        let CLIENT_TAB_ID: string = StackContext.getInstance().get('CLIENT_TAB_ID');

        try {
            import_file = req.files[Object.keys(req.files)[0]] as fileUpload.UploadedFile;
            if (!import_file) {
                throw new Error('uploadFile- No file found');
            }
        } catch (error) {
            console.error(error);
            await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        await PushDataServerController.getInstance().notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'file.upload.success');

        let name: string = import_file.name;
        let filepath: string = ModuleFile.FILES_ROOT + 'upload/' + name;

        return import_file.mv(filepath, async (err) => {
            if (err) {
                console.error(err);
                await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'file.upload.error');
                res.json(JSON.stringify(null));
                return;
            }

            let filevo: T = this.getNewVo();
            filevo.path = filepath;

            let insertres: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(filevo);
            if ((!insertres) || (!insertres.id)) {
                await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'file.upload.error');
                res.json(JSON.stringify(null));
                return;
            }

            filevo.id = insertres.id;
            res.json(JSON.stringify(filevo));
        });
    }

    private async testFileExistenz(num: number): Promise<boolean> {

        try {
            let fileVo: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(num).select_vo<FileVO>();

            if (!!fileVo) {
                return fs.existsSync(fileVo.path);
            }
            return false;

        } catch (error) {
            console.error(error);
        }
        return false;
    }

    private async resize_image_with_style(file_id: number, file_format_id: number): Promise<string> {
        if (!file_id || !file_format_id) {
            return null;
        }

        let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(file_id).select_vo<FileVO>();
        let file_format: FileFormatVO = await query(FileFormatVO.API_TYPE_ID).filter_by_id(file_format_id).select_vo<FileFormatVO>();

        if (!file || !file_format) {
            return null;
        }

        let width_height: string = (file_format.width ? file_format.width.toString() : '_') + '_' + (file_format.height ? file_format.height.toString() : '_');

        let dir_path: string = path.dirname(file.path) + '/resize/';
        let new_file_path: string = dir_path + (path.basename(file.path, path.extname(file.path)) + '_' + width_height) + path.extname(file.path);

        if (fs.existsSync(new_file_path)) {
            return new_file_path;
        }

        if (!fs.existsSync(dir_path)) {
            fs.mkdirSync(dir_path);
        }

        let sharp_file = sharp(file.path);

        let metadata = await sharp_file.metadata();

        let rotate = 0;

        switch (metadata.orientation) {
            case 3:
                rotate = 180;
                break;

            case 6:
                rotate = 90;
                break;

            case 8:
                rotate = 270;
                break;
        }

        await sharp_file.resize(file_format.width, file_format.height).rotate(rotate).toFile(new_file_path);

        return new_file_path;
    }
}