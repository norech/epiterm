import { terminal as term } from  'terminal-kit' ;
import { loader } from '../components/loader';
import { getPlanning, getUser } from "../intra";
import moment from 'moment';
import { Session } from '../session';
import { loadPage, State } from '../state';
import { actionBarChoice, actionBarInput, actionBarKeymap, showActionBarError } from '../components/actionBar';
import { displayEvent } from './display/event';

const showKeymap = () => (
    actionBarKeymap([
        { key: "s", desc: "Sélectionner" },
        { key: "b", desc: "Semaine préc." },
        { key: "n", desc: "Semaine suiv." },
    ])
);

const select = async (session: Session, state: State, activities) => {
    const activitiesNames = activities.map(activity => activity.acti_title);

    const input = await actionBarInput({
        label: "Sélectionner une activité: ", 
        inputFieldOptions: {
            cancelable: true,
            autoCompleteMenu: true,
            history: activitiesNames,
            autoComplete: activitiesNames,
            autoCompleteHint: true
        },
        validate: async (input) => {
            const valid = activitiesNames.includes(input);
            if (!valid)
                showActionBarError("L'activité '" + input + "' n'existe pas. Pensez à vérifier les majuscules. Appuyez sur TAB pour l'autocomplétion.");
            return (valid);
        }
    });

    if (input == undefined) {
        showKeymap();
        return;
    }
    const events = activities.filter(a => a.acti_title == input);

    let event = events[0];
    if (events.length > 1) {
        const input = await actionBarChoice({
            label: "Plusieurs activités ayant cet intitulé ont été trouvées. Veuillez sélectionner celle désirée.", 
            choices: events.map(e => e.start)
        });
        event = events[input.selectedIndex];
    }

    return loadPage(displayEvent, session, state, event);
};

export async function planning(session: Session, state: State, date?: moment.MomentInput) {
    const start = moment(date).toDate();
    const end = moment(start).add(7, "days").toDate();
    const activities = await loader(async () => {
        const planning = await getPlanning(session, start, end);

        if (typeof session.ignored_modules_from_planning === "undefined")
            session.ignored_modules_from_planning = [];
        return (planning.data.filter((p) => p.semester === session.user.semester && p.instance_location === session.user.location && !session.ignored_modules_from_planning.includes(p.titlemodule)).sort((pa, pb) => moment(pa.start).diff(pb.start)));
    });

    term.table([
        [ 'Date', 'Inscrit', 'Heure de début', 'Heure de fin', 'Module', 'Activité', 'Salle' ],
        ...activities.map(activity => {
            const rdv_suffix = activity.is_rdv == "1" ? " ^b(rendez-vous)" : "";
            const start = moment(activity.start);
            const end = moment(activity.end);
            const day = start.calendar(null, { nextWeek: "dddd DD MMMM YYYY", sameElse: "dddd DD MMMM YYYY" });
            let rdv = activity.rdv_indiv_registered || activity.rdv_group_registered;
            if (rdv) {
                const [rdv_start] = rdv.split('|');
                const [_, hour] = rdv_start.split(' ');
                rdv = "^yRDV À " + hour.slice(0, -3);
            }
            let registered = "";
            if (activity.event_registered == false) {
                registered = "^rNON INSCRIT!";
            } else if (activity.is_rdv == '1') {
                registered = (activity.rdv_indiv_registered || activity.rdv_group_registered) ? rdv : "^bRDV À PRENDRE!";
            } else if (activity.event_registered == "present") {
                registered = "^gPRÉSENT";
            } else if (activity.event_registered == "absent") {
                registered = "^yABSENT";
            } else {
                registered = "^gINSCRIT";
            }
            let room = "^wNon spécifiée";
            if (activity.room && activity.room.code) {
                const roomParts = activity.room.code.split("/");
                roomParts.splice(0, 2);
                room = roomParts.join(" - ") + " (" + activity.total_students_registered + "/" + activity.room.seats + ")";
            }
            return [ day, registered, start.format("HH:mm"), end.format("HH:mm"), activity.titlemodule, activity.acti_title + rdv_suffix, room ]
        })
    ], {
        hasBorder: false,
        contentHasMarkup: true,
        borderChars: 'lightRounded',
        borderAttr: { color: 'blue' } ,
        textAttr: { bgColor: 'default' } ,
        firstCellTextAttr: { bgColor: 'blue' },
        firstRowTextAttr: { bgColor: 'yellow' },
        width: term.width,
        evenRowTextAttr: { bgColor: 'grey' },
        x: 0,
        fit: true
    });

    showKeymap();

    state.onKeyPress = async (key) => {
        switch (key.toLowerCase()) {
            case "b":
                return loadPage(planning, session, state, moment(start).subtract(7, "days"));
            case "n":
                return loadPage(planning, session, state, moment(start).add(7, "days"));
            case "s":
                return select(session, state, activities);
        }
    };
}