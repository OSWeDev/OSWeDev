import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleProduit from '../../../../../../../shared/modules/Commerce/Produit/ModuleProduit';
import ProduitParamLigneParamVO from '../../../../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';
import FacturationProduitVO from '../../../../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';
import FacturationVO from '../../../../../../../shared/modules/Commerce/Produit/vos/FacturationVO';
import ProduitVO from '../../../../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./PanierAjoutLigneComponent.pug'),
    components: {}
})
export default class PanierAjoutLigneComponent extends VueComponentBase {
    @Prop({ default: null })
    private produitparam: ProduitParamLigneParamVO;

    private facturations_produit: FacturationProduitVO[] = null;
    private facturation: FacturationVO = null;

    private async created(): Promise<void> {
        this.facturations_produit = await ModuleProduit.getInstance().getFacturationProduitByIdProduit(this.produit.id);

        if (this.facturations_produit) {
            let facturation_produit: FacturationProduitVO = this.facturations_produit.find((f) => f.par_defaut == true);

            if (!facturation_produit) {
                facturation_produit = this.facturations_produit[0];
            }

            this.facturation = await query(FacturationVO.API_TYPE_ID).filter_by_id(facturation_produit.facturation_id).select_vo<FacturationVO>();
        }
    }

    get produit(): ProduitVO {
        if (this.produitparam) {
            return this.produitparam.produit;
        }

        return null;
    }

    get facturationAffichage(): string {
        if (this.facturation) {
            return this.facturation.texte_affichage;
        }

        return null;
    }
}