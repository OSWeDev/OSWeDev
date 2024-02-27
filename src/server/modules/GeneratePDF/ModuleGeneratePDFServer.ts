import fs from 'fs';
import wkhtmltopdf from 'wkhtmltopdf';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ModuleGeneratePDF from '../../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import GeneratePdfParamVO from '../../../shared/modules/GeneratePDF/params/GeneratePdfParamVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleGeneratePDFServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleGeneratePDFServer.instance) {
            ModuleGeneratePDFServer.instance = new ModuleGeneratePDFServer();
        }
        return ModuleGeneratePDFServer.instance;
    }

    private static instance: ModuleGeneratePDFServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleGeneratePDF.getInstance().name);
    }

    public async configure() { }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleGeneratePDF.APINAME_generatePDF, this.generatePDF.bind(this));
    }

    public async generatePDF(sous_rep: string, file_name: string, html: string, save_to_desktop: boolean, options: {} = { encoding: 'utf-8' }): Promise<string> {
        const filepathconstruct: string = GeneratePdfParamVO.reppath + GeneratePdfParamVO.filepath;
        const filepathconstructRep: string = filepathconstruct + sous_rep + '/';
        const filepathconstructFile: string = filepathconstructRep + file_name;
        const filepath_return: string = filepathconstructFile; //GeneratePdfParamVO.filepath + sous_rep + '/' + file_name;

        // Création du répertoire
        if (!fs.existsSync(filepathconstruct)) {
            fs.mkdirSync(filepathconstruct);
        }

        if (!fs.existsSync(filepathconstructRep)) {
            fs.mkdirSync(filepathconstructRep);
        }

        /**
         * On va vérifier qu'il existe un fileVO qui fait référence à ce document, sinon on le crée
         */
        let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_text_eq('path', filepath_return).select_vo<FileVO>();

        if (!file) {
            file = new FileVO();
            file.file_access_policy_name = null;
            file.is_secured = false;
            file.path = filepath_return;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(file);
        }

        return await new Promise((resolve, reject) => {
            const write: NodeJS.WritableStream = fs.createWriteStream(filepathconstructFile);

            // Copie du fichier
            wkhtmltopdf(html, options).pipe(write);
            write.on('finish', async () => {

                resolve(filepath_return);
            });
        }) as string;
    }
}