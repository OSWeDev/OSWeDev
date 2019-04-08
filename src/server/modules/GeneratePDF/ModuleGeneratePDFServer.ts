import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleServerBase from '../ModuleServerBase';
import ModuleGeneratePDF from '../../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import GeneratePdfParamVO from '../../../shared/modules/GeneratePDF/params/GeneratePdfParamVO';
import * as fs from 'fs';
import * as wkhtmltopdf from 'wkhtmltopdf';

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
        ModuleAPI.getInstance().registerServerApiHandler(ModuleGeneratePDF.APINAME_generatePDF, this.generatePDF.bind(this));
    }

    private async generatePDF(param: GeneratePdfParamVO): Promise<string> {
        const filepathconstruct: string = GeneratePdfParamVO.reppath + GeneratePdfParamVO.filepath;
        const filepathconstructRep: string = filepathconstruct + param.sous_rep + '/';
        const filepathconstructFile: string = filepathconstructRep + param.file_name;
        const filepath_return: string = filepathconstructFile; //GeneratePdfParamVO.filepath + param.sous_rep + '/' + param.file_name;

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
            wkhtmltopdf(param.text, param.options).pipe(write);
            write.on('finish', async () => {
                resolve(filepath_return);
            });
        }) as string;
    }
}