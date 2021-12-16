import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MailCategoryVO from '../../../../shared/modules/Mailer/vos/MailCategoryVO';
import MailEventVO from '../../../../shared/modules/Mailer/vos/MailEventVO';
import MailVO from '../../../../shared/modules/Mailer/vos/MailVO';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../VueComponentBase';
import './MailStatsEventsComponent.scss';

@Component({
    template: require('./MailStatsEventsComponent.pug'),
    components: {}
})
export default class MailStatsEventsComponent extends VueComponentBase {

    @Prop({ default: null })
    private category_name: string;

    @Prop({ default: null })
    private email_to: string;

    private category: MailCategoryVO = null;
    private mails: MailVO[] = null;
    private events_by_mail: { [mail_id: number]: MailEventVO[] } = null;

    private last_event: MailEventVO = null;
    private nb_mails_recus: number = 0;
    private nb_mails_ouverts: number = 0;
    private nb_mails_clique: number = 0;

    private is_loading: boolean = true;
    private force_reload: boolean = true;

    private throttled_update_datas = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_datas.bind(this), 200, { leading: false, trailing: true });

    @Watch('category_name', { immediate: true })
    private onchange_category_name() {
        this.throttled_update_datas();
    }

    private async sendinblue_refresh_mail_events() {
        if (!this.last_event) {
            return;
        }

        this.is_loading = true;
        for (let i in this.mails) {
            await ModuleSendInBlue.getInstance().sendinblue_refresh_mail_events(this.mails[i].id);
        }
        this.force_reload = true;
        await this.throttled_update_datas();
    }

    private async update_datas() {

        this.is_loading = true;

        let changed_category = false;
        if ((!this.category) || (this.category_name && (this.category_name != this.category.name))) {
            this.category = await ModuleDAO.getInstance().getNamedVoByName<MailCategoryVO>(MailCategoryVO.API_TYPE_ID, this.category_name);
            changed_category = true;
        }

        if (!this.category) {
            this.is_loading = false;
            return;
        }

        if (changed_category || this.force_reload) {
            if (this.email_to) {
                this.mails = await ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString<MailVO>(
                    MailVO.API_TYPE_ID, 'category_id', [this.category.id],
                    'email', [this.email_to]);
            } else {
                this.mails = await ModuleDAO.getInstance().getVosByRefFieldIds<MailVO>(
                    MailVO.API_TYPE_ID, 'category_id', [this.category.id]);
            }

            let promises = [];
            let events_by_mail: { [mail_id: number]: MailEventVO[] } = {};
            let last_event = null;
            let mails_recus: { [mail_id: number]: boolean } = {};
            let mails_ouverts: { [mail_id: number]: boolean } = {};
            let mails_clique: { [mail_id: number]: boolean } = {};
            for (let i in this.mails) {
                let mail = this.mails[i];

                promises.push((async () => {
                    let events = await ModuleDAO.getInstance().getVosByRefFieldIds<MailEventVO>(MailEventVO.API_TYPE_ID, 'mail_id', [mail.id]);
                    events_by_mail[mail.id] = events;
                    for (let e in events) {
                        let event = events[e];

                        if ((!last_event) || (last_event.event_date < event.event_date)) {
                            last_event = event;
                        }

                        switch (event.event) {
                            case MailEventVO.EVENT_Ouverture:
                                mails_ouverts[mail.id] = true;
                                break;
                            case MailEventVO.EVENT_Clic:
                                mails_clique[mail.id] = true;
                                break;
                            case MailEventVO.EVENT_Delivre:
                                mails_recus[mail.id] = true;
                                break;
                        }
                    }
                })());
            }
            await Promise.all(promises);

            this.events_by_mail = events_by_mail;
            this.last_event = last_event;
            this.nb_mails_recus = Object.keys(mails_recus).length;
            this.nb_mails_ouverts = Object.keys(mails_ouverts).length;
            this.nb_mails_clique = Object.keys(mails_clique).length;
        }

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
        if (!this.category) {
            return null;
        }

        let res = "<b>Statistiques</b><hr>Type de mails: <b>" + this.label(this.category_name) + "</b>";

        if (this.email_to) {
            res += "<br>Destinataire: <b>" + this.email_to + "</b>";
        }

        if (this.mails && this.mails.length) {
            res += "<br>Nombre de mails : <b>" + this.mails.length + "</b>";
            res += "<br>&nbsp;&nbsp;- dont reçus : <b>" + this.nb_mails_recus + "</b>";
            res += "<br>&nbsp;&nbsp;- dont ouverts : <b>" + this.nb_mails_ouverts + "</b>";
            res += "<br>&nbsp;&nbsp;- dont cliqués : <b>" + this.nb_mails_clique + "</b>";
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
                return 'fa-clock-o'; // blue
            case MailEventVO.EVENT_Error:
                return 'fa-exclamation-circle'; // red
            case MailEventVO.EVENT_Hard_bounce:
                return 'fa-chain-broken'; // red
            case MailEventVO.EVENT_Initie:
                return 'fa-clock-o'; // blue
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