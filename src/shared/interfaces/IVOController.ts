import ModuleTable from '../modules/ModuleTable';

export default interface IVOController {
    registerModuleTable(moduleTable: ModuleTable<any>);
}