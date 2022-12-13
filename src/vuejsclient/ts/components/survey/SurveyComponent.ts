

import Component from 'vue-class-component';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
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
import VersionedVOController from '../../../../shared/modules/Versioned/VersionedVOController';
import IServerUserSession from '../../../../server/IServerUserSession';
import ModuleAccessPolicyServer from '../../../../server/modules/AccessPolicy/ModuleAccessPolicyServer';

const { parse, stringify } = require('flatted/cjs');
/*
TODO survey ouvert ou pas en fonction du route_name
    combien de temps,
    detection de sortie
    smiley

*/
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


    private tmp_type: string = null;
    private tmp_message: string = null;
    private pop_up: boolean = false; //Si la page pop up ou non
    private time_before_pop_up: number = 0;
    private route_name_ok: boolean = false; //la route est acceptée ?
    private already_submitted: boolean = false;

    private is_already_sending_survey: boolean = false;

    private mounted() {
        //Ici on récupère pop_up - time_before_pop_up - route_name et si le user_id est dans l'autre table
        this.reload();
        let user_session: IServerUserSession = ModuleAccessPolicyServer.getInstance().getUserSession();
        let user_id = user_session.uid;

        let tables = VersionedVOController.getInstance().registeredModuleTables;
        let table_survey_param = VersionedVOController.getInstance().get_registeredModuleTables_by_vo_type("surveyParam");
        //let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[context_query.base_api_type_id];

    }

    private reload() {

        this.tmp_type = '' + SurveyVO.SURVEY_TYPE_NOT_SET;

        this.tmp_message = null;


        this.is_already_sending_survey = false;
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


        survey.survey_route_name = this.$route.name;
        survey.survey_type = parseInt(this.tmp_type);
        survey.message = this.tmp_message;

        // let result: SurveyVO = await query(SurveyVO.API_TYPE_ID).filter_by_num_eq('user_id', 1448).select_vo<SurveyVO>();
        let roles = await query(SurveyVO.API_TYPE_ID).select_vos();


        if (!await ModuleSurvey.getInstance().survey(survey)) {
            this.set_hidden(true);
            this.snotify.error(this.label('FeedbackHandlerComponent.error_sending_feedback'));
            this.is_already_sending_survey = false;
            return;
        }

        this.set_hidden(true);
        this.is_already_sending_survey = false;
        this.reload();
    }


    get isActive(): boolean {
        return ModuleSurvey.getInstance().actif && VueAppController.getInstance().has_access_to_survey;
    }
}