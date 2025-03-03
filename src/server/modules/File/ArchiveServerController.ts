import fs, { PathLike } from 'fs';
import StreamZip from 'node-stream-zip';
import path from 'path';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';

// TODO FIXME JNE : Tentative de rendre le comportement transparent et je n'y arrive pas...
// -----------------------------------------------------------------------------
// 1) Fonction utilitaire d'encodage
// -----------------------------------------------------------------------------

function applyEncoding(data: Buffer, options: any): string | Buffer {
    if (!options) {
        return data; // Pas d'options => renvoie le Buffer
    }
    // options = 'utf8' par exemple
    if (typeof options === 'string') {
        return data.toString(options);
    }
    // options = { encoding: 'utf8', flag: 'r' } par exemple
    if (options.encoding) {
        return data.toString(options.encoding);
    }
    return data;
}

// -----------------------------------------------------------------------------
// 2) fs.readFile - Version Promesse (__promisify__)
// -----------------------------------------------------------------------------

/**
 * Cette fonction sera appelée par util.promisify(fs.readFile)
 * ou tout code s'appuyant sur fs.readFile.__promisify__.
 * On y gère le fallback via ZIP.
 */
async function patchedReadFilePromisified(
    filePath: PathLike,
    options?: any
): Promise<string | Buffer> {
    try {
        // Lecture classique
        return await fs.promises.readFile(filePath, options);
    } catch (err) {
        if (typeof filePath === 'string') {
            const fileVO = await query(FileVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<FileVO>().path, filePath)
                .exec_as_server()
                .select_vo<FileVO>();

            if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                const zip = new StreamZip.async({ file: fileVO.archive_path });
                const data = await zip.entryData(path.basename(fileVO.path));
                await zip.close();

                return applyEncoding(data, options);
            }
        }
        throw err;
    }
}

// -----------------------------------------------------------------------------
// 3) fs.readFile - Version callback
//    (avec déclarations de surcharges pour TypeScript)
// -----------------------------------------------------------------------------

// Surcharges officielles de fs.readFile (simplifiées sur l’option "flag")
function patchedReadFile(
    _path: PathLike | number,
    callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
): void;
// function patchedReadFile(
//     _path: PathLike | number,
//     options: { encoding: BufferEncoding; flag?: string | number },
//     callback: (err: NodeJS.ErrnoException | null, data: string) => void
// ): void;
// function patchedReadFile(
//     _path: PathLike | number,
//     options: { encoding?: null; flag?: string | number } | undefined | null,
//     callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
// ): void;
function patchedReadFile(
    _path: PathLike | number,
    options: string | { encoding?: string | null; flag?: string | number } | undefined | null,
    callback: (err: NodeJS.ErrnoException | null, data: string | Buffer) => void
): void;

/**
 * Implémentation unique de la fonction callback :
 * on réutilise l'original, on gère ensuite le fallback ZIP si erreur ENOENT.
 */
function patchedReadFile(
    filePath: PathLike | number,
    options: any,
    callback?: (err: NodeJS.ErrnoException | null, data?: string | Buffer) => void
): void {
    // Cas fs.readFile(path, callback)
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }

    const originalReadFile = fs.readFile; // on récupère la référence “originale” (la notre est plus bas)

    originalReadFile(filePath, options, async (err, data) => {
        if (err && typeof filePath === 'string') {
            try {
                const fileVO = await query(FileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<FileVO>().path, filePath)
                    .exec_as_server()
                    .select_vo<FileVO>();

                if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                    const zip = new StreamZip.async({ file: fileVO.archive_path });
                    let zipData: Buffer | string = await zip.entryData(path.basename(fileVO.path));
                    await zip.close();

                    zipData = applyEncoding(zipData, options);
                    return callback?.(null, zipData);
                }
            } catch (zipErr) {
                return callback?.(zipErr);
            }
        }
        callback?.(err, data);
    });
}

// -----------------------------------------------------------------------------
// 4) On rattache la propriété __promisify__
//    => pour permettre util.promisify(fs.readFile)
// -----------------------------------------------------------------------------

// On stocke la VRAIE fonction readFile originale
const originalReadFile = fs.readFile;

// On crée la nouvelle fonction (avec la signature surchargée)
const newReadFile = patchedReadFile as typeof fs.readFile;

// On lui attache la promesse
newReadFile.__promisify__ = patchedReadFilePromisified as any;

// Puis on remplace fs.readFile par cette nouvelle version
fs.readFile = newReadFile;

// -----------------------------------------------------------------------------
// 5) fs.readFileSync - Surcharge + Overloads TypeScript
// -----------------------------------------------------------------------------

const originalReadFileSync = fs.readFileSync;

// Surcharges officielles
function patchedReadFileSync(
    _path: PathLike | number,
    options?: { encoding?: null; flag?: string | number }
): Buffer;
function patchedReadFileSync(
    _path: PathLike | number,
    options: { encoding: BufferEncoding; flag?: string | number }
): string;
function patchedReadFileSync(
    _path: PathLike | number,
    options?: string | { encoding?: string | null; flag?: string | number }
): string | Buffer;

/**
 * Implémentation unique : on logue un warning et on lit normalement,
 * sans fallback ZIP.
 */
function patchedReadFileSync(
    filePath: PathLike | number,
    options?: any
): string | Buffer {
    ConsoleHandler.error(
        `Vous devriez utiliser fs.readFile ou fs.promises.readFile pour gérer les archives. Fichier ouvert : ${filePath}`
    );
    return originalReadFileSync(filePath, options);
}

fs.readFileSync = patchedReadFileSync as any;

// -----------------------------------------------------------------------------
// FIN
// -----------------------------------------------------------------------------

