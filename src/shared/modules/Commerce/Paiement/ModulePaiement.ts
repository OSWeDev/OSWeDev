import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VOsTypesManager';
import AbonnementVO from '../Abonnement/vos/AbonnementVO';
import ModePaiementVO from './vos/ModePaiementVO';
import PaiementVO from './vos/PaiementVO';

export default class ModulePaiement extends Module {

    public static getInstance(): ModulePaiement {
        if (!ModulePaiement.instance) {
            ModulePaiement.instance = new ModulePaiement();
        }
        return ModulePaiement.instance;
    }

    private static instance: ModulePaiement = null;

    public datatable_paiement: ModuleTable<PaiementVO> = null;
    public datatable_mode_paiement: ModuleTable<ModePaiementVO> = null;

    private constructor() {
        super(PaiementVO.API_TYPE_ID, 'Paiement', 'Commerce/Paiement');
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeModePaiement();
        this.initializePaiement();
    }

    public initializeModePaiement(): void {
        // Création de la table ModePaiement
        let default_label_field: ModuleTableField<string> = new ModuleTableField('mode', ModuleTableField.FIELD_TYPE_string, 'Mode');
        let datatable_fields = [
            default_label_field,
        ];
        this.datatable_mode_paiement = new ModuleTable<ModePaiementVO>(this, ModePaiementVO.API_TYPE_ID, datatable_fields, default_label_field, 'Mode de paiement');
        this.datatables.push(this.datatable_mode_paiement);
    }

    public initializePaiement(): void {
        // Création de la table Paiement
        let field_abonnement_id: ModuleTableField<number> = new ModuleTableField('abonnement_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Abonnement', true);
        let field_mode_paiement_id: ModuleTableField<number> = new ModuleTableField('mode_paiement_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Mode paiement', true);

        let datatable_fields = [
            field_abonnement_id,
            field_mode_paiement_id,
            new ModuleTableField('statut', ModuleTableField.FIELD_TYPE_enum, 'Statut').setEnumValues({
                [PaiementVO.STATUT_ERREUR]: PaiementVO.STATUT_LABELS[PaiementVO.STATUT_ERREUR],
                [PaiementVO.STATUT_SUCCES]: PaiementVO.STATUT_LABELS[PaiementVO.STATUT_SUCCES],
            }),
        ];
        this.datatable_paiement = new ModuleTable<PaiementVO>(this, PaiementVO.API_TYPE_ID, datatable_fields, field_mode_paiement_id, 'Paiement');
        field_abonnement_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AbonnementVO.API_TYPE_ID]);
        field_mode_paiement_id.addManyToOneRelation(this.datatable_mode_paiement);
        this.datatables.push(this.datatable_paiement);
    }
}