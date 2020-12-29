import { terminal as term } from  'terminal-kit' ;
import { loader } from '../components/loader';
import { getPlanning, getUser } from "../intra";
import moment from 'moment';
import { Session } from '../session';
import { State } from '../state';

export async function planning(session: Session, state: State) {
    const activities = await loader(async () => {
        const today = new Date()
        const later = new Date(today)
        later.setDate(later.getDate() + 7)
        const planning = await getPlanning(session, today.toISOString().split('T')[0], later.toISOString().split('T')[0]);

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
            let rdv = activity.rdv_indiv_registered;
            if (rdv) {
                const [rdv_start] = rdv.split('|');
                const [_, hour] = rdv_start.split(' ');
                rdv = "^yRDV À " + hour.slice(0, -3);
            }
            const registered = !activity.module_registered ? "^rNON INSCRIT!" : (activity.is_rdv ? (activity.rdv_indiv_registered ? rdv : "^bRDV À PRENDRE!") : "^gINSCRIT");
            let room = "^wNon spécifiée";
            if (activity.room) {
                const roomParts = activity.room.code.split("/");
                roomParts.splice(0, 2);
                room = roomParts.join(" - ") + " (" + activity.room.seats + ")";
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
}