
export default class SendTeamsLevelParam {

    public constructor(
        public level: string,
        public title: string,
        public message: string,
        public webhook: string = null
    ) { }
}