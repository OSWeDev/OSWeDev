import IDistantVOBase from '../../IDistantVOBase';

export default interface IMatroid extends IDistantVOBase {

    // On hérite du IDistantVOBase pour avoir l'info de la structure de l'objet par réflexion
    //  en utilisant le _type et le VoTypesManager
    //  On peut en déduire les bases du matroid, qui sont les attributs de type ranges

    // Reste que l'on veut stocker ou avoir un getter indiquant facilement le cardinal de l'ensemble
    cardinal: number;

    // Et si on stocke un cardinal, c'est qu'on a l'info de la segmentation
    segment_type: number;
}