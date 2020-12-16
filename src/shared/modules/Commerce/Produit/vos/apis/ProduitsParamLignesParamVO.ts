import ProduitParamLigneParamVO from './ProduitParamLigneParamVO';
import CommandeVO from '../../../Commande/vos/CommandeVO';
import IAPIParamTranslator from '../../../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../../../API/interfaces/IAPIParamTranslatorStatic';

export default class ProduitsParamLignesParamVO implements IAPIParamTranslator<ProduitsParamLignesParamVO>{

    public static fromParams(
        produitsParam: ProduitParamLigneParamVO[],
        commande: CommandeVO): ProduitsParamLignesParamVO {

        return new ProduitsParamLignesParamVO(produitsParam, commande);
    }

    public constructor(
        public produitsParam: ProduitParamLigneParamVO[],
        public commande: CommandeVO
    ) { }

    public getAPIParams(): any[] {
        return [this.produitsParam, this.commande];
    }
}

export const ProduitsParamLignesParamVOStatic: IAPIParamTranslatorStatic<ProduitsParamLignesParamVO> = ProduitsParamLignesParamVO;