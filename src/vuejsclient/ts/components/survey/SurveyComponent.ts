

import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleSurvey from '../../../../shared/modules/Survey/ModuleSurvey';
import SurveyVO from '../../../../shared/modules/Survey/vos/SurveyVO';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import VueAppController from '../../../VueAppController';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';
import ConsoleLogLogger from '../console_logger/ConsoleLogLogger';
import FileComponent from '../file/FileComponent';
import ScreenshotComponent from '../screenshot/ScreenshotComponent';
import VueComponentBase from '../VueComponentBase';
import './SurveyComponent.scss';
import { ModuleSurveyAction, ModuleSurveyGetter } from './store/SurveyStore';
const { parse, stringify } = require('flatted/cjs');

@Component({
    template: require('./SurveyComponent.pug'),
    components: {
        Screenshotcomponent: ScreenshotComponent,
        Filecomponent: FileComponent
    }
})
export default class SurveyComponent extends VueComponentBase {

    @ModuleSurveyGetter
    public get_hidden: boolean;
    @ModuleSurveyAction
    public set_hidden: (hidden: boolean) => void;

    @Prop({ default: false })
    private show_wish_be_called;

    private tmp_user: string = null;
    private tmp_email: string = null;
    private tmp_phone: string = null;
    private tmp_type: string = null;
    private tmp_message: string = null;
    private tmp_preferred_times_called: string = null;
    private tmp_wish_be_called: boolean = false;


    private tmp_start_date: number = null;
    private tmp_start_url: string = null;

    private is_already_sending_survey: boolean = false;

    private mounted() {
        this.reload();
    }

    private reload() {
        this.tmp_user = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user.name : null;
        this.tmp_email = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user.email : null;
        this.tmp_phone = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user.phone : null;
        this.tmp_type = '' + SurveyVO.SURVEY_TYPE_NOT_SET;

        this.tmp_message = null;
        this.tmp_preferred_times_called = null;
        this.tmp_wish_be_called = false;

        this.tmp_start_date = Dates.now();
        this.tmp_start_url = this.$route.fullPath;



        this.is_already_sending_survey = false;
    }

    @Watch('get_hidden', { immediate: true })
    private onchange_get_hidden() {
        // If first time, store date + url
        if (!this.tmp_start_date) {
            this.tmp_start_date = Dates.now();
            this.tmp_start_url = this.$route.fullPath;
        }
    }

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }

    private async send_survey() {

        /**
         * On empêche d'appeler à nouveau la fonction tant que l'envoi n'a pas été effectué
         * Cela permet d'éviter l'envoi multiple du ticket en spammant le btn d'envoi
         */
        if (this.is_already_sending_survey) {
            return;
        }
        this.is_already_sending_survey = true;

        /**
         * On vérifie :
         *  - Si on a bien un avis
         * //TODO Label du message d'erreur -> "Pas d'avis donné"
         */
        if ((!this.tmp_type)) {
            this.snotify.error(this.label('FeedbackHandlerComponent.needs_message_and_title'));
            this.is_already_sending_survey = false;
            return;
        }


        let survey: SurveyVO = new SurveyVO();


        survey.survey_end_url = this.$route.fullPath;
        survey.survey_start_url = this.tmp_start_url;
        survey.survey_type = parseInt(this.tmp_type);
        survey.message = this.tmp_message;


        if (!await ModuleSurvey.getInstance().survey(survey)) {
            this.snotify.error(this.label('FeedbackHandlerComponent.error_sending_feedback'));
            this.is_already_sending_survey = false;
            return;
        }

        this.set_hidden(true);
        this.is_already_sending_survey = false;
        this.reload();
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
        let f = ModuleSurvey.getInstance().actif;
        let g = VueAppController.getInstance().has_access_to_survey;
        return ModuleSurvey.getInstance().actif && VueAppController.getInstance().has_access_to_survey;
    }
}