import IDistantVOBase from '../../IDistantVOBase';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import IUserData from './IUserData';

export type IHookFilterVos<T extends IDistantVOBase> = (datatable: ModuleTableVO<T>, vos: T[], uid: number, user_data: IUserData) => Promise<T[]>;