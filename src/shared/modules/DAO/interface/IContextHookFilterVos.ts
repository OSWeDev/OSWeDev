import RoleVO from '../../AccessPolicy/vos/RoleVO';
import UserVO from '../../AccessPolicy/vos/UserVO';
import ContextQueryVO from '../../ContextFilter/vos/ContextQueryVO';
import IDistantVOBase from '../../IDistantVOBase';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import IUserData from './IUserData';

/**
 * Le hook doit renvoyer un ContextQuery **** qui sera utilisé dans un contexte de type "moduletable.id in (****)"
 *  La query doit donc renvoyer un seul champs, de type int pour être valide dans le contexte
 * @param moduletable le moduletable du type pour lequel on demande le contextquery
 * @param uid le user_id de la session qui initie la demande
 * @param user l'objet user de l'utilisateur qui initie la demande
 * @param user_data les données de l'utilisateur qui initie la demande
 * @param user_roles les roles de l'utilisateur qui initie la demande
 */
export type IContextHookFilterVos<T extends IDistantVOBase> = (moduletable: ModuleTableVO<T>, uid: number, user: UserVO, user_data: IUserData, user_roles: RoleVO[]) => Promise<ContextQueryVO>;