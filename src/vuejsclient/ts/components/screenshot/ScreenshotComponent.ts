
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import VueAppController from '../../../VueAppController';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';
import './ScreenshotComponent.scss';
@Component({
    template: require('./ScreenshotComponent.pug'),
    components: {}
})
export default class ScreenshotComponent extends VueComponentBase {

    private static __UID: number = 1;

    @Prop({ default: null })
    protected filevo: FileVO;
    protected has_valid_file_linked: boolean = false;

    protected uid: number = null;
    private is_taking: boolean = false;

    @Watch('filevo', { immediate: true })
    public async updateFileVo() {
        this.has_valid_file_linked = false;
        if (this.filevo && this.filevo.id) {
            this.has_valid_file_linked = await ModuleFile.getInstance().testFileExistenz(this.filevo.id);
        }
    }

    /**
     * Updates the state of the "is_taking" property.
     * If "is_taking" is true, it hides elements with the class "hide_from_screenshot".
     * If "is_taking" is false, it shows elements with the class "hide_from_screenshot".
     */
    @Watch('is_taking', { immediate: true })
    public async updateIsTaking() {
        if (this.is_taking) {
            const toHide = document.getElementsByClassName('hide_from_screenshot');
            for (let i = 0; i < toHide.length; i++) {
                const element = toHide[i] as HTMLElement;
                element.style.display = 'none';
            }
        } else {
            const toHide = document.getElementsByClassName('hide_from_screenshot');
            for (let i = 0; i < toHide.length; i++) {
                const element = toHide[i] as HTMLElement;
                element.style.display = '';
            }
        }
    }

    public async mounted() {
        this.uid = ScreenshotComponent.__UID++;
    }

    public async do_take_fullsize_screenshot() {
        this.is_taking = true;
        try {
            const canvas = await this.take_fullsize_screenshot();
            await canvas.toBlob(async (imgData) => {
                if (!imgData) {
                    this.is_taking = false;
                    // JNE : A mon avis ça arrive au chargement de l'appli si on essaie d'aller trop vite. Si c'est bloquant, on peut essayer de relancer auto la capture plus tard.
                    ConsoleHandler.error('No imgData');
                    return;
                }
                const formData = new FormData();
                formData.append('file', imgData, 'screenshot_' + VueAppController.getInstance().data_user.id + '_' + Dates.now() + '.png');

                const res = await AjaxCacheClientController.getInstance().post(
                    null,
                    '/ModuleFileServer/upload',
                    [FileVO.API_TYPE_ID],
                    formData,
                    null,
                    null,
                    false,
                    30000);

                const newvo = JSON.parse(res);

                this.$emit('uploaded', newvo);
            }, 'image/png');
            this.is_taking = false;

        } catch (error) {
            this.is_taking = false;
            // Gestion des erreurs avec des détails supplémentaires
            ConsoleHandler.error("Erreur lors de la capture de l'écran :" + JSON.stringify(error));
        }
    }

    public async do_take_video_capture() {
        this.is_taking = true;
        try {
            const canvasList = await this.take_video_capture();
            const voList = [];
            for (let i = 0; i < canvasList.length; i++) {
                this.is_taking = true;
                const canvas = canvasList[i];

                // Encapsuler canvas.toBlob dans une Promise
                const imgData = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/png');
                });

                if (!imgData) {
                    this.is_taking = false;
                    ConsoleHandler.error('No imgData');
                    return;
                }


                const formData = new FormData();
                formData.append('file', imgData, 'screenshot_' + VueAppController.getInstance().data_user.id + '_' + Dates.now() + '.png');

                const res = await AjaxCacheClientController.getInstance().post(
                    null,
                    '/ModuleFileServer/upload',
                    [FileVO.API_TYPE_ID],
                    formData,
                    null,
                    null,
                    false,
                    30000
                );

                const newvo = JSON.parse(res);
                voList.push(newvo);
                // Emettre l'événement après chaque upload réussi
                this.is_taking = false;
            }
            this.$emit('uploaded', voList);

        } catch (error) {
            this.is_taking = false;
            ConsoleHandler.error("Erreur lors de la capture de l'écran :" + JSON.stringify(error));
        }
    }



    public async take_screenshot() {
        const self = this;
        this.is_taking = true;

        try {

            const { default: html2canvas } = await import('html2canvas');

            await html2canvas(
                document.getElementById("VueMain"),
                {
                    ignoreElements: function (el: HTMLElement) {
                        return el.classList.contains('hide_from_screenshot');
                    },
                    scrollX: 0,
                    scrollY: -window.scrollY
                }
            ).then(async (canvas) => {

                try {

                    canvas.toBlob(async (imgData: Blob) => {

                        if (!imgData) {
                            self.is_taking = false;
                            // JNE : A mon avis ça arrive au chargement de l'appli si on essaie d'aller trop vite. Si c'est bloquant, on peut essayer de relancer auto la capture plus tard.
                            ConsoleHandler.error('No imgData');
                            return;
                        }

                        const formData = new FormData();
                        formData.append('file', imgData, 'screenshot_' + VueAppController.getInstance().data_user.id + '_' + Dates.now() + '.png');

                        const res = await AjaxCacheClientController.getInstance().post(
                            null,
                            '/ModuleFileServer/upload',
                            [FileVO.API_TYPE_ID],
                            formData,
                            null,
                            null,
                            false,
                            30000);

                        const newvo = JSON.parse(res);

                        self.$emit('uploaded', newvo);
                        self.is_taking = false;
                    }, 'image/png');

                } catch (error) {
                    ConsoleHandler.error(error);
                    self.is_taking = false;
                }
            });
        } catch (error) {
            ConsoleHandler.error(error);
            this.is_taking = false;
        }
    }


    private async take_fullsize_screenshot() {
        try {
            // Capture de l'écran
            let captureStream: MediaStream = (await navigator.mediaDevices as any).getDisplayMedia({ preferCurrentTab: true });
            const track = captureStream.getVideoTracks()[0];
            // let imageCapture = new ImageCapture(track);
            const image_capture = new (window as any).ImageCapture(track);
            // Capture de l'image du flux vidéo
            const imageBitmap = await image_capture.grabFrame();

            // Arrêter le flux pour libérer les ressources
            track.stop();

            // Création du canvas et dessin de l'image capturée
            const canvas = document.createElement("canvas");
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            canvas.getContext("2d").drawImage(imageBitmap, 0, 0);

            // Retourner le canvas
            return canvas;
        } catch (error) {
            ConsoleHandler.error("Erreur lors de la capture de l'écran :" + JSON.stringify(error));
            return null;
        }
    }

    private async take_video_capture() {
        try {
            // Capture de l'écran
            const capturedCanvas = [];
            const options: MediaStreamConstraints = {
                preferCurrentTab: true,
            };
            const captureStream = (await navigator.mediaDevices as MediaDevices).getDisplayMedia(options);
            const track = (await captureStream).getVideoTracks()[0];
            await this.add_countdown_element();
            for (let i = 0; i < 2; i++) {
                document.getElementById("countdown").style.display = "flex";
                await this.countdown(4);
                document.getElementById("countdown").style.display = "none";
                // const imageCapture = new ImageCapture(track);
                const image_capture = new (window as any).ImageCapture(track);
                // Capture de l'image du flux vidéo
                const imageBitmap = await image_capture.grabFrame();

                // Création du canvas et dessin de l'image capturée
                const canvas = document.createElement("canvas");
                canvas.width = imageBitmap.width;
                canvas.height = imageBitmap.height;
                canvas.getContext("2d").drawImage(imageBitmap, 0, 0);
                capturedCanvas.push(canvas);
            }

            track.stop(); // Arrêter le flux pour libérer les ressources

            // Retourner le tableau de canvas
            return capturedCanvas;
        } catch (error) {
            ConsoleHandler.error("Erreur lors de la capture de l'écran :" + JSON.stringify(error));
            return null;
        }
    }

    // Fonction de compte à rebours
    private async countdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            document.getElementById("countdown").textContent = i;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde
        }
    }

    private async add_countdown_element() {
        const main = document.getElementById("VueMain");
        const countdownText = document.createTextNode("0");
        const div = document.createElement("div");
        div.id = "countdown";
        div.appendChild(countdownText);
        div.className = "videoCapture";
        main.appendChild(div);
    }
}