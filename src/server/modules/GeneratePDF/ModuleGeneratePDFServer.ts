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

                if (save_to_desktop) {
                    this.saveToDisk(filepath_return, file_name);
                }

                resolve(filepath_return);
            });
        }) as string;
    }

    public saveToDisk(fileURL: string, fileName: string) {
        // for non-IE
        if (!window['ActiveXObject']) {
            var save = document.createElement('a');
            save.href = fileURL;
            save.target = '_blank';
            save.download = fileName || 'unknown';

            var evt = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: false
            });
            save.dispatchEvent(evt);

            (window.URL || window['webkitURL']).revokeObjectURL(save.href);
        } else if (!!window['ActiveXObject'] && document.execCommand) {
            var _window = window.open(fileURL, '_blank');
            _window.document.close();
            _window.document.execCommand('SaveAs', true, fileName || fileURL);
            _window.close();
        }
    }
}