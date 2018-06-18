/// #if false
import * as fs from 'fs';
import { WriteStream } from 'fs';

export default class FileHandler {

    public static getInstance() {
        if (!FileHandler.instance) {
            FileHandler.instance = new FileHandler();
        }
        return FileHandler.instance;
    }

    private static instance: FileHandler = null;

    private constructor() { }

    public async dirExists(path: string) {
        return new Promise((resolve, reject) => {
            fs.exists(path, (res) => {
                resolve(res);
            });
        });
    }

    public async dirCreate(path: string) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, (res) => {
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
                resolve();
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
                resolve();
            });
        });
    }

    public getWriteStream(filepath: string, flags: string): WriteStream {
        return fs.createWriteStream(filepath, { flags: flags });
    }
}
/// #endif
