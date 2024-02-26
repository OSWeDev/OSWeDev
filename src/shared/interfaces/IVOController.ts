import ModuleTableVO from '../modules/ModuleTableVO';

export default interface IVOController {
    registerModuleTable(moduleTable: ModuleTableVO<any>);
}