import { terminal as term } from  'terminal-kit' ;
import { actionBarYN, clearActionBar, showActionBarError } from '../../components/actionBar';
import { loader } from '../../components/loader';
import { get } from '../../intra';
import { Session } from '../../session';
import { loadPage, State } from '../../state';
import { displayFiles } from './files';

const showKeymap = (isRegistered) => {
    clearActionBar(false);
    term.bgWhite.black.moveTo(2, term.height - 1, "F");
    term(" Fichiers");
    term.bgWhite.black.moveTo(22, term.height - 1, "R");
    term(isRegistered ? " Se désinscrire" : " S'inscrire");
}

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
                try {
                    const files = await loader(() => get(session, projectUrl + "file/"));
                    await loadPage(displayFiles, session, state, files.data);
                } catch (ex) {
                    showActionBarError("Impossible de charger les fichiers: " + ex);
                }
                break;
            case "r":
                if (!project.register) {
                    showActionBarError("Les inscriptions sont fermées pour ce projet.");
                    return;
                }
                const actionTitle = isRegistered ? "désinscrire" : "inscrire";


                const doContinue = await actionBarYN({
                    label: "Voulez-vous vraiment vous " + actionTitle + " à ce projet ? (y/N)",
                    ynFieldOptions: { yes: [ 'y' ] , no: [ 'n', 'ENTER' ] }
                });
                if (!doContinue) {
                    showActionBarError("Action annulée.");
                    break;
                }
                showActionBarError("Cette fonctionnalité n'est pas encore disponible.");
                break;
        }

    };
}