

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
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import SurveyParamVO from '../../../../shared/modules/Survey/vos/SurveyParamVO';

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
    //TODO
    /* Passer par un watcher
    Mettre un throttle (10 ms même si on change 4 fois de routes)
    Une fois que la route n'est pas nulle , aller checker.
    Boucler la survey si rien du tout
    */

    @ModuleSurveyGetter
    public get_hidden: boolean;
    @ModuleSurveyAction
    public set_hidden: (hidden: boolean) => void;


    private tmp_type: string = null;
    private tmp_message: string = null;
    private pop_up: boolean = false; //Si la page pop up ou non
    private time_before_pop_up: number = 0;
    private need_a_survey: SurveyParamVO = null; //la route est acceptée ?
    private already_submitted: SurveyVO[] = null;
    private user: UserVO = null;

    private is_already_sending_survey: boolean = false;

    @Watch('this.$route.name')
    private onchange_route_name() {
        console.log("Changement de route !");
    }
    private async mounted() {
        //Ici on récupère pop_up - time_before_pop_up - route_name et si le user_id est dans l'autre table
        this.reload();

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

        //TODO L'enregistrement du message doit être optionnel.
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

        let roles = await query(SurveyVO.API_TYPE_ID).select_vos();
        this.need_a_survey = await query(SurveyParamVO.API_TYPE_ID).filter_by_text_eq('survey_route_name', this.$route.name).select_vo<SurveyParamVO>();
        let ss = await query(SurveyParamVO.API_TYPE_ID).select_vos();

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
    get does_appear(): any {
        try {
            return (async () => {
                //Le survey apparaît-il-sur cette page ?
                this.need_a_survey = await query(SurveyParamVO.API_TYPE_ID).filter_by_text_eq('route_name', this.$route.name).select_vo<SurveyParamVO>();

                if (this.need_a_survey) {
                    //L'utilisateur a-t-il déjà complété ce survey ?
                    this.user = await ModuleAccessPolicy.getInstance().getSelfUser();
                    let user_id = this.user.id;
                    this.already_submitted = await query(SurveyVO.API_TYPE_ID).filter_by_num_eq('user_id', user_id).filter_by_text_eq('survey_route_name', this.$route.name).select_vos<SurveyVO>();
                }

                //Si le survey est autorisé à apparaître : Est-ce un pop-up ? -Si oui Combien de temps avant d'apparaître ?
                if (this.need_a_survey && !this.already_submitted) {
                    this.pop_up = this.need_a_survey.pop_up;
                    if (this.pop_up) {
                        this.time_before_pop_up = this.need_a_survey.time_before_pop_up;
                    }
                    return true;
                } else {
                    return false;
                }
            })();
        } catch (e) {
            return 0;  // fallback value
        }
    }
}