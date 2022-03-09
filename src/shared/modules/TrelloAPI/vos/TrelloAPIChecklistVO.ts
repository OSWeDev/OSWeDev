import TrelloAPICheckItemVO from "./TrelloAPICheckItemVO";

export default class TrelloAPIChecklistVO {

    public checkItems: TrelloAPICheckItemVO[];
    public id: string;
    public idBoard: string;
    public idCard: string;
    public name: string;
    public pos: number;
}