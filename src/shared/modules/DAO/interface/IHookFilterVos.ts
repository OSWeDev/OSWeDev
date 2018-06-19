import IDistantVOBase from '../../IDistantVOBase';
import ModuleTable from '../../ModuleTable';
import IUserData from './IUserData';

export type IHookFilterVos<T extends IDistantVOBase> = (datatable: ModuleTable<T>, vos: T[], uid: number, user_data: IUserData) => Promise<T[]>;