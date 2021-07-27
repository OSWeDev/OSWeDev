import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import DefaultTranslation from '../../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../../VOsTypesManager';
import CommandeVO from '../Commande/vos/CommandeVO';
import AbonnementVO from './vos/AbonnementVO';
import PackAbonnementVO from './vos/PackAbonnementVO';

export default class ModuleAbonnement extends Module {

    public static getInstance(): ModuleAbonnement {
        if (!ModuleAbonnement.instance) {
            ModuleAbonnement.instance = new ModuleAbonnement();
        }
        return ModuleAbonnement.instance;
    }

    private static instance: ModuleAbonnement = null;

    private constructor() {
        super(AbonnementVO.API_TYPE_ID, 'Abonnement', 'Commerce/Abonnement');
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeAbonnement();
        this.initializePackAbonnement();
    }

    public initializeAbonnement(): void {
        // Création de la table Abonnement
        let default_label_field: ModuleTableField<string> = new ModuleTableField('echeance', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({
            fr: 'Date echeance'
        }));
        let datatable_fields = [
            new ModuleTableField('renouvellement', ModuleTableField.FIELD_TYPE_boolean, new DefaultTranslation({
                fr: 'Renouvellement'
            })),
            default_label_field,
            new ModuleTableField('resiliation', ModuleTableField.FIELD_TYPE_tstz, new DefaultTranslation({
                fr: 'Date resiliation'
            })),
        ];
        this.datatables.push(new ModuleTable<AbonnementVO>(this, AbonnementVO.API_TYPE_ID, () => new AbonnementVO(), datatable_fields, default_label_field, new DefaultTranslation({
            fr: 'Abonnement'
        })));
    }

    public initializePackAbonnement(): void {
        // Création de la table PackAbonnement
        let field_ligne_commande_id: ModuleTableField<number> = new ModuleTableField('ligne_commande_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({
            fr: 'Ligne Commande'
        }), true);
        let field_abonnement_id: ModuleTableField<number> = new ModuleTableField('abonnement_id', ModuleTableField.FIELD_TYPE_foreign_key, new DefaultTranslation({
            fr: 'Abonnement'
        }), true);

        let datatable_fields = [
            field_ligne_commande_id,
            field_abonnement_id,
        ];
        let dt = new ModuleTable<PackAbonnementVO>(this, PackAbonnementVO.API_TYPE_ID, () => new PackAbonnementVO(), datatable_fields, field_ligne_commande_id, new DefaultTranslation({
            fr: 'PackAbonnement'
        }));
        field_ligne_commande_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[CommandeVO.API_TYPE_ID]);
        field_abonnement_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[AbonnementVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }
}