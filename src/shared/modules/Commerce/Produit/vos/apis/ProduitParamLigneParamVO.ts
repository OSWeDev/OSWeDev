import ProduitVO from '../ProduitVO';
import ProduitVOBase from '../ProduitVOBase';
import ParamLigneCommandeVO from '../../../Commande/vos/ParamLigneCommandeVO';
import IAPIParamTranslator from '../../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../../API/interfaces/IAPIParamTranslatorStatic';

export default class ProduitParamLigneParamVO implements IAPIParamTranslator<ProduitParamLigneParamVO> {

    public static fromParams(
        produit: ProduitVO,
        produit_custom: ProduitVOBase,
        ligneParam: ParamLigneCommandeVO): ProduitParamLigneParamVO {

        return new ProduitParamLigneParamVO(produit, produit_custom, ligneParam);
    }

    public static getAPIParams(param: ProduitParamLigneParamVO): any[] {
        return [param.produit, param.produit_custom, param.ligneParam];
    }

    public constructor(
        public produit: ProduitVO,
        public produit_custom: ProduitVOBase,
        public ligneParam: ParamLigneCommandeVO
    ) { }
}

export const ProduitParamLigneParamVOStatic: IAPIParamTranslatorStatic<ProduitParamLigneParamVO> = ProduitParamLigneParamVO;