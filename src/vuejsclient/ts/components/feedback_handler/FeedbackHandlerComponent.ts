

import Component from 'vue-class-component';
import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import VueAppController from '../../../VueAppController';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';
import ConsoleLogLogger from '../console_logger/ConsoleLogLogger';
import FileComponent from '../file/FileComponent';
import ScreenshotComponent from '../screenshot/ScreenshotComponent';
import VueComponentBase from '../VueComponentBase';
import './FeedbackHandlerComponent.scss';
const { parse, stringify } = require('flatted/cjs');

@Component({
    template: require('./FeedbackHandlerComponent.pug'),
    components: {
        Screenshotcomponent: ScreenshotComponent,
        Filecomponent: FileComponent
    }
})
export default class FeedbackHandlerComponent extends VueComponentBase {

    private hidden: boolean = true;

    private tmp_user: string = null;
    private tmp_email: string = null;
    private tmp_phone: string = null;
    private tmp_type: string = null;
    private tmp_title: string = null;
    private tmp_message: string = null;

    private tmp_capture_1_vo: FileVO = null;
    private tmp_capture_2_vo: FileVO = null;
    private tmp_capture_3_vo: FileVO = null;

    private tmp_attachment_1_vo: FileVO = null;
    private tmp_attachment_2_vo: FileVO = null;
    private tmp_attachment_3_vo: FileVO = null;

    private tmp_start_date: number = null;
    private tmp_start_url: string = null;

    private is_already_sending_feedback: boolean = false;

    private mounted() {
        this.reload();
    }

    private reload() {
        this.tmp_user = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user.name : null;
        this.tmp_email = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user.email : null;
        this.tmp_phone = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user.phone : null;
        this.tmp_type = '' + FeedbackVO.FEEDBACK_TYPE_NOT_SET;

        this.tmp_message = null;
        this.tmp_title = null;

        this.tmp_start_date = null;
        this.tmp_start_url = null;

        this.tmp_attachment_1_vo = null;
        this.tmp_attachment_2_vo = null;
        this.tmp_attachment_3_vo = null;

        this.tmp_capture_1_vo = null;
        this.tmp_capture_2_vo = null;
        this.tmp_capture_3_vo = null;

        this.is_already_sending_feedback = false;
    }

    private switch_hidden() {

        // If first time, store date + url
        if (!this.tmp_start_date) {
            this.tmp_start_date = Dates.now();
            this.tmp_start_url = this.$route.fullPath;
        }

        this.hidden = !this.hidden;
    }

    private async send_feedback() {

        /**
         * On empêche d'appeler à nouveau la fonction tant que l'envoi n'a pas été effectué
         * Cela permet d'éviter l'envoi multiple du ticket en spammant le btn d'envoi
         */
        if (this.is_already_sending_feedback) {
            return;
        }
        this.is_already_sending_feedback = true;

        /**
         * On vérifie :
         *  - Si on a pas de capture écran, on en fait une avant d'enregistrer
         *  - Si on a pas de titre ou de message (l'un des deux suffit) on refuse avec un snotify
         */
        if ((!this.tmp_message) || (!this.tmp_title)) {
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_message_and_title'));
            this.is_already_sending_feedback = false;
            return;
        }

        if ((!this.tmp_user) || (!this.tmp_email)) {
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_user_and_email'));
            this.is_already_sending_feedback = false;
            return;
        }

        if ((!this.tmp_capture_1_vo) || (!this.tmp_capture_1_vo.id)) {
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_at_least_one_screenshot'));
            this.is_already_sending_feedback = false;
            return;
        }

        let feedback: FeedbackVO = new FeedbackVO();

        feedback.apis_log_json = stringify(AjaxCacheClientController.getInstance().api_logs);
        feedback.console_logs = this.console_logs_tostring_array();
        feedback.email = this.tmp_email;
        feedback.feedback_end_date = Dates.now();
        feedback.feedback_end_url = this.$route.fullPath;
        feedback.feedback_start_date = this.tmp_start_date;
        feedback.feedback_start_url = this.tmp_start_url;
        feedback.feedback_type = parseInt(this.tmp_type);
        feedback.file_attachment_1_id = this.tmp_attachment_1_vo ? this.tmp_attachment_1_vo.id : null;
        feedback.file_attachment_2_id = this.tmp_attachment_2_vo ? this.tmp_attachment_2_vo.id : null;
        feedback.file_attachment_3_id = this.tmp_attachment_3_vo ? this.tmp_attachment_3_vo.id : null;
        feedback.message = this.tmp_message;
        feedback.name = this.tmp_user;
        feedback.phone = this.tmp_phone;
        feedback.routes_fullpaths = this.routes_log_tostring_array();
        feedback.screen_capture_1_id = this.tmp_capture_1_vo ? this.tmp_capture_1_vo.id : null;
        feedback.screen_capture_2_id = this.tmp_capture_2_vo ? this.tmp_capture_2_vo.id : null;
        feedback.screen_capture_3_id = this.tmp_capture_3_vo ? this.tmp_capture_3_vo.id : null;
        feedback.title = this.tmp_title;

        if (!await ModuleFeedback.getInstance().feedback(feedback)) {
            this.snotify.error(this.label('FeedbackHandlerComponent.error_sending_feedback'));
            this.is_already_sending_feedback = false;
            return;
        }

        this.hidden = true;
        this.is_already_sending_feedback = false;
        this.reload();
    }

    private async uploadedFile1(fileVo: FileVO) {
        this.tmp_attachment_1_vo = fileVo;
    }

    private async uploadedFile2(fileVo: FileVO) {
        this.tmp_attachment_2_vo = fileVo;
    }

    private async uploadedFile3(fileVo: FileVO) {
        this.tmp_attachment_3_vo = fileVo;
    }

    private async uploadedCapture1(fileVo: FileVO) {
        this.tmp_capture_1_vo = fileVo;
    }

    private async uploadedCapture2(fileVo: FileVO) {
        this.tmp_capture_2_vo = fileVo;
    }

    private async uploadedCapture3(fileVo: FileVO) {
        this.tmp_capture_3_vo = fileVo;
    }

    private console_logs_tostring_array() {
        let res: string[] = [];

        for (let i in ConsoleLogLogger.getInstance().console_logs) {
            let console_log = ConsoleLogLogger.getInstance().console_logs[i];

            res.push(Dates.format(console_log.datetime, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss) + ':' + console_log.type + ':' + (console_log.value ? console_log.value.toString() : ''));
        }

        return res;
    }

    private routes_log_tostring_array() {
        let res: string[] = [];

        for (let i in VueAppController.getInstance().routes_log) {
            let route_log = VueAppController.getInstance().routes_log[i];

            res.push(route_log.fullPath);
        }

        return res;
    }

    get isActive(): boolean {
        return ModuleFeedback.getInstance().actif && VueAppController.getInstance().has_access_to_feedback;
    }
}