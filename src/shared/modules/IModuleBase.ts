import ModuleTableField from './ModuleTableField';

export default interface IModuleBase {
    name: string;
    actif: boolean;
    registerApis();
    initialize();
}