import * as moment from 'moment';
import { Component, Prop } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanPartner from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanPartner';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import { ModuleDAOGetter } from '../../../dao/store/DaoStore';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import { ModuleProgramPlanAction, ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import ProgramPlanComponentModalTargetInfos from '../target_infos/ProgramPlanComponentModalTargetInfos';
import "./ProgramPlanComponentModalCR.scss";

@Component({
    template: require('./ProgramPlanComponentModalCR.pug'),
    components: {
        field: VueFieldComponent,
        ProgramPlanComponentModalTargetInfos
    }
})
export default class ProgramPlanComponentModalCR extends VueComponentBase {

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

    @Prop({
        default: null
    })
    private selected_rdv: IPlanRDV;
    @Prop({
        default: false
    })
    private can_edit: boolean;

    // Modal
    private newcr_seemore: boolean = false;

    private edited_cr: IPlanRDVCR = null;

    private custom_cr_create_component = ProgramPlanControllerBase.getInstance().customCRCreateComponent;
    private custom_cr_read_component = ProgramPlanControllerBase.getInstance().customCRReadComponent;
    private custom_cr_update_component = ProgramPlanControllerBase.getInstance().customCRUpdateComponent;

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

        for (let i in this.getCrsByIds) {
            let cr: IPlanRDVCR = this.getCrsByIds[i] as IPlanRDVCR;

            if (cr.rdv_id == this.selected_rdv.id) {
                return cr;
            }
        }
        return null;
    }

    // /**
    //  * L'idée est de charger les CRs de cet établissement
    //  * classés par ordre antéchrono
    //  */
    // get older_crs(): IPlanRDVCR[] {
    //     let res: IPlanRDVCR[] = [];

    //     if (!this.selected_rdv) {
    //         return res;
    //     }

    //     for (let i in this.getCrsByIds) {
    //         let cr: IPlanRDVCR = this.getCrsByIds[i] as IPlanRDVCR;

    //         if (!this.getRdvsByIds[cr.rdv_id]) {
    //             continue;
    //         }

    //         if (cr.rdv_id == this.selected_rdv.id) {
    //             continue;
    //         }

    //         let rdv: IPlanRDV = this.getRdvsByIds[cr.rdv_id] as IPlanRDV;

    //         if (rdv.target_id != this.selected_rdv.target_id) {
    //             continue;
    //         }

    //         res.push(cr);
    //     }

    //     let self = this;

    //     res.sort(function (a: IPlanRDVCR, b: IPlanRDVCR) {
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

    get canaddcr(): boolean {

        if (!this.selected_rdv) {
            return false;
        }

        if (!this.selected_rdv_cr) {
            return this.can_edit;
        }

        return false;
    }

    private editCR(cr) {
        this.edited_cr = cr;
    }

    private cancelEditCR() {
        this.edited_cr = null;
    }

    /**
     * Called when creating a new CR. Confirmation, and if confirmed, creation.
     * @param cr
     */
    private async create_cr(cr: IPlanRDVCR) {
        if ((!this.selected_rdv) || (!cr)) {
            return;
        }

        let self = this;

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
                        self.snotify.info(self.label('programplan.create_cr.start'));

                        try {

                            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(cr);
                            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                                throw new Error('Erreur serveur');
                            }
                            cr.id = parseInt(insertOrDeleteQueryResult.id);
                            self.setCrById(cr);
                        } catch (error) {
                            console.error(error);
                            self.snotify.error(self.label('programplan.create_cr.error'));
                            return;
                        }
                        self.snotify.success(self.label('programplan.create_cr.ok'));
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
     * Called when updating a CR. Confirmation, and if confirmed, update.
     * @param cr
     */
    private async update_cr(cr: IPlanRDVCR) {
        if ((!this.selected_rdv) || (!cr)) {
            return;
        }

        let self = this;

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
                        self.snotify.info(self.label('programplan.update_cr.start'));

                        try {

                            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(cr);
                            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id) || (parseInt(insertOrDeleteQueryResult.id) != cr.id)) {
                                throw new Error('Erreur serveur');
                            }
                            self.updateCr(cr);
                        } catch (error) {
                            console.error(error);
                            self.snotify.error(self.label('programplan.update_cr.error'));
                            return;
                        }
                        self.snotify.success(self.label('programplan.update_cr.ok'));
                        self.edited_cr = null;
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
     * Called when cancelling edition of a cr. Just close the modal
     * @param cr
     */
    private async cancel_edition(cr: IPlanRDVCR) {

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

        let self = this;

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
                        self.snotify.info(self.label('programplan.delete_cr.start'));

                        try {

                            let insertOrDeleteQueryResult: InsertOrDeleteQueryResult[] = await ModuleDAO.getInstance().deleteVOs([cr]);
                            if ((!insertOrDeleteQueryResult) || (insertOrDeleteQueryResult.length != 1) || (parseInt(insertOrDeleteQueryResult[0].id) != cr.id)) {
                                throw new Error('Erreur serveur');
                            }
                            self.removeCr(cr.id);
                        } catch (error) {
                            console.error(error);
                            self.snotify.error(self.label('programplan.delete_cr.error'));
                            return;
                        }
                        self.snotify.success(self.label('programplan.delete_cr.ok'));
                        self.edited_cr = null;
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