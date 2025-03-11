import fs, { PathLike, Stats } from 'fs';
import StreamZip from 'node-stream-zip';
import { PassThrough } from 'stream';
import path from 'path';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import BGThreadServerController from '../BGThread/BGThreadServerController';

// -----------------------------------------------------------------------------
// 1) Fonction utilitaire d'encodage
// -----------------------------------------------------------------------------

export function fs_apply_encoding(data: Buffer, options: any): string | Buffer {
    if (!options) {
        return data;
    }
    if (typeof options === 'string') {
        return data.toString(options);
    }
    if (options.encoding) {
        return data.toString(options.encoding);
    }
    return data;
}

// -----------------------------------------------------------------------------
// 2) Fonctions utilitaires pour les archives
// -----------------------------------------------------------------------------

export async function fs_stream_zipped_archive(fileVO: FileVO, options?: any): Promise<string | Buffer> {
    const zip = new StreamZip.async({ file: fileVO.archive_path });
    const data = await zip.entryData(path.basename(fileVO.path));
    await zip.close();
    return fs_apply_encoding(data, options);
}

/**
 * Retourne un ReadableStream lisant l'entrée du zip, si le fichier est archivé.
 * On retourne un PassThrough, puis on fait la lecture asynchrone.
 * Avantage : le code appelant reçoit un Readable immédiatement.
 */
function createZippedReadStream(fileVO: FileVO, _options?: any) {
    const pass = new PassThrough();

    // On utilise la version "classique" de node-stream-zip (event-based)
    const zip = new StreamZip({
        file: fileVO.archive_path,
        storeEntries: true // permet de lister les entrées
    });

    zip.on('error', (err) => {
        pass.emit('error', err);
    });

    // Dès que le zip est prêt, on stream l'entrée correspondante
    zip.on('ready', async () => {
        try {
            // Lecture de l'entrée
            zip.stream(path.basename(fileVO.path), (err, stm) => {
                if (err) {
                    pass.emit('error', err);
                    return;
                }
                // Quand le flux se termine, on ferme le zip
                stm.on('end', () => {
                    zip.close();
                });
                stm.on('error', (err2) => {
                    pass.emit('error', err2);
                });
                // On pipe le contenu du ZIP vers le PassThrough
                stm.pipe(pass);
            });
        } catch (readErr) {
            pass.emit('error', readErr);
        }
    });

    return pass;
}

async function fs_stream_zipped_stat(fileVO: FileVO): Promise<Stats> {
    const zip = new StreamZip.async({ file: fileVO.archive_path });
    const entry = await zip.entry(path.basename(fileVO.path));
    if (!entry) {
        await zip.close();
        throw new Error(`Entry not found in archive for file: ${fileVO.path}`);
    }

    // On se construit un faux objet Stats cohérent
    const isDir = !!entry.isDirectory;
    const now = new Date(entry.time);
    const stats = Object.create(fs.Stats.prototype) as fs.Stats;

    stats.dev = 0;
    stats.ino = 0;
    stats.mode = isDir ? 0o40755 : 0o100666;
    stats.nlink = 1;
    stats.uid = 0;
    stats.gid = 0;
    stats.rdev = 0;
    stats.size = entry.size;
    stats.blksize = 4096;
    stats.blocks = Math.floor(entry.size / 4096) + 1;
    stats.atimeMs = now.getTime();
    stats.mtimeMs = now.getTime();
    stats.ctimeMs = now.getTime();
    stats.birthtimeMs = now.getTime();
    stats.atime = now;
    stats.mtime = now;
    stats.ctime = now;
    stats.birthtime = now;
    stats.isFile = () => !isDir;
    stats.isDirectory = () => isDir;
    stats.isBlockDevice = () => false;
    stats.isCharacterDevice = () => false;
    stats.isSymbolicLink = () => false;
    stats.isFIFO = () => false;
    stats.isSocket = () => false;

    await zip.close();
    return stats;
}

// -----------------------------------------------------------------------------
// 3) fs.readFile (Promesse) - avec fallback
// -----------------------------------------------------------------------------

// On mémorise la fonction PROMESSE originale
const originalFsPromisesReadFile = fs.promises.readFile;

async function patchedReadFilePromisified(
    filePath: PathLike,
    options?: any
): Promise<string | Buffer> {
    try {
        return await originalFsPromisesReadFile(filePath, options);
    } catch (err) {
        if (typeof filePath === 'string') {
            const fileVO = await query(FileVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<FileVO>().path, filePath)
                .exec_as_server()
                .select_vo<FileVO>();

            if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                return fs_stream_zipped_archive(fileVO, options);
            }
        }
        throw err;
    }
}

// -----------------------------------------------------------------------------
// 4) fs.readFile (Callback) - avec fallback
// -----------------------------------------------------------------------------

const originalReadFile = fs.readFile;

function patchedReadFile(
    filePath: PathLike | number,
    options: any,
    callback?: (err: NodeJS.ErrnoException | null, data?: string | Buffer) => void
): void {
    if (typeof options === 'function') {
        callback = options;
        options = undefined;
    }

    originalReadFile(filePath, options, async (err, data) => {
        if (err && typeof filePath === 'string') {
            try {
                const fileVO = await query(FileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<FileVO>().path, filePath)
                    .exec_as_server()
                    .select_vo<FileVO>();

                if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                    return callback?.(null, await fs_stream_zipped_archive(fileVO, options));
                }
            } catch (zipErr) {
                return callback?.(zipErr);
            }
        }
        callback?.(err, data);
    });
}

// On attache la version promisifiée à la fonction callback
const newReadFile = patchedReadFile as typeof fs.readFile;
newReadFile.__promisify__ = patchedReadFilePromisified as any;
fs.readFile = newReadFile;
(fs.promises as any).readFile = patchedReadFilePromisified;

// -----------------------------------------------------------------------------
// 5) fs.readFileSync - juste un warning, pas de fallback
// -----------------------------------------------------------------------------

const originalReadFileSync = fs.readFileSync;

function patchedReadFileSync(
    filePath: PathLike | number,
    options?: any
): string | Buffer {
    // On évite le warning tant que le serveur n'est pas "ready"
    if (BGThreadServerController.SERVER_READY) {
        if (typeof filePath === 'string' && !filePath.includes('node_modules')) {
            ConsoleHandler.error(
                `Vous devriez utiliser fs.readFile ou fs.promises.readFile pour gérer les archives. Fichier ouvert : ${filePath}`
            );
        }
    }
    return originalReadFileSync(filePath, options);
}

fs.readFileSync = patchedReadFileSync as any;

// -----------------------------------------------------------------------------
// 6) fs.stat - Callback
// -----------------------------------------------------------------------------

const originalStat = fs.stat;

function patchedStat(
    filePath: PathLike,
    callback: (err: NodeJS.ErrnoException | null, stats?: Stats) => void
): void {
    originalStat(filePath, async (err, stats) => {
        if (err && typeof filePath === 'string') {
            try {
                const fileVO = await query(FileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<FileVO>().path, filePath)
                    .exec_as_server()
                    .select_vo<FileVO>();

                if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                    return callback(null, await fs_stream_zipped_stat(fileVO));
                }
            } catch (zipErr) {
                return callback(zipErr);
            }
        }
        callback(err, stats);
    });
}

const newStat = patchedStat as typeof fs.stat;
fs.stat = newStat;

// -----------------------------------------------------------------------------
// 7) fs.promises.stat - Promesse
// -----------------------------------------------------------------------------

// On mémorise la fonction PROMESSE originale
const originalFsPromisesStat = fs.promises.stat;

async function patchedStatPromisified(filePath: PathLike): Promise<Stats> {
    try {
        return await originalFsPromisesStat(filePath);
    } catch (err) {
        if (typeof filePath === 'string') {
            const fileVO = await query(FileVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<FileVO>().path, filePath)
                .exec_as_server()
                .select_vo<FileVO>();

            if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                return fs_stream_zipped_stat(fileVO);
            }
        }
        throw err;
    }
}

// On remplace la méthode fs.promises.stat par notre version
(fs.promises as any).stat = patchedStatPromisified;

// -----------------------------------------------------------------------------
// 8) fs.createReadStream - fallback ZIP
// -----------------------------------------------------------------------------

const originalCreateReadStream = fs.createReadStream;

/**
 * On renvoie immédiatement un PassThrough. Au sein d’une tâche asynchrone,
 * on vérifie si le fichier est archivé, et on pipe soit depuis le ZIP,
 * soit depuis le vrai fichier local.
 */
function patchedCreateReadStream(filePath: PathLike, options?: any) {
    // On crée un pass pour renvoyer immédiatement un Readable "vide"
    const pass = new PassThrough();

    (async () => {
        try {
            if ((typeof filePath === 'string') && !fs.existsSync(filePath)) {
                // On regarde s'il existe un FileVO
                const fileVO = await query(FileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<FileVO>().path, filePath)
                    .exec_as_server()
                    .select_vo<FileVO>();

                // Si archivé => on lit depuis l'archive
                if (fileVO?.is_archived && fs.existsSync(fileVO.archive_path)) {
                    const zipStream = createZippedReadStream(fileVO, options);
                    zipStream.pipe(pass);
                    return;
                }
            }

            // Sinon on fallback direct
            const fileStream = originalCreateReadStream(filePath, options);
            fileStream.on('error', (err) => pass.emit('error', err));
            fileStream.pipe(pass);

        } catch (err) {
            pass.emit('error', err as Error);
        }
    })();

    return pass;
}

fs.createReadStream = patchedCreateReadStream as any;

// -----------------------------------------------------------------------------
// FIN
// -----------------------------------------------------------------------------