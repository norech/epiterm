import { terminal as term } from  'terminal-kit' ;
import { loader } from '../components/loader';
import { getUser } from "../intra";
import { Session } from '../session';

export async function profile(session: Session, state)
{
    const { data } = await loader(() => getUser(session));
    
    term.table([
        [ data.title, data.groups.reverse().map(g => g.title).join(" - ") ],
        [ "Email", data.internal_email ],
        [ "Cycle", data.course_code ],
        [ "G.P.A.", data.gpa.reduce((total, c) => total + parseFloat(c.gpa), 0) ],
        [ "Crédits", data.credits ],
        [ "Netsoul", data.nsstat == undefined ? "^rNon disponible" : data.nsstat.active + "/" + data.nsstat.nslog_norm ],
        [ "Absences", data.events.length ],
    ], {
        hasBorder: true,
        contentHasMarkup: true,
        borderChars: 'lightRounded',
        borderAttr: { color: 'blue' } ,
        textAttr: { bgColor: 'default' } ,
        firstCellTextAttr: { bgColor: 'blue' },
        firstRowTextAttr: { bgColor: 'yellow' },
        firstColumnTextAttr: { bgColor: 'gray' },
        width: term.width,
        x: 0,
        fit: true
    });
}