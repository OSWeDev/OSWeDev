import IDistantVOBase from '../../../IDistantVOBase';

export default class InformationsVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "informations";

    public id: number;
    public _type: string = InformationsVO.API_TYPE_ID;
    public nom: string;
    public prenom: string;
    public telephone: string;
    public adresse: string;
    public code_postal: string;
    public ville: string;
    public societe: string;
    public siret: string;
    public email: string;
}