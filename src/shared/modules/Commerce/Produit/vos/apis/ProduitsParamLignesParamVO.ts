import ProduitParamLigneParamVO from './ProduitParamLigneParamVO';
import CommandeVO from '../../../Commande/vos/CommandeVO';

export default class ProduitsParamLignesParamVO {

    public static async translateCheckAccessParams(produitsParam: ProduitParamLigneParamVO[], commande: CommandeVO): Promise<ProduitsParamLignesParamVO> {
        return new ProduitsParamLignesParamVO(produitsParam, commande);
    }

    public constructor(
        public produitsParam: ProduitParamLigneParamVO[],
        public commande: CommandeVO
    ) { }
}