import * as moment from 'moment';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVPrep from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVPrep';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import { ModuleDAOGetter } from '../../../dao/store/DaoStore';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import ProgramPlanComponentModalTargetInfos from '../target_infos/ProgramPlanComponentModalTargetInfos';
import "./ProgramPlanComponentModalPrep.scss";
import ModuleProgramPlanBase from '../../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';

@Component({
    template: require('./ProgramPlanComponentModalPrep.pug'),
    components: {
        field: VueFieldComponent,
        ProgramPlanComponentModalTargetInfos
    }
})
export default class ProgramPlanComponentModalPrep extends VueComponentBase {

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

    @Prop({
        default: null
    })
    private selected_rdv: IPlanRDV;
    @Prop({
        default: false
    })
    private can_edit: boolean;

    private rdv_confirmed: boolean = false;

    // Modal
    private newprep_seemore: boolean = false;

    private edited_prep: IPlanRDVPrep = null;

    private custom_prep_create_component = ProgramPlanControllerBase.getInstance().customPrepCreateComponent;
    private custom_prep_read_component = ProgramPlanControllerBase.getInstance().customPrepReadComponent;
    private custom_prep_update_component = ProgramPlanControllerBase.getInstance().customPrepUpdateComponent;

    @Watch('selected_rdv', { immediate: true })
    private async onChangeSelectedRDV() {
        // Vérifier le statut et mettre à jour le flag RDV_confirmed
        this.rdv_confirmed = (this.selected_rdv && (this.selected_rdv.state != ModuleProgramPlanBase.RDV_STATE_CREATED));
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

    @Watch('rdv_confirmed')
    private async onChangeRDVConfirmed() {
        // On doit changer le statut du RDV
        if (!this.selected_rdv) {
            return;
        }

        if (this.rdv_confirmed && (this.selected_rdv.state != ModuleProgramPlanBase.RDV_STATE_CREATED)) {
            return;
        }

        if ((!this.rdv_confirmed) && (this.selected_rdv.state == ModuleProgramPlanBase.RDV_STATE_CREATED)) {
            return;
        }

        this.selected_rdv.state = (this.rdv_confirmed ? (this.selected_rdv_cr ? ModuleProgramPlanBase.RDV_STATE_CR_OK : ModuleProgramPlanBase.RDV_STATE_CONFIRMED) : ModuleProgramPlanBase.RDV_STATE_CREATED);
        this.snotify.info(this.label('programplan.rdv_modal.update_rdv.start'));
        try {

            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(this.selected_rdv);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                throw new Error('Erreur serveur');
            }
        } catch (error) {
            console.error(error);
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

        return ProgramPlanControllerBase.getInstance().getResourceName(facilitator.firstname, facilitator.lastname);
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

        return ProgramPlanControllerBase.getInstance().getResourceName(manager.firstname, manager.lastname);
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
                        } catch (error) {
                            console.error(error);
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
                        } catch (error) {
                            console.error(error);
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
                            console.error(error);
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