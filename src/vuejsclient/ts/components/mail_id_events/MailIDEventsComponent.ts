import { Component, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MailEventVO from '../../../../shared/modules/Mailer/vos/MailEventVO';
import MailVO from '../../../../shared/modules/Mailer/vos/MailVO';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';
import VueComponentBase from '../VueComponentBase';
import './MailIDEventsComponent.scss';

@Component({
    template: require('./MailIDEventsComponent.pug'),
    components: {}
})
export default class MailIDEventsComponent extends VueComponentBase {

    @Prop({ default: null })
    private mail_id: number;

    private mail: MailVO = null;
    private mail_events: MailEventVO[] = null;

    private last_event: MailEventVO = null;
    private is_loading: boolean = true;

    private throttled_update_datas = ThrottleHelper.declare_throttle_without_args(this.update_datas.bind(this), 200, { leading: false, trailing: true });

    @Watch('mail_id', { immediate: true })
    private onchange_category_name() {
        this.throttled_update_datas();
    }

    private async update_datas() {

        this.is_loading = true;

        if (!this.mail_id) {
            this.is_loading = false;
            this.mail_events = null;
            this.mail = null;
            return;
        }

        this.mail = await query(MailVO.API_TYPE_ID).filter_by_id(this.mail_id).select_vo<MailVO>();

        let last_event = null;

        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([MailEventVO.API_TYPE_ID]);

        this.mail_events = await query(MailEventVO.API_TYPE_ID).filter_by_id(this.mail_id, MailVO.API_TYPE_ID).select_vos<MailEventVO>();

        for (let e in this.mail_events) {
            let event = this.mail_events[e];

            if ((!last_event) || (last_event.event_date < event.event_date)) {
                last_event = event;
            }
        }

        this.last_event = last_event;
        this.is_loading = false;
    }

    get last_event_class() {
        if (!this.last_event) {
            return 'no_event';
        }

        switch (this.last_event.event) {
            case MailEventVO.EVENT_Bloque:
                return 'bloque';
            case MailEventVO.EVENT_Clic:
                return 'clic';
            case MailEventVO.EVENT_Delivre:
                return 'delivre';
            case MailEventVO.EVENT_Desinscrit:
                return 'desinscrit';
            case MailEventVO.EVENT_Differe:
                return 'differe';
            case MailEventVO.EVENT_Email_invalide:
                return 'email_invalide';
            case MailEventVO.EVENT_Envoye:
                return 'envoye';
            case MailEventVO.EVENT_Error:
                return 'error';
            case MailEventVO.EVENT_Hard_bounce:
                return 'hard_bounce';
            case MailEventVO.EVENT_Initie:
                return 'initie';
            case MailEventVO.EVENT_Ouverture:
                return 'ouverture';
            case MailEventVO.EVENT_Plainte:
                return 'plainte';
            case MailEventVO.EVENT_Soft_bounce:
                return 'soft_bounce';
        }

        return null;
    }

    get tooltip() {

        let res = '';
        if (this.mail.email) {
            res += "Destinataire: <b>" + this.mail.email + "</b>";
        }

        if (this.last_event) {
            res += "<br>Mise à jour: <b>" + Dates.format(this.last_event.event_date, 'DD/MM/YYYY HH:mm:ss', true) + "</b>";
            res += "<br>Dernier état: <b>" + this.t(MailEventVO.EVENT_NAMES[this.last_event.event]) + "</b>";
            if (this.last_event.reason) {
                res += "<br>Raison: <b>" + this.last_event.reason + "</b>";
            }
        }

        return res;
    }

    get fa_icon() {
        if (!this.last_event) {
            return 'fa-times'; // light-grey
        }

        switch (this.last_event.event) {
            case MailEventVO.EVENT_Bloque:
                return 'fa-ban'; // red
            case MailEventVO.EVENT_Clic:
                return 'fa-mouse-pointer'; // green
            case MailEventVO.EVENT_Delivre:
                return 'fa-envelope'; // green
            case MailEventVO.EVENT_Desinscrit:
                return 'fa-exclamation-circle'; // orange
            case MailEventVO.EVENT_Differe:
                return 'fa-pause'; // orange
            case MailEventVO.EVENT_Email_invalide:
                return 'fa-home'; // red
            case MailEventVO.EVENT_Envoye:
                return 'fa-clock'; // blue
            case MailEventVO.EVENT_Error:
                return 'fa-exclamation-circle'; // red
            case MailEventVO.EVENT_Hard_bounce:
                return 'fa-chain-broken'; // red
            case MailEventVO.EVENT_Initie:
                return 'fa-clock'; // blue
            case MailEventVO.EVENT_Ouverture:
                return 'fa-envelope-open'; // green
            case MailEventVO.EVENT_Plainte:
                return 'fa-exclamation-circle'; // violet
            case MailEventVO.EVENT_Soft_bounce:
                return 'fa-chain-broken'; // orange
        }

        return null;
    }

}