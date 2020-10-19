import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import GeneratePdfParamVO from './params/GeneratePdfParamVO';

export default class ModuleGeneratePDF extends Module {

    public static APINAME_generatePDF: string = "generatePDF";

    public static getInstance(): ModuleGeneratePDF {
        if (!ModuleGeneratePDF.instance) {
            ModuleGeneratePDF.instance = new ModuleGeneratePDF();
        }
        return ModuleGeneratePDF.instance;
    }

    private static instance: ModuleGeneratePDF = null;

    private constructor() {
        super("generate_pdf", 'GeneratePDF');
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<GeneratePdfParamVO, string>(
            ModuleAccessPolicy.POLICY_FO_ACCESS,
            ModuleGeneratePDF.APINAME_generatePDF,
            [],
            GeneratePdfParamVO.translateCheckAccessParams
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    /**
     * Fonction de génération d'un PDF (ATTENTION: le logiciel wkhtmltopdf doit être installé sur l'ordinateur)
     * @param sous_rep Nom du Sous répertoire où doit être enregistré le PDF
     * @param file_name Nom du PDF avec extension
     * @param html Contenu HTML du PDF
     * @param save_to_desktop Forcer la sauvegarde sur l'ordinateur du client
     * @param options Options du PDF
     */
    public async generatePDF(sous_rep: string, file_name: string, html: string, save_to_desktop: boolean, options: {} = { encoding: 'utf-8' }): Promise<string> {
        let file_path: string = await ModuleAPI.getInstance().handleAPI<GeneratePdfParamVO, string>(ModuleGeneratePDF.APINAME_generatePDF, sous_rep, file_name, html, options);

        if (save_to_desktop) {
            this.saveToDisk(file_path, file_name);
        }

        return file_path;
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
