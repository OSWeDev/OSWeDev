import { Component, Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import EventsController from '../../../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerInstanceVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../../../../shared/modules/Oselia/ModuleOselia';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import ModuleProgramPlanBase from '../../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueAppController from '../../../../../VueAppController';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleDAOGetter } from '../../../dao/store/DaoStore';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import ProgramPlanTools from '../../ProgramPlanTools';
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import ProgramPlanComponentModalTargetInfos from '../target_infos/ProgramPlanComponentModalTargetInfos';
import "./ProgramPlanComponentModalCR.scss";
import OseliaRealtimeController from '../../../dashboard_builder/widgets/oselia_thread_widget/OseliaRealtimeController';
import EnvHandler from '../../../../../../shared/tools/EnvHandler';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleGPT from '../../../../../../shared/modules/GPT/ModuleGPT';
import OseliaController from '../../../../../../shared/modules/Oselia/OseliaController';
import GPTRealtimeAPISessionVO from '../../../../../../shared/modules/GPT/vos/GPTRealtimeAPISessionVO';
import OseliaRunTemplateVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
const debounce = require('lodash/debounce');

@Component({
    template: require('./ProgramPlanComponentModalCR.pug'),
    components: {
        field: VueFieldComponent,
        Programplancomponentmodaltargetinfos: ProgramPlanComponentModalTargetInfos,
    }
})
export default class ProgramPlanComponentModalCR extends VueComponentBase {

    @ModuleProgramPlanGetter
    public can_edit_any: boolean;
    @ModuleProgramPlanGetter
    public can_edit_all: boolean;
    @ModuleProgramPlanGetter
    public can_edit_own_team: boolean;
    @ModuleProgramPlanGetter
    public can_edit_self: boolean;

    @ModuleProgramPlanGetter
    public getEnseignesByIds: { [id: number]: IPlanEnseigne };

    @ModuleProgramPlanGetter
    public getTargetsByIds: { [id: number]: IPlanTarget };

    @ModuleProgramPlanGetter
    public getFacilitatorsByIds: { [id: number]: IPlanFacilitator };

    @ModuleProgramPlanGetter
    public getManagersByIds: { [id: number]: IPlanManager };

    @ModuleProgramPlanGetter
    public getRdvsByIds: { [id: number]: IPlanRDV };

    @ModuleProgramPlanGetter
    public getCrsByIds: { [id: number]: IPlanRDVCR };

    @ModuleProgramPlanGetter
    public getPartnersByIds: { [id: number]: IPlanPartner };

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleProgramPlanAction
    public setCrById: (cr: IPlanRDVCR) => void;

    @ModuleProgramPlanAction
    public updateCr: (cr: IPlanRDVCR) => void;

    @ModuleProgramPlanAction
    public removeCr: (id: number) => void;

    @ModuleProgramPlanAction
    public updateRdv: (rdv: IPlanRDV) => void;

    @Prop()
    public selected_rdv: IPlanRDV;

    @Prop({
        default: false
    })
    private block_edition: boolean;

    @Prop({ default: null })
    private program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    private program_plan_controller: ProgramPlanControllerBase;

    private user = VueAppController.getInstance().data_user;

    // Modal
    private newcr_seemore: boolean = false;
    private cr_html_content: string = null;

    private edited_cr: IPlanRDVCR = null;
    private oselia_opened: boolean = false;
    private debounced_update_cr_action = debounce(this.update_cr_action, 1000);
    private POLICY_CAN_USE_REALTIME: boolean = false;
    private in_edit_inline: boolean = false;
    private revertToPreviousVersionBool: boolean = false;
    private revertToNextVersionBool: boolean = false;

    // Propriétés réactives pour l'état des boutons de versioning
    private can_go_to_previous_version: boolean = false;
    private can_go_to_next_version: boolean = false;
    private versioningStateUpdateTimer: NodeJS.Timer = null;

    get custom_cr_create_component() {
        return this.program_plan_controller.customCRCreateComponent;
    }

    get custom_cr_read_component() {
        return this.program_plan_controller.customCRReadComponent;
    }

    get custom_cr_update_component() {
        return this.program_plan_controller.customCRUpdateComponent;
    }


    get target(): IPlanTarget {
        if ((!this.selected_rdv) || (!this.selected_rdv.target_id)) {
            return null;
        }

        return this.getTargetsByIds[this.selected_rdv.target_id] as IPlanTarget;
    }

    get selected_rdv_cr(): IPlanRDVCR {
        if (!this.selected_rdv) {
            return null;
        }

        for (const i in this.getCrsByIds) {
            const cr: IPlanRDVCR = this.getCrsByIds[i] as IPlanRDVCR;

            if (cr.rdv_id == this.selected_rdv.id) {
                return cr;
            }
        }
        return null;
    }

    get facilitatorAndManagerName() {
        return this.facilitatorName + (this.managerName ? " / " + this.managerName : "");
    }

    get facilitatorName() {
        if (!this.selected_rdv) {
            return null;
        }

        const facilitator: IPlanFacilitator = this.getFacilitatorsByIds[this.selected_rdv.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        return ProgramPlanTools.getResourceName(facilitator.firstname, facilitator.lastname);
    }

    get managerName() {
        if (!this.selected_rdv) {
            return null;
        }

        const facilitator: IPlanFacilitator = this.getFacilitatorsByIds[this.selected_rdv.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        const manager: IPlanManager = this.getManagersByIds[facilitator.manager_id] as IPlanManager;
        if (!manager) {
            return null;
        }

        return ProgramPlanTools.getResourceName(manager.firstname, manager.lastname);
    }

    get can_edit(): boolean {

        if (this.block_edition) {
            return false;
        }

        if (!this.can_edit_any) {
            return false;
        }

        if (!this.can_edit_all) {
            if (!this.can_edit_own_team) {
                if (!this.can_edit_self) {
                    return false;
                } else {
                    // Peut modifier ses Rdvs
                    if ((!!this.selected_rdv.facilitator_id) && (this.getFacilitatorsByIds[this.selected_rdv.facilitator_id]) &&
                        (!!this.user) &&
                        (this.getFacilitatorsByIds[this.selected_rdv.facilitator_id].user_id == this.user.id)) {
                        //OK
                    } else {
                        return false;
                    }
                }
            } else {
                // Peut modifier les Rdvs de son équipe
                if ((!!this.selected_rdv.facilitator_id) && (this.getFacilitatorsByIds[this.selected_rdv.facilitator_id])) {

                    // Test si user est facilitator
                    if ((!!this.user_s_facilitators) && (this.user_s_facilitators.length > 0)) {
                        for (const i in this.user_s_facilitators) {
                            const facilitator = this.user_s_facilitators[i];

                            if (this.getFacilitatorsByIds[this.selected_rdv.facilitator_id].manager_id == facilitator.manager_id) {
                                return true;
                            }

                        }
                    }

                    // Test si user est manager
                    if ((!!this.user_s_managers) && (this.user_s_managers.length > 0)) {
                        for (const i in this.user_s_managers) {
                            const manager = this.user_s_managers[i];

                            if (this.getFacilitatorsByIds[this.selected_rdv.facilitator_id].manager_id == manager.id) {
                                return true;
                            }

                        }
                    }
                }
                return false;
            }
        }
        return true;
    }


    get canaddcr(): boolean {

        if (!this.selected_rdv) {
            return false;
        }

        if (!this.selected_rdv_cr) {
            return this.can_edit;
        }

        return false;
    }

    get user_s_facilitators(): IPlanFacilitator[] {
        if (!this.user) {
            return null;
        }

        if (!this.getFacilitatorsByIds) {
            return null;
        }

        const res: IPlanFacilitator[] = [];
        for (const i in this.getFacilitatorsByIds) {
            const facilitator = this.getFacilitatorsByIds[i];

            if (facilitator.user_id == this.user.id) {
                res.push(facilitator);
            }
        }

        return (res && res.length) ? res : null;
    }

    get user_s_managers(): IPlanManager[] {
        if (!this.user) {
            return null;
        }

        if (!this.getManagersByIds) {
            return null;
        }

        const res: IPlanManager[] = [];
        for (const i in this.getManagersByIds) {
            const manager = this.getManagersByIds[i];

            if (manager.user_id == this.user.id) {
                res.push(manager);
            }
        }

        return (res && res.length) ? res : null;
    }

    get can_revert_to_previous(): boolean {
        // Permettre la navigation si des versions existent, indépendamment du mode d'édition
        return this.can_go_to_previous_version;
    }

    get can_revert_to_next(): boolean {
        // Permettre la navigation si des versions existent, indépendamment du mode d'édition
        return this.can_go_to_next_version;
    }

    get oselia_blocked(): boolean {
        if (OseliaController.can_use_realtime_on_current_page) {
            return EnvHandler.block_oselia_on_cr;
        }
        return true;
    }

    @Watch('oselia_opened')
    private onOseliaOpened() {
        if (!this.POLICY_CAN_USE_REALTIME) {
            return;
        }
        if (this.oselia_opened) {
            const prompt_for_realtime = "Nous sommes en train d'éditer un CR, voici ses informations :\n\n" +
                "Fichier lié : " + (this.selected_rdv_cr ? this.selected_rdv_cr.cr_file_id : '') + "\n" +
                "ID du CR : " + (this.selected_rdv_cr ? this.selected_rdv_cr.id : '') + "\n" +
                "Id du RDV lié : " + (this.selected_rdv_cr ? this.selected_rdv_cr.rdv_id : '');
            const cache_key = this.selected_rdv_cr ? this.selected_rdv_cr._type + '_' + this.selected_rdv_cr.id : '';
            OseliaRealtimeController.getInstance().connect_to_realtime(ModuleProgramPlanBase.getInstance().getAssistantName('CR'), prompt_for_realtime, { [cache_key]: this.selected_rdv_cr });
        } else {
            OseliaRealtimeController.getInstance().disconnect_to_realtime();
        }
    }

    private editCR(cr) {
        if (this.oselia_opened) {
            this.in_edit_inline = !this.in_edit_inline;
            return;
        }
        this.edited_cr = cr;
    }

    private cancelEditCR() {
        this.edited_cr = null;
    }

    private async mounted() {
        const get_oselia_realtime_close = EventifyEventListenerInstanceVO.new_listener(
            ModuleOselia.EVENT_OSELIA_CLOSE_REALTIME,
            (event: EventifyEventInstanceVO) => {
                this.oselia_opened = event.param as boolean;
            },
        );
        EventsController.register_event_listener(get_oselia_realtime_close);
        this.POLICY_CAN_USE_REALTIME = await ModuleAccessPolicy.getInstance().testAccess(ModuleGPT.POLICY_USE_OSELIA_REALTIME_IN_CR);

        // Ajouter les raccourcis clavier pour le versionnement
        document.addEventListener('keydown', this.handleKeyboardShortcuts);

        // Démarrer le timer pour mettre à jour l'état des boutons de versioning
        this.startVersioningStateUpdater();
    }

    private async beforeDestroy() {
        // Nettoyer les raccourcis clavier
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);

        // Arrêter le timer de mise à jour
        this.stopVersioningStateUpdater();
    }

    private startVersioningStateUpdater(): void {
        this.updateVersioningButtonsState();
        this.versioningStateUpdateTimer = setInterval(() => {
            this.updateVersioningButtonsState();
        }, 100); // Mettre à jour toutes les 100ms
    }

    private stopVersioningStateUpdater(): void {
        if (this.versioningStateUpdateTimer) {
            clearInterval(this.versioningStateUpdateTimer);
            this.versioningStateUpdateTimer = null;
        }
    }

    private updateVersioningButtonsState(): void {
        const crReadComponent = this.$refs.crReadComponent as Vue & {
            canGoToPreviousVersion?: () => boolean;
            canGoToNextVersion?: () => boolean;
        };
        if (crReadComponent) {
            if (typeof crReadComponent.canGoToPreviousVersion === 'function') {
                this.can_go_to_previous_version = crReadComponent.canGoToPreviousVersion();
            } else {
                this.can_go_to_previous_version = false;
            }

            if (typeof crReadComponent.canGoToNextVersion === 'function') {
                this.can_go_to_next_version = crReadComponent.canGoToNextVersion();
            } else {
                this.can_go_to_next_version = false;
            }
        } else {
            this.can_go_to_previous_version = false;
            this.can_go_to_next_version = false;
        }
    }

    private handleKeyboardShortcuts = (event: KeyboardEvent) => {
        // Actif si on est en mode édition (edited_cr existe) ou en edit inline
        if (!this.edited_cr && !this.in_edit_inline) return;

        // Ctrl+Z pour version précédente
        if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            this.togglePrevious();
        }
        // Ctrl+Y ou Ctrl+Shift+Z pour version suivante
        else if ((event.ctrlKey && event.key === 'y') || (event.ctrlKey && event.shiftKey && event.key === 'Z')) {
            event.preventDefault();
            this.toggleNext();
        }
    };

    private switchOpenOselia() {
        this.oselia_opened = !this.oselia_opened;
    }

    /**
     * Called when creating a new CR. Confirmation, and if confirmed, creation.
     * @param cr
     */
    private async create_cr(cr: IPlanRDVCR) {
        if ((!this.selected_rdv) || (!cr)) {
            return;
        }

        const self = this;

        if (!this.program_plan_controller.show_confirmation_create_cr) {
            await this.create_cr_action(cr);
            return;
        }

        self.snotify.confirm(self.label('programplan.create_cr.confirmation.body'), self.label('programplan.create_cr.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);

                        await this.create_cr_action(cr);
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async create_cr_action(cr: IPlanRDVCR) {
        this.$snotify.async(this.label('programplan.create_cr.start'), () => new Promise(async (resolve, reject) => {
            try {

                const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(cr);
                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                    throw new Error('Erreur serveur');
                }
                cr.id = insertOrDeleteQueryResult.id;

                this.setCrById(cr);
                // TODO passer par une synchro via les notifs de dao ...
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.program_plan_shared_module.rdv_type_id]);
                const rdv = await query(this.program_plan_shared_module.rdv_type_id).filter_by_id(cr.rdv_id).select_vo<IPlanRDV>();
                this.updateRdv(rdv);
            } catch (error) {
                ConsoleHandler.error(error);
                reject({
                    title: this.label('programplan.create_cr.error'),
                    body: '',
                    config: {
                        timeout: 2000,
                    }
                });
                return;
            }

            resolve({
                title: this.label('programplan.create_cr.ok'),
                body: '',
                config: {
                    timeout: 2000,
                }
            });
        }));

    }

    /**
     * Called when updating a CR. Confirmation, and if confirmed, update.
     * @param cr
     */
    private async update_cr(cr: IPlanRDVCR, autosave: boolean = false) {
        if ((!this.selected_rdv) || (!cr)) {
            return;
        }

        const self = this;

        if (autosave) {
            await this.debounced_update_cr_action(cr, autosave);
            return;
        }

        if (!this.program_plan_controller.show_confirmation_update_cr) {
            await this.update_cr_action(cr, autosave);
            return;
        }

        self.snotify.confirm(self.label('programplan.update_cr.confirmation.body'), self.label('programplan.update_cr.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);

                        await this.update_cr_action(cr, autosave);
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
    private async use_edit_inline(edit_inline: boolean = false) {
        this.in_edit_inline = edit_inline;
    }

    private togglePrevious() {
        this.revertToPreviousVersionBool = !this.revertToPreviousVersionBool;
    }
    private toggleNext() {
        this.revertToNextVersionBool = !this.revertToNextVersionBool;
    }
    private async update_cr_action(cr: IPlanRDVCR, autosave: boolean) {
        this.$snotify.async(this.label('programplan.update_cr.start'), () => new Promise(async (resolve, reject) => {
            try {
                const insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(cr);
                if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id) || (insertOrDeleteQueryResult.id != cr.id)) {
                    throw new Error('Erreur serveur');
                }
                this.updateCr(cr);

                // TODO passer par une synchro via les notifs de dao ...
                AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.program_plan_shared_module.rdv_type_id]);
                const rdv = await query(this.program_plan_shared_module.rdv_type_id).filter_by_id(cr.rdv_id).select_vo<IPlanRDV>();
                this.updateRdv(rdv);

                if (!autosave) {
                    this.edited_cr = null;
                }
            } catch (error) {
                ConsoleHandler.error(error);

                reject({
                    title: this.label('programplan.update_cr.error'),
                    body: '',
                    config: {
                        timeout: 2000,
                    }
                });

                return;
            }

            resolve({
                title: this.label('programplan.update_cr.ok'),
                body: '',
                config: {
                    timeout: 2000,
                }
            });
        }));
    }

    /**
     * Called when cancelling edition of a cr. Just close the modal
     * @param cr
     */
    private async cancel_edition(cr: IPlanRDVCR) {
        await this.update_cr_action(cr, false);

        this.snotify.info(this.label('programplan.update_cr.cancel'));
        this.edited_cr = null;
    }

    /**
     * Called when deleting a CR. Confirmation, and if confirmed, deletion.
     * @param cr
     */
    private async delete_cr(cr: IPlanRDVCR) {
        if ((!this.selected_rdv) || (!cr)) {
            return;
        }

        const self = this;

        self.snotify.confirm(self.label('programplan.delete_cr.confirmation.body'), self.label('programplan.delete_cr.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);


                        self.snotify.async(self.label('programplan.delete_cr.start'), () =>
                            new Promise(async (resolve, reject) => {

                                try {

                                    const insertOrDeleteQueryResult: InsertOrDeleteQueryResult[] = await ModuleDAO.instance.deleteVOs([cr]);
                                    if ((!insertOrDeleteQueryResult) || (insertOrDeleteQueryResult.length != 1) || (insertOrDeleteQueryResult[0].id != cr.id)) {
                                        throw new Error('Erreur serveur');
                                    }
                                    self.removeCr(cr.id);

                                    // TODO passer par une synchro via les notifs de dao ...
                                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.program_plan_shared_module.rdv_type_id]);
                                    const rdv = await query(this.program_plan_shared_module.rdv_type_id).filter_by_id(cr.rdv_id).select_vo<IPlanRDV>();
                                    self.updateRdv(rdv);
                                } catch (error) {
                                    ConsoleHandler.error(error);
                                    reject({
                                        body: self.label('programplan.delete_cr.error'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                    return;
                                }
                                self.edited_cr = null;
                                resolve({
                                    body: self.label('programplan.delete_cr.ok'),
                                    config: {
                                        timeout: 10000,
                                        showProgressBar: true,
                                        closeOnClick: false,
                                        pauseOnHover: true,
                                    },
                                });
                            })
                        );
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }

    private async set_cr_html_content(html_content) {
        this.cr_html_content = html_content;
    }
}