

import { throttle } from 'lodash';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleSurvey from '../../../../shared/modules/Survey/ModuleSurvey';
import SurveyParamVO from '../../../../shared/modules/Survey/vos/SurveyParamVO';
import SurveyVO from '../../../../shared/modules/Survey/vos/SurveyVO';
import VueAppController from '../../../VueAppController';
import FileComponent from '../file/FileComponent';
import ScreenshotComponent from '../screenshot/ScreenshotComponent';
import VueComponentBase from '../VueComponentBase';
import { ModuleSurveyAction, ModuleSurveyGetter } from './store/SurveyStore';
import './SurveyComponent.scss';

/*
TODO survey ouvert ou pas en fonction du route_name ok
    combien de temps, ok
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


    private tmp_type: number = null;
    private tmp_message: string = null;
    private pop_up: boolean = false; //Si la page pop up ou non
    private time_before_pop_up: number = 0;
    private need_a_survey: SurveyParamVO = null; //la route est acceptée ?
    private already_submitted: SurveyVO = null;
    private user: UserVO = null;
    private is_already_sending_survey: boolean = false;
    private throttled_retry = throttle(this.define_survey, 100, { leading: false });
    private display_survey: boolean = false;

    @Watch('$route.name', { immediate: true })
    private onchange_route_name() {


        this.throttled_retry();

    }

    private async define_survey() {
        // console.log("Changement de route !");

        try {
            this.set_hidden(true); //On fait en sorte de cacher l'enquête dès qu'il y a changement de page.

            if (this.$route.name) {
                this.tmp_type = null;
                //Le survey apparaît-il-sur cette page ?
                this.need_a_survey = await query(SurveyParamVO.API_TYPE_ID).filter_by_text_eq('route_name', this.$route.name).select_vo<SurveyParamVO>();

                if (this.need_a_survey) {
                    //L'utilisateur a-t-il déjà complété ce survey ?
                    this.user = await ModuleAccessPolicy.getInstance().getSelfUser();
                    let user_id = this.user.id;
                    this.already_submitted = await query(SurveyVO.API_TYPE_ID).filter_by_num_eq('user_id', user_id).filter_by_text_eq('route_name', this.$route.name).select_vo<SurveyVO>();
                }

                //Si le survey est autorisé à apparaître : Est-ce un pop-up ? Si oui Combien de temps avant d'apparaître ?
                if (this.need_a_survey && !this.already_submitted) {
                    this.pop_up = this.need_a_survey.pop_up;
                    if (this.pop_up) {
                        this.time_before_pop_up = this.need_a_survey.time_before_pop_up * 1000; //En ms
                        setTimeout(this.turn_on, this.time_before_pop_up);

                    }
                    this.display_survey = true;
                } else {
                    this.display_survey = false;
                }
            }

        } catch (e) {
            this.display_survey = false;
            console.log("Erreur lors du chargement de l'enquête");
        }
    }

    private async mounted() {
        this.reload();
    }

    private reload() {

        this.set_hidden(true); //On fait en sorte de cacher l'enquête dès qu'il y a changement de page.

        this.tmp_type = null;

        this.tmp_message = null;

        this.is_already_sending_survey = false;
    }

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }


    private turn_on() {
        /* Pareil que switch_hidden , simplement ne fonctionne que si la fenêtre est fermée.*/
        if (this.get_hidden == true) {
            this.set_hidden(!this.get_hidden);
        }

    }


    private give_opinion(opinion: number) {
        this.tmp_type = opinion;
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
         *
         */
        if ((this.tmp_type == null)) {
            this.snotify.error(this.label('survey.needs_opinion'));
            this.reload();
            this.is_already_sending_survey = false;
            return;
        }


        let survey: SurveyVO = new SurveyVO();


        survey.route_name = this.$route.name;
        survey.survey_type = this.tmp_type;
        survey.message = this.tmp_message;


        if (!await ModuleSurvey.getInstance().survey(survey)) {
            this.set_hidden(true);
            this.snotify.error(this.label('survey.error_sending_feedback'));
            this.is_already_sending_survey = false;
            return;
        }

        this.is_already_sending_survey = false;
        this.display_survey = false; //L'enquête disparaît à tout jamais
        this.reload();
    }


    get isActive(): boolean {
        return ModuleSurvey.getInstance().actif && VueAppController.getInstance().has_access_to_survey;
    }

    get active_survey(): boolean {
        return this.display_survey;
    }
}
