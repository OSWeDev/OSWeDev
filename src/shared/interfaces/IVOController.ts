import ModuleTableVO from "../modules/DAO/vos/ModuleTableVO";

export default interface IVOController {
    registerModuleTable(moduleTable: ModuleTableVO);
}