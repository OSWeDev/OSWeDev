import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import PaiementVO from './vos/PaiementVO';
import ModePaiementVO from './vos/ModePaiementVO';
import ModuleTableField from '../../ModuleTableField';
import ModuleAbonnement from '../Abonnement/ModuleAbonnement';

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
        super('commerce_paiement', 'Paiement', 'Commerce/Paiement');
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeModePaiement();

        if (ModuleAbonnement.getInstance().actif) {
            this.initializePaiement();
        }
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

        let datatable_fields = [
            field_abonnement_id,
            field_mode_paiement_id,
            new ModuleTableField('statut', ModuleTableField.FIELD_TYPE_string, 'Statut'),
        ];
        this.datatable_paiement = new ModuleTable<PaiementVO>(this, PaiementVO.API_TYPE_ID, datatable_fields, null, 'Paiement');
        field_abonnement_id.addManyToOneRelation(this.datatable_paiement, ModuleAbonnement.getInstance().datatable_abonnement);
        field_mode_paiement_id.addManyToOneRelation(this.datatable_paiement, this.datatable_mode_paiement);
        this.datatables.push(this.datatable_paiement);
    }
}