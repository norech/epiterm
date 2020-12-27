import { authAutologin } from './intra';
import { existsSync, readFile, writeFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export async function getSession()
{
    if (!existsSync(__dirname + "/../session.json"))
        return {};
    const content = await readFileAsync(__dirname + "/../session.json", "utf8");
    return JSON.parse(content.toString());
}

export async function recreateSession(session)
{
    session.cookie = await authAutologin(session.autologin_link);
    if (!session.dont_save_session)
        return writeFileAsync(__dirname + "/../session.json", JSON.stringify(session), "utf8");
}