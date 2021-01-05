import { stringify } from 'querystring';
import { terminal as term } from  'terminal-kit' ;
import { actionBarKeymap } from '../../components/actionBar';
import { loader } from '../../components/loader';
import { get, post } from '../../intra';
import { Session } from '../../session';
import { loadPage, State } from '../../state';
import { displayProject } from './project';

const showKeymap = (isRegistered) => (
    actionBarKeymap([
        { key: 'p', desc: "Projet" },
        { key: 'r', desc: (isRegistered ? "Se désinscrire" : "S'inscrire") },
    ])
);

export async function displayEvent(session: Session, state: State, eventUrl: string)
{
    const { data: event } = await loader(() => get(session, eventUrl));
    const activityLink = "/module/" + event.scolaryear + "/" + event.codemodule + "/" + event.codeinstance + "/" + event.codeacti + "/";

    const { data: activity } = await loader(() => get(session, activityLink));
    event.overview = activity.events.find(e => e.code == event.codeevent);

    const isRegistered = event.overview.user_status != null;

    let registered = "";
    if (event.overview.user_status == false) {
        registered = "^rNON INSCRIT!";
    } else if (event.overview.user_status == "present") {
        registered = "^gPRÉSENT";
    } else if (event.overview.user_status == "absent") {
        registered = "^yABSENT";
    } else {
        registered = "^gINSCRIT";
    }

    let room = "^wNon spécifiée";
    if (event.room && event.room.code) {
        const roomParts = event.room.code.split("/");
        roomParts.splice(0, 2);
        room = roomParts.join(" - ") + " (" + event.overview.nb_inscrits + "/" + event.room.seats + ")";
    }

    let title = event.acti_title;
    if (activity.events.length > 1)
        title += " - Session " + event.num_event;

    term.table([
        [ event.type_title, title ],
        [ 'Module', event.module_title ],
        [ 'Description', event.acti_description ],
        [ 'Inscrit', isRegistered ? "^gOUI" : "^rNON" ],
        [ 'Date', "Du " + event.begin + " au " + event.end ],
        [ 'Salle', room ],
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
            case "p":
                return loadPage(displayProject, session, state, activityLink + "project/", activity);
            case "r":
                if (!isRegistered)
                    post(session, eventUrl + "register/")
                else
                    post(session, eventUrl + "unregister/")
        }

    };
}