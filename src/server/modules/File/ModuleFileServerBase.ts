import { Express, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleFile from '../../../shared/modules/File/ModuleFile';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ServerBase from '../../ServerBase';
import StackContext from '../../StackContext';
import ModuleServerBase from '../ModuleServerBase';
import PushDataServerController from '../PushData/PushDataServerController';
import ArchiveFilesWorkersHandler from './ArchiveFilesWorkersHandler';
import FileServerController from './FileServerController';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ImageVO from '../../../shared/modules/Image/vos/ImageVO';

export default abstract class ModuleFileServerBase<T extends FileVO> extends ModuleServerBase {

    protected constructor(
        public api_upload_uri: string,
        name: string) {
        super(name);
    }

    public registerExpressApis(app: Express): void {
        app.post(this.api_upload_uri, /*ServerBase.getInstance().csrf_protection,*/ fileUpload(), this.uploadFile.bind(this));
    }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleFile.APINAME_TEST_FILE_EXISTENZ, this.testFileExistenz.bind(this));
    }

    // istanbul ignore next: cannot test registerCrons
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
        await ModuleDAO.instance.insertOrUpdateVO(fileVo);
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
        await ModuleDAO.instance.insertOrUpdateVO(fileVo);
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

    public async writeFile(filepath: string, fileContent: any) {
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

    private async uploadFile(req: Request, res: Response) {

        let import_file: fileUpload.UploadedFile = null;
        const uid: number = StackContext.get('UID');
        const CLIENT_TAB_ID: string = StackContext.get('CLIENT_TAB_ID');

        try {
            import_file = req.files[Object.keys(req.files)[0]] as fileUpload.UploadedFile;
            if (!import_file) {
                throw new Error('uploadFile- No file found');
            }
        } catch (error) {
            console.error(error);
            await PushDataServerController.notifySimpleERROR(uid, CLIENT_TAB_ID, 'file.upload.error');
            res.json(JSON.stringify(null));
            return;
        }

        await PushDataServerController.notifySimpleSUCCESS(uid, CLIENT_TAB_ID, 'file.upload.success');

        let file_name: string = import_file.name;
        const folder_name: string = ModuleFile.FILES_ROOT + 'upload/';
        let filepath: string = folder_name + file_name;

        while (fs.existsSync(filepath)) {
            file_name = '_' + file_name;
            filepath = folder_name + file_name;
        }

        return import_file.mv(filepath, async (err) => {
            if (err) {
                console.error(err);
                await PushDataServerController.notifySimpleERROR(uid, CLIENT_TAB_ID, 'file.upload.error');
                res.json(JSON.stringify(null));
                return;
            }

            // On tente de le retrouver en base dans un premier temps
            let filevo: FileVO | ImageVO = await query(this.get_vo_type())
                .filter_by_text_eq(field_names<FileVO | ImageVO>().path, filepath)
                .select_vo<FileVO | ImageVO>();

            if (!filevo) {
                filevo = this.getNewVo();
                filevo.path = filepath;

                const insertres: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(filevo);
                if ((!insertres) || (!insertres.id)) {
                    await PushDataServerController.notifySimpleERROR(uid, CLIENT_TAB_ID, 'file.upload.error');
                    res.json(JSON.stringify(null));
                    return;
                }

                filevo.id = insertres.id;
            }
            res.json(JSON.stringify(filevo));
        });
    }

    private async testFileExistenz(num: number): Promise<boolean> {

        try {
            const fileVo: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(num).select_vo<FileVO>();

            if (fileVo) {
                return fs.existsSync(fileVo.path);
            }
            return false;

        } catch (error) {
            console.error(error);
        }
        return false;
    }

    protected abstract getNewVo(): T;
    protected abstract get_vo_type(): string;
}