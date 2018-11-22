import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../VueComponentBase';
import ProduitVO from '../../../../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import FacturationVO from '../../../../../../../shared/modules/Commerce/Produit/vos/FacturationVO';
import ModuleProduit from '../../../../../../../shared/modules/Commerce/Produit/ModuleProduit';
import FacturationProduitVO from '../../../../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import ProduitParamLigneParamVO from '../../../../../../../shared/modules/Commerce/Produit/vos/apis/ProduitParamLigneParamVO';

@Component({
    template: require('./PanierAjoutLigneComponent.pug'),
    components: {}
})
export default class PanierAjoutLigneComponent extends VueComponentBase {
    @Prop({ default: null })
    private produitParam: ProduitParamLigneParamVO;

    private facturations_produit: FacturationProduitVO[] = null;
    private facturation: FacturationVO = null;

    private async created(): Promise<void> {
        this.facturations_produit = await ModuleProduit.getInstance().getFacturationProduitByIdProduit(this.produit.id);

        if (this.facturations_produit) {
            let facturation_produit: FacturationProduitVO = this.facturations_produit.find((f) => f.par_defaut == true);

            if (!facturation_produit) {
                facturation_produit = this.facturations_produit[0];
            }

            this.facturation = await ModuleDAO.getInstance().getVoById<FacturationVO>(FacturationVO.API_TYPE_ID, facturation_produit.facturation_id);
        }
    }

    get produit(): ProduitVO {
        if (this.produitParam) {
            return this.produitParam.produit;
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