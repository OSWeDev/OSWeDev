import ModuleGeneratePDF from '../../../../shared/modules/GeneratePDF/ModuleGeneratePDF';

export default class GeneratePDFClientController {

    public static getInstance(): GeneratePDFClientController {
        if (!GeneratePDFClientController.instance) {
            GeneratePDFClientController.instance = new GeneratePDFClientController();
        }
        return GeneratePDFClientController.instance;
    }

    private static instance: GeneratePDFClientController = null;

    /**
     * Fonction de génération d'un PDF (ATTENTION: le logiciel wkhtmltopdf doit être installé sur l'ordinateur)
     * @param sous_rep Nom du Sous répertoire où doit être enregistré le PDF
     * @param file_name Nom du PDF avec extension
     * @param html Contenu HTML du PDF
     * @param save_to_desktop Forcer la sauvegarde sur l'ordinateur du client
     * @param options Options du PDF : default { encoding: 'utf-8' }
     */
    public async generatePDF(sous_rep: string, file_name: string, html: string, save_to_desktop: boolean, options?: {}): Promise<string> {
        let res = await ModuleGeneratePDF.getInstance().generatePDF(sous_rep, file_name, html, save_to_desktop, options);

        if (save_to_desktop) {
            this.saveToDisk(res, file_name);
        }

        return res;
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