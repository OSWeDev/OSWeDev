// import * as SibAPI from 'sib-api-v3-typescript';
import ModuleRequest from '../../../../server/modules/Request/ModuleRequest';
import InsertOrDeleteQueryResult from '../../DAO/vos/InsertOrDeleteQueryResult';
import ModuleSendInBlueController from '../ModuleSendInBlueController';
import SendInBlueContactDetailVO from '../vos/SendInBlueContactDetailVO';
import SendInBlueContactsVO from '../vos/SendInBlueContactsVO';
import SendInBlueFolderDetailVO from '../vos/SendInBlueFolderDetailVO';
import SendInBlueFoldersVO from '../vos/SendInBlueFolderVO';
import SendInBlueListDetailVO from '../vos/SendInBlueListDetailVO';
import SendInBlueListsVO from '../vos/SendInBlueListsVO';

export default class ModuleSendInBlueListController {

    public static getInstance(): ModuleSendInBlueListController {
        if (!ModuleSendInBlueListController.instance) {
            ModuleSendInBlueListController.instance = new ModuleSendInBlueListController();
        }

        return ModuleSendInBlueListController.instance;
    }

    private static instance: ModuleSendInBlueListController = null;

    private static PATH_CONTACT: string = 'contacts';
    private static PATH_LIST: string = 'contacts/lists';
    private static PATH_FOLDER: string = 'contacts/folders';

    public async getList(listId: number): Promise<SendInBlueListDetailVO> {
        if (!listId) {
            return null;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueListDetailVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_LIST + '/' + listId);
    }

    public async getLists(): Promise<SendInBlueListsVO> {
        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueListsVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_LIST);
    }

    public async createList(listName: string, folderId: number = null): Promise<SendInBlueListDetailVO> {
        if (!listName) {
            return null;
        }

        if (!folderId) {
            let folder: SendInBlueFolderDetailVO = await this.getorCreateDefaultFolder();
            folderId = folder.id;
        }

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueListController.PATH_LIST,
            { name: listName, folderId: folderId }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getList(parseInt(res.id));
    }

    public async getorCreateDefaultFolder(): Promise<SendInBlueFolderDetailVO> {
        let folder: SendInBlueFolderDetailVO = null;
        let folders: SendInBlueFoldersVO = await this.getFolders();

        if (folders && folders.folders) {
            folder = folders.folders.find((f) => f.name == ModuleSendInBlueController.getInstance().getDefaultFolderList());
        }

        if (!folder) {
            folder = await this.createFolder(ModuleSendInBlueController.getInstance().getDefaultFolderList());
        }

        return folder;
    }

    public async createFolder(folderName: string): Promise<SendInBlueFolderDetailVO> {
        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueListController.PATH_FOLDER,
            { name: folderName }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getFolder(parseInt(res.id));
    }

    public async getFolders(): Promise<SendInBlueFoldersVO> {
        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueFoldersVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_FOLDER);
    }

    public async getFolder(folderId: number): Promise<SendInBlueFolderDetailVO> {
        if (!folderId) {
            return null;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueFolderDetailVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_FOLDER + '/' + folderId);
    }

    public async getContacts(): Promise<SendInBlueContactsVO> {
        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueContactsVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_CONTACT);
    }

    public async getContact(email: string): Promise<SendInBlueContactDetailVO> {
        if (!email) {
            return null;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueContactDetailVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_CONTACT + '/' + email);
    }

    public async createContact(email: string, lastname: string = null, firstname: string = null, listIds: number[] = null, updateEnabled: boolean = true): Promise<SendInBlueContactDetailVO> {
        if (!email) {
            return null;
        }

        let res: InsertOrDeleteQueryResult = await ModuleSendInBlueController.getInstance().sendRequestFromApp<InsertOrDeleteQueryResult>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueListController.PATH_CONTACT,
            {
                email: email,
                listIds: listIds,
                updateEnabled: updateEnabled,
                attributes: {
                    NOM: lastname,
                    PRENOM: firstname,
                }
            }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getContact(email);
    }

    public async getContactsFromList(listId: number): Promise<SendInBlueContactsVO> {
        if (!listId) {
            return null;
        }

        return ModuleSendInBlueController.getInstance().sendRequestFromApp<SendInBlueContactsVO>(ModuleRequest.METHOD_GET, ModuleSendInBlueListController.PATH_LIST + '/' + listId + '/contacts');
    }

    public async addExistingContactsToList(listId: number, emails: string[]): Promise<boolean> {
        if (!emails || !emails.length || !listId) {
            return null;
        }

        let res: { contacts: { success: string, failure: string, total: number } } = await ModuleSendInBlueController.getInstance().sendRequestFromApp<{ contacts: { success: string, failure: string, total: number } }>(
            ModuleRequest.METHOD_POST,
            ModuleSendInBlueListController.PATH_LIST + '/' + listId + '/contacts/add',
            { emails: emails }
        );

        if (!res || !res.contacts || res.contacts.failure) {
            return false;
        }

        return true;
    }
}