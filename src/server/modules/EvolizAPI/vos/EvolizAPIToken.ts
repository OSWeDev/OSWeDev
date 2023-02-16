import { Moment } from "moment";

export default class EvolizAPIToken {
    public access_token: string;
    public expires_at: Moment;
    public scopes: string[];
}