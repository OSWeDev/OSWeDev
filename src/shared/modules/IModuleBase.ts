export default interface IModuleBase {
    name: string;
    registerApis();
    initialize();
}