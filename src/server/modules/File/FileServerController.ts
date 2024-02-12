import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import ConfigurationService from '../../env/ConfigurationService';

export default class FileServerController {

    // istanbul ignore next: nothing to test
    public static getInstance(): FileServerController {
        if (!FileServerController.instance) {
            FileServerController.instance = new FileServerController();
        }
        return FileServerController.instance;
    }

    private static instance: FileServerController = null;

    private constructor() { }

    /**
     *
     * @param old_path
     * @param toFolder
     * @returns the new path
     */
    public async moveFile(old_path: string, toFolder: string, file_name: string = null): Promise<string> {

        await this.makeSureThisFolderExists(toFolder);
        file_name = (file_name ? file_name : path.basename(old_path));
        let new_path = toFolder + file_name;
        while (fs.existsSync(new_path)) {
            file_name = '_' + file_name;
            new_path = toFolder + file_name;
        }
        fs.renameSync(old_path, new_path);
        return new_path;
    }

    /**
     *
     * @param srcFile
     * @param toFolder
     * @returns the new path
     */
    public async copyFile(srcFile: string, toFolder: string, file_name: string = null): Promise<string> {

        await this.makeSureThisFolderExists(toFolder);
        file_name = (file_name ? file_name : path.basename(srcFile));
        let new_path = toFolder + file_name;
        while (fs.existsSync(new_path)) {
            file_name = '_' + file_name;
            new_path = toFolder + file_name;
        }
        fs.copyFileSync(srcFile, new_path);
        return new_path;
    }

    public async makeSureThisFolderExists(folder: string) {
        return new Promise((resolve, reject) => {
            mkdirp(folder, function (err) {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        });
    }

    public async dirExists(filepath: string) {
        return new Promise((resolve, reject) => {
            fs.exists(filepath, (res) => {
                resolve(res);
            });
        });
    }

    public async dirCreate(filepath: string) {
        return new Promise((resolve, reject) => {
            fs.mkdir(filepath, (res) => {
                resolve(res);
            });
        });
    }

    public async writeFile(filepath: string, fileContent: string) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filepath, fileContent, function (err) {
                if (err) {
                    console.error(err);
                    resolve(err);
                    return;
                }
                console.log("File overwritten : " + filepath);
                resolve(null);
            });
        });
    }

    public async readFile(filepath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filepath, ConfigurationService.node_configuration.SERVER_ENCODING, function (err, data: string) {
                if (err) {
                    console.error(err);
                    resolve(null);
                    return;
                }
                console.log("File read : " + filepath);
                resolve(data);
            });
        });
    }


    public async appendFile(filepath: string, fileContent: string) {
        return new Promise((resolve, reject) => {
            fs.appendFile(filepath, fileContent, function (err) {
                if (err) {
                    console.error(err);
                    resolve(err);
                    return;
                }
                resolve(null);
            });
        });
    }

    public getWriteStream(filepath: string, flags: string): fs.WriteStream {
        return fs.createWriteStream(filepath, { flags: flags });
    }
}