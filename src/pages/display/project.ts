import { stringify } from 'querystring';
import { terminal as term } from  'terminal-kit' ;
import { actionBarKeymap, actionBarYN, showActionBarError, showActionBarInfo } from '../../components/actionBar';
import { loader } from '../../components/loader';
import { get, post } from '../../intra';
import { Session } from '../../session';
import { loadPage, State } from '../../state';
import { displayFiles } from './files';

const showKeymap = (isRegistered) => (
    actionBarKeymap([
        { key: 'f', desc: "Fichiers" },
        { key: 'r', desc: (isRegistered ? "Se désinscrire" : "S'inscrire") },
    ])
);

const showFiles = async (session: Session, state: State, projectUrl: string) => {
    try {
        const files = await loader(() => get(session, projectUrl + "file/"));
        await loadPage(displayFiles, session, state, files.data);
    } catch (ex) {
        showActionBarError("Impossible de charger les fichiers: " + ex);
    }
}

const switchRegister = async (session: Session, state: State, isRegistered: boolean, projectUrl: string, project, activity) => {
    if (project.closed) {
        showActionBarError("Les inscriptions sont fermées pour ce projet.");
        return;
    }
    const actionTitle = isRegistered ? "désinscrire" : "inscrire";

    const doContinue = await actionBarYN({
        label: "Voulez-vous vraiment vous " + actionTitle + " à ce projet ? (y/N)",
        ynFieldOptions: { yes: [ 'y', 'Y' ] , no: [ 'n', 'N', 'ENTER' ] }
    });
    if (!doContinue) {
        showActionBarError("Action annulée.");
        showKeymap(isRegistered);
        return;
    }
    try {
        if (isRegistered) {
            if (project.user_project_master === "0") {
                showActionBarError("Cette fonctionnalité n'est pas encore disponible. Vous devez être chef de groupe pour quitter un groupe.");
                return;
            }
            showActionBarInfo("Destruction du groupe...");
            await post(session, projectUrl + "destroygroup", { code: project.user_project_code });
        } else {
            showActionBarInfo("Inscription au projet...");
            await post(session, projectUrl + "register/");
        }
    } catch (ex) {
        showActionBarError("Impossible de vous " + actionTitle + ": " + ex);
        showKeymap(isRegistered);
        return;
    }
    return loadPage(displayProject, session, state, projectUrl, activity);
};

export async function displayProject(session: Session, state: State, projectUrl, activity)
{
    const { data: project } = await loader(() => get(session, projectUrl));
    const userGroup = project.registered.find(r => r.code == project.user_project_code);
    const isRegistered = userGroup != undefined;

    let groupMembers = "";
    if (userGroup != undefined) {
        groupMembers += userGroup.master.login + " (chef de groupe)";

        if (userGroup.members.length > 0) {
            groupMembers += "\n" + userGroup.members.map(m => m.login + " (" + m.status + ")").join("\n");
        }
    }

    term.table([
        [ project.type_title, project.title ],
        [ 'Module', project.module_title ],
        [ 'Description', activity.description ],
        [ 'État des inscriptions', project.closed ? "^rFERMÉES" : "^gOUVERTES" ],
        [ 'Inscrit', isRegistered ? (project.user_project_status == "project_confirmed" ? "^gOUI" : "^bEN ATTENTE") : "^rNON" ],
        [ 'Date', "Du " + activity.begin + " au " + activity.end],
        [ 'Groupe', project.user_project_title == null ? "^rSans groupe" : project.user_project_title + "\n\n" + groupMembers],
    ], {
        hasBorder: true,
        contentHasMarkup: true,
        borderChars: 'lightRounded',
        borderAttr: { color: 'blue' } ,
        textAttr: { bgColor: 'default' } ,
        firstRowTextAttr: { bgColor: 'yellow' },
        firstColumnTextAttr: { bgColor: 'gray' },
        width: term.width,
        x: 0,
        fit: true
    });

    showKeymap(isRegistered);

    state.onKeyPress = async (key) => {

        switch (key.toLowerCase()) {
            case "f":
                return showFiles(session, state, projectUrl);
            case "r":
                return switchRegister(session, state, isRegistered, projectUrl, project, activity);
        }

    };
}