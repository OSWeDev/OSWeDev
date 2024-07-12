import { Component, Prop, Watch } from 'vue-property-decorator';
import { filter } from '../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MailCategoryVO from '../../../../shared/modules/Mailer/vos/MailCategoryVO';
import MailEventVO from '../../../../shared/modules/Mailer/vos/MailEventVO';
import MailVO from '../../../../shared/modules/Mailer/vos/MailVO';
import ModuleSendInBlue from '../../../../shared/modules/SendInBlue/ModuleSendInBlue';
import { field_names, reflect } from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import PushDataVueModule from '../../modules/PushData/PushDataVueModule';
import VOEventRegistrationKey from '../../modules/PushData/VOEventRegistrationKey';
import VueComponentBase from '../VueComponentBase';
import './MailStatsEventsComponent.scss';

@Component({
    template: require('./MailStatsEventsComponent.pug'),
    components: {}
})
export default class MailStatsEventsComponent extends VueComponentBase {

    public mails: MailVO[] = null;
    public events_by_mail: { [mail_id: number]: MailEventVO[] } = null;

    @Prop({ default: null })
    private category_name: string;

    @Prop({ default: null })
    private email_to: string;

    private category: MailCategoryVO = null;

    private is_loading: boolean = true;
    private force_reload: boolean = true;

    private vo_events_registration_keys: VOEventRegistrationKey[] = [];

    private throttled_update_datas = ThrottleHelper.declare_throttle_without_args(this.update_datas.bind(this), 10, { leading: false, trailing: true });

    private throttled_update_datas_mail_events = ThrottleHelper.declare_throttle_without_args(this.update_datas_mail_events.bind(this), 10, { leading: false, trailing: true });

    @Watch('category_name', { immediate: true })
    @Watch('email_to')
    private onchange_category_name() {
        this.throttled_update_datas();
    }

    private async sendinblue_refresh_mail_events() {
        this.is_loading = true;
        for (const i in this.mails) {
            await ModuleSendInBlue.getInstance().sendinblue_refresh_mail_events(this.mails[i].id);
        }
        this.is_loading = false;
    }

    private async update_datas() {

        this.is_loading = true;

        let changed_category = false;
        if ((!this.category) || (this.category_name && (this.category_name != this.category.name))) {
            await this.unregister_all_vo_event_callbacks();
            this.category = await ModuleDAO.getInstance().getNamedVoByName<MailCategoryVO>(MailCategoryVO.API_TYPE_ID, this.category_name);
            changed_category = true;
        }

        if (!this.category) {
            this.is_loading = false;
            return;
        }

        if (changed_category || this.force_reload) {

            const filtres = [filter(MailVO.API_TYPE_ID, field_names<MailVO>().category_id).by_num_eq(this.category.id)];
            if (this.email_to) {
                filtres.push(filter(MailVO.API_TYPE_ID, field_names<MailVO>().email).by_text_eq(this.email_to));
            }

            await this.register_vo_updates_on_list(
                MailVO.API_TYPE_ID,
                reflect<this>().mails,
                filtres
            );

            await this.throttled_update_datas_mail_events();
        }

        this.is_loading = false;
    }

    private async update_datas_mail_events() {
        const promises = [];

        for (const i in this.mails) {
            const mail = this.mails[i];

            promises.push((async () => {

                await this.register_vo_updates_on_list(
                    MailEventVO.API_TYPE_ID,
                    mail.id.toString(),
                    [filter(MailEventVO.API_TYPE_ID, field_names<MailEventVO>().mail_id).by_num_eq(mail.id)],
                    null,
                    reflect<this>().events_by_mail
                );
            })());
        }
        await all_promises(promises);
    }

    get nb_mails_recus(): number {
        let res = 0;

        for (const i in this.events_by_mail) {
            const events = this.events_by_mail[i];

            for (const e in events) {
                const event = events[e];

                if (event.event == MailEventVO.EVENT_Delivre) {
                    res++;
                    break;
                }
            }
        }

        return res;
    }

    get nb_mails_ouverts(): number {
        let res = 0;

        for (const i in this.events_by_mail) {
            const events = this.events_by_mail[i];

            for (const e in events) {
                const event = events[e];

                if (event.event == MailEventVO.EVENT_Ouverture) {
                    res++;
                    break;
                }
            }
        }

        return res;
    }

    get nb_mails_clique(): number {
        let res = 0;

        for (const i in this.events_by_mail) {
            const events = this.events_by_mail[i];

            for (const e in events) {
                const event = events[e];

                if (event.event == MailEventVO.EVENT_Clic) {
                    res++;
                    break;
                }
            }
        }

        return res;
    }

    get last_event(): MailEventVO {
        let last_event = null;

        for (const i in this.events_by_mail) {
            const events = this.events_by_mail[i];

            for (const e in events) {
                const event = events[e];

                if ((!last_event) || (last_event.event_date < event.event_date)) {
                    last_event = event;
                }
            }
        }

        return last_event;
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
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