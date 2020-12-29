import { authAutologin, getUser } from './intra';
import { existsSync, readFile, writeFile } from 'fs';
import { promisify } from 'util';
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

export interface Session {
    autologin_link?: string;
    cookie?: string;
    user?: {
        last_refresh: number;
        login: string;
        location: string;
        internal_email: string;
        semester?: number;
    };
    dont_save_session?: boolean;
    ignored_modules_from_planning?: string[];
}

export async function getSession(): Promise<Session>
{
    if (!existsSync(__dirname + "/../session.json"))
        return {};
    const content = await readFileAsync(__dirname + "/../session.json", "utf8");
    const session: Session = JSON.parse(content.toString());

    if (typeof session.user === "undefined"
        || session.user.last_refresh > 60 * 60 * 1000)
            await refreshSessionCachedUserInfos(session);
    return (session);
}

export async function recreateSession(session: Session)
{
    session.cookie = await authAutologin(session.autologin_link);
    await refreshSessionCachedUserInfos(session);
    return saveSession(session);
}

export async function saveSession(session: Session)
{
    if (!session.dont_save_session)
        return writeFileAsync(__dirname + "/../session.json", JSON.stringify(session), "utf8");
}

export async function refreshSessionCachedUserInfos(session)
{
    const { data } = await getUser(session);
    session.user = {
        last_refresh: Date.now(),
        login: data.login,
        location: data.location,
        internal_email: data.internal_email,
        semester: data.semester
    };
    return saveSession(session);
}