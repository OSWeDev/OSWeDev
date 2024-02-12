import ModuleRequest from '../../../../shared/modules/Request/ModuleRequest';
import SendInBlueContactDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueContactDetailVO';
import SendInBlueContactsVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueContactsVO';
import SendInBlueContactVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueContactVO';
import SendInBlueFolderDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueFolderDetailVO';
import SendInBlueFoldersVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueFolderVO';
import SendInBlueListDetailVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueListDetailVO';
import SendInBlueListsVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueListsVO';
import SendInBlueRequestResultVO from '../../../../shared/modules/SendInBlue/vos/SendInBlueRequestResultVO';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import SendInBlueServerController from '../SendInBlueServerController';

export default class SendInBlueListServerController {

    // istanbul ignore next: nothing to test
    public static getInstance(): SendInBlueListServerController {
        if (!SendInBlueListServerController.instance) {
            SendInBlueListServerController.instance = new SendInBlueListServerController();
        }

        return SendInBlueListServerController.instance;
    }

    private static instance: SendInBlueListServerController = null;

    private static PATH_CONTACT: string = 'contacts';
    private static PATH_LIST: string = 'contacts/lists';
    private static PATH_FOLDER: string = 'contacts/folders';

    public async getList(listId: number): Promise<SendInBlueListDetailVO> {
        if (!listId) {
            return null;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueListDetailVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_LIST + '/' + listId);
    }

    public async getLists(): Promise<SendInBlueListsVO> {
        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueListsVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_LIST);
    }

    public async createList(listName: string, folderId: number = null): Promise<SendInBlueListDetailVO> {
        if (!listName) {
            return null;
        }

        if (!folderId) {
            let folder: SendInBlueFolderDetailVO = await this.getOrCreateDefaultFolder();

            if (!folder) {
                return null;
            }

            folderId = folder.id;
        }

        let res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueListServerController.PATH_LIST,
            { name: listName, folderId: folderId }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getList(parseInt(res.id));
    }

    public async getOrCreateDefaultFolder(): Promise<SendInBlueFolderDetailVO> {
        let folder: SendInBlueFolderDetailVO = null;
        let folders: SendInBlueFoldersVO = await this.getFolders();
        let default_folder_list: string = await SendInBlueServerController.getInstance().getDefaultFolderList();

        if (folders && folders.folders) {
            folder = folders.folders.find((f) => f.name == default_folder_list);
        }

        if (!folder) {
            folder = await this.createFolder(default_folder_list);
        }

        return folder;
    }

    public async createFolder(folderName: string): Promise<SendInBlueFolderDetailVO> {
        let res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueListServerController.PATH_FOLDER,
            { name: folderName }
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getFolder(parseInt(res.id));
    }

    public async getFolders(): Promise<SendInBlueFoldersVO> {
        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueFoldersVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_FOLDER);
    }

    public async getFolder(folderId: number): Promise<SendInBlueFolderDetailVO> {
        if (!folderId) {
            return null;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueFolderDetailVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_FOLDER + '/' + folderId);
    }

    public async getContacts(): Promise<SendInBlueContactsVO> {
        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueContactsVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_CONTACT);
    }

    public async getContact(email: string): Promise<SendInBlueContactDetailVO> {
        if (!email) {
            return null;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueContactDetailVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_CONTACT + '/' + email);
    }

    public async createContact(contact: SendInBlueContactVO, listIds: number[] = null, updateEnabled: boolean = true): Promise<SendInBlueContactDetailVO> {
        if (!contact || !contact.email) {
            return null;
        }

        let postParams: any = {
            email: contact.email,
            updateEnabled: updateEnabled,
        };

        if (listIds) {
            postParams.listIds = listIds;
        }

        if (contact.lastname) {
            if (!postParams.attributes) {
                postParams.attributes = {};
            }

            postParams.attributes.NOM = contact.lastname;
        }

        if (contact.firstname) {
            if (!postParams.attributes) {
                postParams.attributes = {};
            }

            postParams.attributes.PRENOM = contact.firstname;
        }

        if (contact.sms) {
            if (!postParams.attributes) {
                postParams.attributes = {};
            }

            postParams.attributes.SMS = contact.sms;
        }

        let res: SendInBlueRequestResultVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueRequestResultVO>(
            ModuleRequest.METHOD_POST,
            SendInBlueListServerController.PATH_CONTACT,
            postParams
        );

        if (!res || !res.id) {
            return null;
        }

        return this.getContact(contact.email);
    }

    public async getContactsFromList(listId: number): Promise<SendInBlueContactsVO> {
        if (!listId) {
            return null;
        }

        return SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueContactsVO>(ModuleRequest.METHOD_GET, SendInBlueListServerController.PATH_LIST + '/' + listId + '/contacts');
    }

    public async createAndAddExistingContactsToList(name: string, contacts: SendInBlueContactVO[], force_create_or_update: boolean = false): Promise<SendInBlueListDetailVO> {
        let list: SendInBlueListDetailVO = await this.createList(name);

        if (!list) {
            return null;
        }

        await this.addExistingContactsToList(list.id, contacts, force_create_or_update);

        return list;
    }

    public async addExistingContactsToList(listId: number, contacts: SendInBlueContactVO[], force_create_or_update: boolean = false): Promise<boolean> {
        if (!contacts || !contacts.length || !listId) {
            return null;
        }

        if (force_create_or_update) {
            let promises: Array<Promise<any>> = [];

            for (let i in contacts) {
                // On en profite pour ajouter ou mettre a jour
                promises.push((async () => await this.createContact(contacts[i]))());
            }

            await all_promises(promises);
        }

        let emails: string[] = contacts.map((c) => c.email);
        let n: number = 0;
        let batch: string[];

        while ((n * 100) < emails.length) {

            batch = emails.slice(n * 100, n * 100 + 100);
            n += 1;

            await SendInBlueServerController.getInstance().sendRequestFromApp<{ contacts: { success: string, failure: string, total: number } }>(
                ModuleRequest.METHOD_POST,
                SendInBlueListServerController.PATH_LIST + '/' + listId + '/contacts/add',
                { emails: batch }
            );
        }

        return true;
    }

    /**
     *
     * @param limit MAX 50
     * @param offset
     */
    public async purgeLists(limit: number, offset: number): Promise<boolean> {
        let folder: SendInBlueFolderDetailVO = await this.getOrCreateDefaultFolder();

        while (limit > 0) {
            let limit_query: number = limit;

            if (limit_query > 50) {
                limit_query = 50;
            }

            let lists: SendInBlueListsVO = await SendInBlueServerController.getInstance().sendRequestFromApp<SendInBlueListsVO>(
                ModuleRequest.METHOD_GET,
                SendInBlueListServerController.PATH_FOLDER + '/' + folder.id.toString() + '/lists?limit=' + limit_query + '&offset=' + offset
            );

            if (!lists || !lists.lists || !lists.lists.length) {
                return true;
            }

            for (let i in lists.lists) {
                await SendInBlueServerController.getInstance().sendRequestFromApp(ModuleRequest.METHOD_DELETE, SendInBlueListServerController.PATH_LIST + '/' + lists.lists[i].id.toString());
            }

            limit -= limit_query;
        }

        return true;
    }
}