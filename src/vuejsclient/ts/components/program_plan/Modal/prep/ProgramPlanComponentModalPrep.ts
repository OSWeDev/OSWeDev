import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanRDVPrep from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
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
import ICustomPrepCreateComponent from './interfaces/ICustomPrepCreateComponent';
import ICustomPrepReadComponent from './interfaces/ICustomPrepReadComponent';
import ICustomPrepUpdateComponent from './interfaces/ICustomPrepUpdateComponent';
import "./ProgramPlanComponentModalPrep.scss";

@Component({
    template: require('./ProgramPlanComponentModalPrep.pug'),
    components: {
        field: VueFieldComponent,
        Programplancomponentmodaltargetinfos: ProgramPlanComponentModalTargetInfos
    }
})
export default class ProgramPlanComponentModalPrep extends VueComponentBase {

    @ModuleProgramPlanGetter
    public can_edit_any: boolean;
    @ModuleProgramPlanGetter
    public can_edit_all: boolean;
    @ModuleProgramPlanGetter
    public can_edit_own_team: boolean;
    @ModuleProgramPlanGetter
    public can_edit_self: boolean;

    @ModuleProgramPlanGetter
    public getCrsByIds: { [id: number]: IPlanRDVCR };

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
    public getPrepsByIds: { [id: number]: IPlanRDVPrep };

    @ModuleProgramPlanGetter
    public getPartnersByIds: { [id: number]: IPlanPartner };

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleProgramPlanAction
    public setPrepById: (prep: IPlanRDVPrep) => void;

    @ModuleProgramPlanAction
    public updatePrep: (prep: IPlanRDVPrep) => void;

    @ModuleProgramPlanAction
    public removePrep: (id: number) => void;

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

    private rdv_confirmed: boolean = false;

    private user = VueAppController.getInstance().data_user;

    // Modal
    private newprep_seemore: boolean = false;

    private edited_prep: IPlanRDVPrep = null;

    private custom_prep_create_component: ICustomPrepCreateComponent = this.program_plan_controller.customPrepCreateComponent;
    private custom_prep_read_component: ICustomPrepReadComponent = this.program_plan_controller.customPrepReadComponent;
    private custom_prep_update_component: ICustomPrepUpdateComponent = this.program_plan_controller.customPrepUpdateComponent;

    @Watch('selected_rdv', { immediate: true })
    private async onChangeSelectedRDV() {
        // Vérifier le statut et mettre à jour le flag RDV_confirmed
        this.rdv_confirmed = (this.selected_rdv && (this.selected_rdv.target_validation));
    }

    get selected_rdv_cr(): IPlanRDVCR {
        if (!this.selected_rdv) {
            return null;
        }

        for (let i in this.getCrsByIds) {
            let cr: IPlanRDVCR = this.getCrsByIds[i] as IPlanRDVCR;

            if (cr.rdv_id == this.selected_rdv.id) {
                return cr;
            }
        }
        return null;
    }

    get user_s_facilitators(): IPlanFacilitator[] {
        if (!this.user) {
            return null;
        }

        if (!this.getFacilitatorsByIds) {
            return null;
        }

        let res: IPlanFacilitator[] = [];
        for (let i in this.getFacilitatorsByIds) {
            let facilitator = this.getFacilitatorsByIds[i];

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

        let res: IPlanManager[] = [];
        for (let i in this.getManagersByIds) {
            let manager = this.getManagersByIds[i];

            if (manager.user_id == this.user.id) {
                res.push(manager);
            }
        }

        return (res && res.length) ? res : null;
    }

    private async onChangeRDVConfirmed() {

        // On doit changer le statut du RDV
        if (!this.selected_rdv) {
            return;
        }

        this.snotify.info(this.label('programplan.rdv_modal.update_rdv.start'));
        try {

            this.selected_rdv.target_validation = this.rdv_confirmed;
            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.selected_rdv);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur serveur');
            }

            // TODO passer par une synchro via les notifs de dao ...
            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.program_plan_shared_module.rdv_type_id]);
            let rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.program_plan_shared_module.rdv_type_id, this.selected_rdv.id);
            this.updateRdv(rdv);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            this.snotify.error(this.label('programplan.rdv_modal.update_rdv.error'));
            return;
        }
        this.snotify.success(this.label('programplan.rdv_modal.update_rdv.ok'));
    }

    get target(): IPlanTarget {
        if ((!this.selected_rdv) || (!this.selected_rdv.target_id)) {
            return null;
        }

        return this.getTargetsByIds[this.selected_rdv.target_id] as IPlanTarget;
    }

    get selected_rdv_prep(): IPlanRDVPrep {
        if (!this.selected_rdv) {
            return null;
        }

        for (let i in this.getPrepsByIds) {
            let prep: IPlanRDVPrep = this.getPrepsByIds[i] as IPlanRDVPrep;

            if (prep.rdv_id == this.selected_rdv.id) {
                return prep;
            }
        }
        return null;
    }

    // /**
    //  * L'idée est de charger les preps de cet établissement
    //  * classés par ordre antéchrono
    //  */
    // get older_preps(): IPlanRDVPrep[] {
    //     let res: IPlanRDVPrep[] = [];

    //     if (!this.selected_rdv) {
    //         return res;
    //     }

    //     for (let i in this.getPrepsByIds) {
    //         let prep: IPlanRDVPrep = this.getPrepsByIds[i] as IPlanRDVPrep;

    //         if (!this.getRdvsByIds[prep.rdv_id]) {
    //             continue;
    //         }

    //         if (prep.rdv_id == this.selected_rdv.id) {
    //             continue;
    //         }

    //         let rdv: IPlanRDV = this.getRdvsByIds[prep.rdv_id] as IPlanRDV;

    //         if (rdv.target_id != this.selected_rdv.target_id) {
    //             continue;
    //         }

    //         res.push(prep);
    //     }

    //     let self = this;

    //     res.sort(function (a: IPlanRDVPrep, b: IPlanRDVPrep) {
    //         let rdva: IPlanRDV = self.getRdvsByIds[a.rdv_id] as IPlanRDV;
    //         let rdvb: IPlanRDV = self.getRdvsByIds[b.rdv_id] as IPlanRDV;

    //         return moment(rdvb.start_time).diff(moment(rdva.start_time));
    //     });

    //     return res;
    // }

    get facilitatorAndManagerName() {
        return this.facilitatorName + (this.managerName ? " / " + this.managerName : "");
    }

    get facilitatorName() {
        if (!this.selected_rdv) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[this.selected_rdv.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        return ProgramPlanTools.getResourceName(facilitator.firstname, facilitator.lastname);
    }

    get managerName() {
        if (!this.selected_rdv) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[this.selected_rdv.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id] as IPlanManager;
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
                        for (let i in this.user_s_facilitators) {
                            let facilitator = this.user_s_facilitators[i];

                            if (this.getFacilitatorsByIds[this.selected_rdv.facilitator_id].manager_id == facilitator.manager_id) {
                                return true;
                            }

                        }
                    }

                    // Test si user est manager
                    if ((!!this.user_s_managers) && (this.user_s_managers.length > 0)) {
                        for (let i in this.user_s_managers) {
                            let manager = this.user_s_managers[i];

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

    get canaddprep(): boolean {

        if (!this.selected_rdv) {
            return false;
        }

        if (!this.selected_rdv_prep) {
            return this.can_edit;
        }

        return false;
    }

    private editPrep(prep) {
        this.edited_prep = prep;
    }

    private cancelEditPrep() {
        this.edited_prep = null;
    }

    /**
     * Called when creating a new prep. Confirmation, and if confirmed, creation.
     * @param prep
     */
    private async create_prep(prep: IPlanRDVPrep) {
        if ((!this.selected_rdv) || (!prep)) {
            return;
        }

        let self = this;

        self.snotify.confirm(self.label('programplan.create_prep.confirmation.body'), self.label('programplan.create_prep.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('programplan.create_prep.start'));

                        try {

                            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(prep);
                            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                                throw new Error('Erreur serveur');
                            }
                            prep.id = parseInt(insertOrDeleteQueryResult.id);
                            self.setPrepById(prep);

                            // TODO passer par une synchro via les notifs de dao ...
                            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.program_plan_shared_module.rdv_type_id]);
                            let rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.program_plan_shared_module.rdv_type_id, prep.rdv_id);
                            self.updateRdv(rdv);
                        } catch (error) {
                            ConsoleHandler.getInstance().error(error);
                            self.snotify.error(self.label('programplan.create_prep.error'));
                            return;
                        }
                        self.snotify.success(self.label('programplan.create_prep.ok'));
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

    /**
     * Called when updating a Prep. Confirmation, and if confirmed, update.
     * @param prep
     */
    private async update_prep(prep: IPlanRDVPrep) {
        if ((!this.selected_rdv) || (!prep)) {
            return;
        }

        let self = this;

        self.snotify.confirm(self.label('programplan.update_prep.confirmation.body'), self.label('programplan.update_prep.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('programplan.update_prep.start'));

                        try {

                            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(prep);
                            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id) || (parseInt(insertOrDeleteQueryResult.id) != prep.id)) {
                                throw new Error('Erreur serveur');
                            }
                            self.updatePrep(prep);

                            // TODO passer par une synchro via les notifs de dao ...
                            AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.program_plan_shared_module.rdv_type_id]);
                            let rdv = await ModuleDAO.getInstance().getVoById<IPlanRDV>(this.program_plan_shared_module.rdv_type_id, prep.rdv_id);
                            self.updateRdv(rdv);
                        } catch (error) {
                            ConsoleHandler.getInstance().error(error);
                            self.snotify.error(self.label('programplan.update_prep.error'));
                            return;
                        }
                        self.snotify.success(self.label('programplan.update_prep.ok'));
                        self.edited_prep = null;
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

    /**
     * Called when cancelling edition of a prep. Just close the modal
     * @param prep
     */
    private async cancel_edition(prep: IPlanRDVPrep) {

        this.snotify.info(this.label('programplan.update_prep.cancel'));
        this.edited_prep = null;
    }

    /**
     * Called when deleting a Prep. Confirmation, and if confirmed, deletion.
     * @param prep
     */
    private async delete_prep(prep: IPlanRDVPrep) {
        if ((!this.selected_rdv) || (!prep)) {
            return;
        }

        let self = this;

        self.snotify.confirm(self.label('programplan.delete_prep.confirmation.body'), self.label('programplan.delete_prep.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('programplan.delete_prep.start'));

                        try {

                            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([prep]);
                            if ((!insertOrDeleteQueryResult) || (insertOrDeleteQueryResult.length != 1) || (parseInt(insertOrDeleteQueryResult[0].id) != prep.id)) {
                                throw new Error('Erreur serveur');
                            }
                            self.removePrep(prep.id);
                        } catch (error) {
                            ConsoleHandler.getInstance().error(error);
                            self.snotify.error(self.label('programplan.delete_prep.error'));
                            return;
                        }
                        self.snotify.success(self.label('programplan.delete_prep.ok'));
                        self.edited_prep = null;
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
}