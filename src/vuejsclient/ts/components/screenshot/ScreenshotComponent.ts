import moment = require('moment');
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ScreenshotComponent.scss';
import VueAppController from '../../../VueAppController';
let html2canvas = require('html2canvas');

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

    public async take_screenshot() {
        let self = this;
        this.is_taking = true;

        try {

            html2canvas(
                document.getElementById("VueMain"),
                {
                    ignoreElements: function (el: HTMLElement) {
                        return el.classList.contains('hide_from_screenshot');
                    }
                }).then(
                    async (canvas) => {

                        try {

                            var height = canvas.height;
                            var width = canvas.width;

                            var coef_height = ((height > (210 - 20)) ? (210 - 20) / height : 1);
                            var coef_width = ((width > (297 - 20)) ? (297 - 20) / width : 1);
                            var coef = (coef_height < coef_width) ? coef_height : coef_width;
                            canvas.toBlob(async (imgData: Blob) => {

                                let formData = new FormData();
                                formData.append('file', imgData, 'screenshot_' + VueAppController.getInstance().data_user.id + '_' + moment().utc(true).unix() + '.png');

                                let res = await ModuleAjaxCache.getInstance().post(
                                    '/ModuleFileServer/upload',
                                    [FileVO.API_TYPE_ID],
                                    formData,
                                    null,
                                    null,
                                    false,
                                    30000);

                                let newvo = JSON.parse(res);

                                self.$emit('uploaded', newvo);
                                self.is_taking = false;
                            }, 'image/png');

                        } catch (error) {
                            ConsoleHandler.getInstance().error(error);
                            self.is_taking = false;
                        }
                    });
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            this.is_taking = false;
        }
    }
}