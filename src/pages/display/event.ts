import moment from "moment";
import { terminal as term } from  'terminal-kit' ;
import { actionBarKeymap, actionBarYN, showActionBarError, showActionBarInfo } from '../../components/actionBar';
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

const switchRegister = async (session, state, eventLink: string, isRegistered: boolean, planningEvent) => {
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
    if (!planningEvent.module_registered) {
        showActionBarError("Vous n'êtes pas incrit au module lié à de cette activité.");
        return;
    }
    if (!planningEvent.allow_register) {
        showActionBarError("Les inscriptions sont fermées pour cette activité.");
        return;
    }
    if (moment(planningEvent.begin).diff(null, "hours") < 24) {
        showActionBarError("Vous ne pouvez pas vous inscrire à une activité qui a lieu dans moins de 24h.");
        return;
    }

    try {
        if (!isRegistered) {
            showActionBarInfo("Inscription à l'activité...");
            await post(session, eventLink + "register")
        } else {
            showActionBarInfo("Désinscription à l'activité...");
            await post(session, eventLink + "unregister")
        }
        return loadPage(displayEvent, session, state, planningEvent);
    } catch (ex) {
        showActionBarError("Impossible de vous " + actionTitle + ": " + ex);
    }
};

export async function displayEvent(session: Session, state: State, planningEvent)
{
    const eventLink = "/module/" + planningEvent.scolaryear + "/" + planningEvent.codemodule + "/" + planningEvent.codeinstance + "/" + planningEvent.codeacti + "/" + planningEvent.codeevent + "/";

    const { data: event } = await loader(() => get(session, eventLink));
    const activityLink = "/module/" + event.scolaryear + "/" + event.codemodule + "/" + event.codeinstance + "/" + event.codeacti + "/";

    const { data: activity } = await loader(() => get(session, activityLink));
    event.overview = activity.events.find(e => e.code == event.codeevent);

    const isRegistered = event.overview.already_register != null;

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
                return switchRegister(session, state, eventLink, isRegistered, planningEvent);
        }

    };
}