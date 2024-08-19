
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
import puppeteer from 'puppeteer';
import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import { sleep } from 'openai/core';
import { take_fullsize_screenshot } from './ScreenshotComponentRun';

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

    public async mounted() {
        this.uid = ScreenshotComponent.__UID++;
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

    public async do_take_fullsize_screenshot() {
        this.is_taking = true;
        try {
            const canvas = await take_fullsize_screenshot();
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
                this.is_taking = false;
            }, 'image/png');
        } catch (error) {
            this.is_taking = false;
            // Gestion des erreurs avec des détails supplémentaires
            ConsoleHandler.error("Erreur lors de la capture de l'écran :", error);
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
                }).then(
                    async (canvas) => {

                        try {

                            const height = canvas.height;
                            const width = canvas.width;

                            const coef_height = ((height > (210 - 20)) ? (210 - 20) / height : 1);
                            const coef_width = ((width > (297 - 20)) ? (297 - 20) / width : 1);
                            const coef = (coef_height < coef_width) ? coef_height : coef_width;
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
}