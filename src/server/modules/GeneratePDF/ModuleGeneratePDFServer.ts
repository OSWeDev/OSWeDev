import * as fs from 'fs';
import * as wkhtmltopdf from 'wkhtmltopdf';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleGeneratePDF from '../../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import GeneratePdfParamVO from '../../../shared/modules/GeneratePDF/params/GeneratePdfParamVO';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleGeneratePDFServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleGeneratePDFServer.instance) {
            ModuleGeneratePDFServer.instance = new ModuleGeneratePDFServer();
        }
        return ModuleGeneratePDFServer.instance;
    }

    private static instance: ModuleGeneratePDFServer = null;

    private constructor() {
        super(ModuleGeneratePDF.getInstance().name);
    }

    public async configure() { }

    public registerServerApiHandlers() {
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleGeneratePDF.APINAME_generatePDF, this.generatePDF.bind(this));
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

        return await new Promise((resolve, reject) => {
            let write: NodeJS.WritableStream = fs.createWriteStream(filepathconstructFile);

            // Copie du fichier
            wkhtmltopdf(html, options).pipe(write);
            write.on('finish', async () => {

                resolve(filepath_return);
            });
        }) as string;
    }
}