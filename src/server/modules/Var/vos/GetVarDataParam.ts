export default class GetVarDataParam {
    public constructor(
        public index: string,
        public cb: (res: any) => Promise<void>
    ) { }
}