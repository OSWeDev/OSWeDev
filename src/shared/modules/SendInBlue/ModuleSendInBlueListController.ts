import * as SibAPI from 'sib-api-v3-typescript';

export default class ModuleSendInBlueListController {

    public static getInstance(): ModuleSendInBlueListController {
        if (!ModuleSendInBlueListController.instance) {
            ModuleSendInBlueListController.instance = new ModuleSendInBlueListController();
        }
        return ModuleSendInBlueListController.instance;
    }

    private static instance: ModuleSendInBlueListController = null;

    public getList(listId: number) {
        // TODO
        new SibAPI.ListsApi().getList(listId);
    }

    public getLists() {
        // TODO
        new SibAPI.ListsApi().getLists();
    }

    public createList(folderId: number, listName: string) {
        // TODO
        let listDetail: SibAPI.CreateList = new SibAPI.CreateList();
        listDetail.folderId = folderId;
        listDetail.name = listName;
        new SibAPI.ListsApi().createList(listDetail);
    }

    public getContactsFromList(listId: number) {
        // TODO
        new SibAPI.ListsApi().getContactsFromList(listId);
    }

    public addContactToList(listId: number, emails: string[]) {
        // TODO
        let contacts: SibAPI.AddContactToList = new SibAPI.AddContactToList();
        contacts.emails = emails;
        new SibAPI.ListsApi().addContactToList(listId, contacts);
    }
}