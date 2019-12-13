import IDistantVOBase from '../modules/IDistantVOBase';

export default interface INamedVO extends IDistantVOBase {

    /**
     * On définit des limites pour les noms de vos nommes, qui ne doivent contenir que les caractères suivants (JNE : pourquoi ?????):
     * [a-z0-9A-Z-_ ./:,]
     */
    name: string;
}