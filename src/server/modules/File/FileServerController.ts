import fs from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import ConfigurationService from '../../env/ConfigurationService';

export default class FileServerController {

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

    /**
     * readdir
     * - Read a directory
     * - Returns a promise that resolves with the list of files in the directory
     * - Returns a promise that rejects with an error if the directory does not exist
     *
     * @param {string} filepath
     * @returns {Promise<string[]>}
     */
    public async readdir(filepath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(filepath, (err, files) => {
                // handling error
                if (err) {
                    reject(err);
                    return;
                }
                resolve(files);
            });
        });
    }

    /**
     * fileStat
     * - Get the stats of a file
     *
     * @param {string} filepath
     * @returns {Promise<fs.Stats>}
     */
    public async fileStat(filepath: string): Promise<fs.Stats> {
        return new Promise((resolve, reject) => {
            fs.stat(filepath, (err, stats) => {

                // handling error
                if (err) {
                    reject(err);
                    return;
                }

                resolve(stats);
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

    /**
     * readFile
     *  - Read a file and return its content
     *
     * @param {string} filepath
     * @returns {Promise<string>}
     */
    public async readFile(filepath: string, log_console: boolean = true): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filepath, ConfigurationService.node_configuration.SERVER_ENCODING, function (err, data: string) {
                if (err) {
                    console.error(err);
                    resolve(null);
                    return;
                }

                if (log_console) {
                    console.log("File read : " + filepath);
                }

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

    /**
     * watchFile
     * - Watch a file for changes (infinity loop)
     * - TODO: maybe add options to the watchFile function
     *
     * @param {string} filepath
     * @param {Function} callback
     * @param {number} interval
     * @returns {Promise<void>} a promise that resolves when the file throws an error
     */
    public async watchFile(filepath: string, callback: (curr: fs.Stats, prev: fs.Stats) => void, interval: number = 500): Promise<void> {
        // There is no resolve or reject here, because the callback is called each time the file is modified
        return new Promise((resolve, reject) => {
            try {
                fs.watchFile(
                    filepath,
                    { interval },
                    callback
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    public getWriteStream(filepath: string, flags: string): fs.WriteStream {
        return fs.createWriteStream(filepath, { flags: flags });
    }
}