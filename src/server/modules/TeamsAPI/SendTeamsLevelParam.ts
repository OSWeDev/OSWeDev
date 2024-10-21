import TeamsWebhookContentActionOpenUrlVO from "../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO";

export default class SendTeamsLevelParam {

    public constructor(
        public level: string,
        public title: string,
        public message: string,
        public actions: TeamsWebhookContentActionOpenUrlVO[],
        public groupid: string,
        public channelid: string,
    ) { }
}