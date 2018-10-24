import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import AbonnementVO from './vos/AbonnementVO';
import PackAbonnementVO from './vos/PackAbonnementVO';
import ModuleTableField from '../../ModuleTableField';
import ModuleCommande from '../Commande/ModuleCommande';

export default class ModuleAbonnement extends Module {

    public static getInstance(): ModuleAbonnement {
        if (!ModuleAbonnement.instance) {
            ModuleAbonnement.instance = new ModuleAbonnement();
        }
        return ModuleAbonnement.instance;
    }

    private static instance: ModuleAbonnement = null;

    public datatable_abonnement: ModuleTable<AbonnementVO> = null;
    public datatable_pack_abonnement: ModuleTable<PackAbonnementVO> = null;

    private constructor() {
        super('commerce_abonnement', 'Abonnement', 'Commerce/Abonnement');
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeAbonnement();

        if (ModuleCommande.getInstance().actif) {
            this.initializePackAbonnement();
        }
    }

    public initializeAbonnement(): void {
        // Création de la table Abonnement
        let datatable_fields = [
            new ModuleTableField('renouvellement', ModuleTableField.FIELD_TYPE_boolean, 'Renouvellement'),
            new ModuleTableField('echeance', ModuleTableField.FIELD_TYPE_date, 'Date echeance'),
            new ModuleTableField('resiliation', ModuleTableField.FIELD_TYPE_date, 'Date resiliation'),
        ];
        this.datatable_abonnement = new ModuleTable<AbonnementVO>(this, AbonnementVO.API_TYPE_ID, datatable_fields, null, 'Abonnement');
        this.datatables.push(this.datatable_abonnement);
    }

    public initializePackAbonnement(): void {

        // Création de la table PackAbonnement
        let field_ligne_commande_id: ModuleTableField<number> = new ModuleTableField('ligne_commande_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Ligne Commande', true);
        let field_abonnement_id: ModuleTableField<number> = new ModuleTableField('abonnement_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Abonnement', true);

        let datatable_fields = [
            field_ligne_commande_id,
            field_abonnement_id,
        ];
        this.datatable_pack_abonnement = new ModuleTable<PackAbonnementVO>(this, PackAbonnementVO.API_TYPE_ID, datatable_fields, null, 'PackAbonnement');
        field_ligne_commande_id.addManyToOneRelation(this.datatable_pack_abonnement, ModuleCommande.getInstance().datatable_ligne_commande);
        field_abonnement_id.addManyToOneRelation(this.datatable_pack_abonnement, this.datatable_abonnement);
        this.datatables.push(this.datatable_pack_abonnement);
    }
}