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

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeModePaiement();
        this.initializePaiement();
    }

    public initializeModePaiement(): void {
        // Création de la table ModePaiement
        let datatable_fields = [
            new ModuleTableField('mode', ModuleTableField.FIELD_TYPE_string, 'Mode'),
        ];
        this.datatable_mode_paiement = new ModuleTable<ModePaiementVO>(this, ModePaiementVO.API_TYPE_ID, datatable_fields, null, 'Mode de paiement');
        this.datatables.push(this.datatable_mode_paiement);
    }

    public initializePaiement(): void {
        // Création de la table Paiement
        let field_abonnement_id: ModuleTableField<number> = new ModuleTableField('abonnement_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Abonnement', true);
        let field_mode_paiement_id: ModuleTableField<number> = new ModuleTableField('mode_paiement_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Mode paiement', true);
        let default_label_field: ModuleTableField<string> = new ModuleTableField('statut', ModuleTableField.FIELD_TYPE_string, 'Statut');

        let datatable_fields = [
            field_abonnement_id,
            field_mode_paiement_id,
            default_label_field,
        ];
        this.datatable_paiement = new ModuleTable<PaiementVO>(this, PaiementVO.API_TYPE_ID, datatable_fields, default_label_field, 'Paiement');
        field_abonnement_id.addManyToOneRelation(this.datatable_paiement, VOsTypesManager.getInstance().moduleTables_by_voType[AbonnementVO.API_TYPE_ID]);
        field_mode_paiement_id.addManyToOneRelation(this.datatable_paiement, this.datatable_mode_paiement);
        this.datatables.push(this.datatable_paiement);
    }
}