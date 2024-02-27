import { field_names } from '../../../tools/ObjectHandler';
import Module from '../../Module';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import DefaultTranslationVO from '../../Translation/vos/DefaultTranslationVO';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import CommandeVO from '../Commande/vos/CommandeVO';
import AbonnementVO from './vos/AbonnementVO';
import PackAbonnementVO from './vos/PackAbonnementVO';

export default class ModuleAbonnement extends Module {

    // istanbul ignore next: nothing to test
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
        this.initializeAbonnement();
        this.initializePackAbonnement();
    }

    public initializeAbonnement(): void {
        // Création de la table Abonnement
        const default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(AbonnementVO.API_TYPE_ID, field_names<AbonnementVO>().echeance, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({
            'fr-fr': 'Date echeance'
        }));
        const datatable_fields = [
            ModuleTableFieldController.create_new(AbonnementVO.API_TYPE_ID, field_names<AbonnementVO>().renouvellement, ModuleTableFieldVO.FIELD_TYPE_boolean, DefaultTranslationVO.create_new({
                'fr-fr': 'Renouvellement'
            })),
            default_label_field,
            ModuleTableFieldController.create_new(AbonnementVO.API_TYPE_ID, field_names<AbonnementVO>().resiliation, ModuleTableFieldVO.FIELD_TYPE_tstz, DefaultTranslationVO.create_new({
                'fr-fr': 'Date resiliation'
            })),
        ];
        this.datatables.push(new ModuleTableVO<AbonnementVO>(this, AbonnementVO.API_TYPE_ID, () => new AbonnementVO(), datatable_fields, default_label_field, DefaultTranslationVO.create_new({
            'fr-fr': 'Abonnement'
        })));
    }

    public initializePackAbonnement(): void {
        // Création de la table PackAbonnement
        const field_ligne_commande_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(PackAbonnementVO.API_TYPE_ID, field_names<PackAbonnementVO>().ligne_commande_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({
            'fr-fr': 'Ligne Commande'
        }), true);
        const field_abonnement_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(PackAbonnementVO.API_TYPE_ID, field_names<PackAbonnementVO>().abonnement_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, DefaultTranslationVO.create_new({
            'fr-fr': 'Abonnement'
        }), true);

        const datatable_fields = [
            field_ligne_commande_id,
            field_abonnement_id,
        ];
        const dt = new ModuleTableVO<PackAbonnementVO>(this, PackAbonnementVO.API_TYPE_ID, () => new PackAbonnementVO(), datatable_fields, field_ligne_commande_id, DefaultTranslationVO.create_new({
            'fr-fr': 'PackAbonnement'
        }));
        field_ligne_commande_id.set_many_to_one_target_moduletable_name(CommandeVO.API_TYPE_ID);
        field_abonnement_id.set_many_to_one_target_moduletable_name(AbonnementVO.API_TYPE_ID);
        this.datatables.push(dt);
    }
}