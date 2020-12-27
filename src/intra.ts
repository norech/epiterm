import axios from 'axios';
import { createWriteStream } from 'fs';
import { recreateSession } from './session';

const base_url = "https://intra.epitech.eu";

export async function authAutologin(autologinLink)
{
    const res = await axios.get(autologinLink, {
        maxRedirects: 0,
        headers: { 'Accept': '*/*' },
        withCredentials: true
    }).catch(err => err);
    const cookies = res.response.headers['set-cookie'];
    
    return(cookies.filter(c => c.indexOf("user") == 0)[0]);
}

export async function get(session, endpoint)
{
    if (session.cookie == undefined)
        await recreateSession(session);
    return axios.get(base_url + endpoint + (endpoint.indexOf("?") > 0 ? "&" : "?") + "format=json", { headers: { cookie: session.cookie } });
}

export async function post(session, endpoint, data?: any)
{
    if (session.cookie == undefined)
        await recreateSession(session);
    return axios.post(base_url + endpoint + (endpoint.indexOf("?") > 0 ? "&" : "?") + "format=json", data, { headers: { cookie: session.cookie } });
}

export function getDashboard(session)
{
    return get(session, "/");
}

export function getModules(session)
{
    return get(session, "/course/filter");
}

export function getUser(session)
{
    return get(session, "/user")
}

export function getPlanning(session, startdate, enddate)
{
    return get(session, "/planning/load?start=" + startdate + "&end=" + enddate)
}

export async function getImage(session, path)
{
    if (session.cookie == undefined)
        await recreateSession(session);
    const res = await axios.get(base_url + path, {
        headers: { cookie: session.cookie, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' },
        responseType: 'arraybuffer'
    });

    return ("data:image/jpeg;base64," + Buffer.from(res.data, 'binary').toString('base64'));
}

export async function downloadFile(session, path, localPath)
{ 
    const writer = createWriteStream(localPath)
      
    const response = await axios.get(base_url + path, {
        headers: { cookie: session.cookie, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' },
        responseType: 'stream'
    });
      
    response.data.pipe(writer);
      
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    });
}