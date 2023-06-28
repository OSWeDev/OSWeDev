

import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleFeedback from '../../../../shared/modules/Feedback/ModuleFeedback';
import FeedbackVO from '../../../../shared/modules/Feedback/vos/FeedbackVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import StatsController from '../../../../shared/modules/Stats/StatsController';
import VueAppController from '../../../VueAppController';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';
import ConsoleLog from '../console_logger/ConsoleLog';
import ConsoleLogLogger from '../console_logger/ConsoleLogLogger';
import FileComponent from '../file/FileComponent';
import ScreenshotComponent from '../screenshot/ScreenshotComponent';
import VueComponentBase from '../VueComponentBase';
import './FeedbackHandlerComponent.scss';
import { ModuleFeedbackAction, ModuleFeedbackGetter } from './store/FeedbackStore';
const { parse, stringify } = require('flatted/cjs');

@Component({
    template: require('./FeedbackHandlerComponent.pug'),
    components: {
        Screenshotcomponent: ScreenshotComponent,
        Filecomponent: FileComponent
    }
})
export default class FeedbackHandlerComponent extends VueComponentBase {

    @ModuleFeedbackGetter
    public get_hidden: boolean;
    @ModuleFeedbackAction
    public set_hidden: (hidden: boolean) => void;

    @Prop({ default: false })
    private show_wish_be_called;

    private tmp_user: string = null;
    private tmp_email: string = null;
    private tmp_phone: string = null;
    private tmp_type: string = null;
    private tmp_title: string = null;
    private tmp_message: string = null;
    private tmp_preferred_times_called: string = null;
    private tmp_wish_be_called: boolean = false;

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
        this.tmp_preferred_times_called = null;
        this.tmp_title = null;
        this.tmp_wish_be_called = false;

        this.tmp_start_date = Dates.now();
        this.tmp_start_url = this.$route.fullPath;

        this.tmp_attachment_1_vo = null;
        this.tmp_attachment_2_vo = null;
        this.tmp_attachment_3_vo = null;

        this.tmp_capture_1_vo = null;
        this.tmp_capture_2_vo = null;
        this.tmp_capture_3_vo = null;

        this.is_already_sending_feedback = false;
    }

    @Watch('get_hidden', { immediate: true })
    private async onchange_get_hidden() {
        // If first time, store date + url
        if (!this.tmp_start_date) {
            this.tmp_start_date = Dates.now();
            this.tmp_start_url = this.$route.fullPath;
        }

        if (!this.get_hidden && this.$refs.ScreenshotComponent1) {
            await (this.$refs.ScreenshotComponent1 as ScreenshotComponent).take_screenshot();
        }
    }

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }

    private async send_feedback() {

        StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "IN");
        let time_in: number = Dates.now_ms();

        /**
         * On empêche d'appeler à nouveau la fonction tant que l'envoi n'a pas été effectué
         * Cela permet d'éviter l'envoi multiple du ticket en spammant le btn d'envoi
         */
        if (this.is_already_sending_feedback) {
            StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "ALREADY_SENDING");
            return;
        }
        this.is_already_sending_feedback = true;

        /**
         * On vérifie :
         *  - Si on a pas de capture écran, on en fait une avant d'enregistrer
         *  - Si on a pas de titre ou de message (l'un des deux suffit) on refuse avec un snotify
         */
        if ((!this.tmp_message) || (!this.tmp_title)) {
            StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "ERROR_NO_MESSAGE_OR_TITLE");
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_message_and_title'));
            this.is_already_sending_feedback = false;
            return;
        }

        if ((!this.tmp_user) || (!this.tmp_email)) {
            StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "ERROR_NO_USER_OR_EMAIL");
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_user_and_email'));
            this.is_already_sending_feedback = false;
            return;
        }

        if ((!this.tmp_capture_1_vo) || (!this.tmp_capture_1_vo.id)) {
            StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "ERROR_NO_SCREENSHOT");
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_at_least_one_screenshot'));
            this.is_already_sending_feedback = false;
            return;
        }

        if (this.tmp_wish_be_called && (!this.tmp_phone || !this.tmp_preferred_times_called)) {
            StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "ERROR_NO_PHONE");
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_phone'));
            this.is_already_sending_feedback = false;
            return;
        }

        let feedback: FeedbackVO = new FeedbackVO();

        feedback.apis_log_json = stringify(AjaxCacheClientController.getInstance().api_logs);
        // feedback.apis_log_json = "";
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
        feedback.preferred_times_called = this.tmp_preferred_times_called;
        feedback.name = this.tmp_user;
        feedback.phone = this.tmp_phone;
        feedback.routes_fullpaths = this.routes_log_tostring_array();
        feedback.screen_capture_1_id = this.tmp_capture_1_vo ? this.tmp_capture_1_vo.id : null;
        feedback.screen_capture_2_id = this.tmp_capture_2_vo ? this.tmp_capture_2_vo.id : null;
        feedback.screen_capture_3_id = this.tmp_capture_3_vo ? this.tmp_capture_3_vo.id : null;
        feedback.title = this.tmp_title;
        feedback.wish_be_called = this.tmp_wish_be_called;

        if (!await ModuleFeedback.getInstance().feedback(feedback)) {
            this.set_hidden(true);

            StatsController.register_stat_DUREE("FeedbackHandlerComponent", "send_feedback", "ERROR_SENDING_FEEDBACK", Dates.now_ms() - time_in);
            StatsController.register_stat_COMPTEUR("FeedbackHandlerComponent", "send_feedback", "ERROR_SENDING_FEEDBACK");
            this.snotify.error(this.label('FeedbackHandlerComponent.error_sending_feedback'));
            this.is_already_sending_feedback = false;
            return;
        }

        this.set_hidden(true);
        this.is_already_sending_feedback = false;
        this.reload();
        StatsController.register_stat_DUREE("FeedbackHandlerComponent", "send_feedback", "OUT", Dates.now_ms() - time_in);
    }

    private async uploadedFile1(fileVo: FileVO) {
        //On vérifie que le format est valide afin de pouvoir être consulté sur le trello.
        if (fileVo) {
            if (!this.check_for_valid_format(fileVo.path)) {
                return;
            }
            this.set_hidden(false);
            this.tmp_attachment_1_vo = fileVo;
        } else {
            this.tmp_attachment_1_vo = fileVo;
        }
    }

    private async uploadedFile2(fileVo: FileVO) {
        if (fileVo) {
            if (!this.check_for_valid_format(fileVo.path)) {
                return;
            }
            this.tmp_attachment_2_vo = fileVo;

        } else {
            this.tmp_attachment_2_vo = fileVo;
        }
    }

    private async uploadedFile3(fileVo: FileVO) {
        if (fileVo) {

            if (!this.check_for_valid_format(fileVo.path)) {
                return;
            }
            this.tmp_attachment_3_vo = fileVo;
        } else {
            this.tmp_attachment_3_vo = fileVo;
        }
    }

    private check_for_valid_format(path: string) {
        let file_name_begin = path.lastIndexOf('/');
        let file_name_end = path.lastIndexOf('.');
        let file_name = path.slice(file_name_begin + 1, file_name_end);
        let format = /[!@#$%^&*()+\=\[\]{};':"\\|,.<>\/?]+/;

        if (format.test(file_name) || (file_name.indexOf(' ') >= 0)) {
            this.set_hidden(true);
            this.snotify.error(this.label('FeedbackHandlerComponent.file_format_error'));
            return false;
        }
        return true;
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

    private console_logs_tostring_array(keep_errors_only: boolean = true) {
        let res: string[] = [];
        let console_logs: ConsoleLog[] = ConsoleLogLogger.getInstance().console_logs;
        if (keep_errors_only) {
            //On ne conserve que les erreurs
            let console_logs_only_errors = [];
            console_logs_only_errors = console_logs.filter((item) => item.type == 'error');

            console_logs = console_logs_only_errors;
        }
        for (let i in console_logs) {
            let console_log = console_logs[i];

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