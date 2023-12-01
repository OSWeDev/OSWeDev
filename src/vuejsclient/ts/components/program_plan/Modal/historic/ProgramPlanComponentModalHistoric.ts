import { Component, Prop } from 'vue-property-decorator';
import IPlanEnseigne from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanFacilitator from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanManager from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanManager';
import IPlanRDV from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import IPlanTarget from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import ModuleProgramPlanBase from '../../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueFieldComponent from '../../../field/field';
import VueComponentBase from '../../../VueComponentBase';
import ProgramPlanControllerBase from '../../ProgramPlanControllerBase';
import ProgramPlanTools from '../../ProgramPlanTools';
import { ModuleProgramPlanGetter } from '../../store/ProgramPlanStore';
import ProgramPlanComponentModalCR from '../cr/ProgramPlanComponentModalCR';
import ProgramPlanComponentModalPrep from '../prep/ProgramPlanComponentModalPrep';
import "./ProgramPlanComponentModalHistoric.scss";
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';

@Component({
    template: require('./ProgramPlanComponentModalHistoric.pug'),
    components: {
        Vuefieldcomponent: VueFieldComponent,
        Programplancomponentmodalprep: ProgramPlanComponentModalPrep,
        Programplancomponentmodalcr: ProgramPlanComponentModalCR
    }
})
export default class ProgramPlanComponentModalHistoric extends VueComponentBase {

    @ModuleProgramPlanGetter
    public selected_rdv_historics: IPlanRDV[];

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
    public getPrepsByIds: { [id: number]: IPlanRDVCR };

    @Prop({ default: null })
    private program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    private program_plan_controller: ProgramPlanControllerBase;

    @Prop()
    private can_edit: boolean;

    private can_archive_rdv: boolean = false;

    get has_prep() {
        return !!this.program_plan_shared_module.rdv_prep_type_id;
    }

    private async mounted() {
        this.can_archive_rdv = await ModuleAccessPolicy.getInstance().checkAccess(this.program_plan_shared_module.POLICY_FO_CAN_ARCHIVE_RDV);
    }

    private async confirm_archive(rdv: IPlanRDV) {
        let self = this;
        if ((!rdv) || (!this.can_archive_rdv)) {
            return;
        }

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('ProgramPlanComponentModalHistoric.confirm_archive.body'), self.label('ProgramPlanComponentModalHistoric.confirm_archive.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.async(self.label('ProgramPlanComponentModalHistoric.confirm_archive.start'), () =>
                            new Promise(async (resolve, reject) => {
                                let res: InsertOrDeleteQueryResult = null;

                                rdv.archived = true;
                                res = await ModuleDAO.getInstance().insertOrUpdateVO(rdv);

                                if (!res?.id) {
                                    reject({
                                        body: self.label('ProgramPlanComponentModalHistoric.confirm_archive.ko'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                } else {

                                    self.$emit('reload_rdvs');

                                    resolve({
                                        body: self.label('ProgramPlanComponentModalHistoric.confirm_archive.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                }
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

    private facilitatorAndManagerName(rdv_historic: IPlanRDV): string {
        return this.facilitatorName(rdv_historic) + (this.managerName(rdv_historic) ? " / " + this.managerName(rdv_historic) : "");
    }

    private facilitatorName(rdv_historic: IPlanRDV): string {
        if (!rdv_historic) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[rdv_historic.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        return ProgramPlanTools.getResourceName(facilitator.firstname, facilitator.lastname);
    }

    private managerName(rdv_historic: IPlanRDV): string {
        if (!rdv_historic) {
            return null;
        }

        let facilitator: IPlanFacilitator = this.getFacilitatorsByIds[rdv_historic.facilitator_id] as IPlanFacilitator;
        if (!facilitator) {
            return null;
        }

        let manager: IPlanManager = this.getManagersByIds[facilitator.manager_id] as IPlanManager;
        if (!manager) {
            return null;
        }

        return ProgramPlanTools.getResourceName(manager.firstname, manager.lastname);
    }
}