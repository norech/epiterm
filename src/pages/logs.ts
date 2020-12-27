import { terminal as term } from  'terminal-kit' ;
import { staticProgress } from '../components/staticProgress';
import { loader } from '../components/loader';
import { getDashboard, get } from "../intra";
import striptags from "striptags";
import moment from "moment";
import { Session } from '../session';

export async function logs(session: Session, state)
{
    const { data } = await loader(() => getDashboard(session));

    term.bold("Notes:\n")
    term.table([
        [ '                      ', 'Note ', 'Correcteur ' ],
        ...data.board.notes.map(note => {
            return [note.title, note.note, note.noteur];
        })
    ], {
        hasBorder: false,
        contentHasMarkup: true,
        borderChars: 'lightRounded',
        borderAttr: { color: 'blue' } ,
        textAttr: { bgColor: 'default' } ,
        firstRowTextAttr: { bgColor: 'yellow' },
        //firstColumnTextAttr: { bgColor: 'gray' },
        width: term.width < 100 ? term.width : term.width / 2,
        evenRowTextAttr: { bgColor: 'grey' },
        x: 0,
        fit: true
    });
    term('\n')
    term.bold("Logs:\n")
    term.table([
        [ ' ', 'Auteur ', 'Contenu ' ],
        ...data.history.map(log => {
            return [moment(log.date).fromNow(), log.user.title, striptags(log.title).replace("&amp;", "&")];
        })
    ], {
        hasBorder: false,
        contentHasMarkup: true,
        borderChars: 'lightRounded',
        borderAttr: { color: 'blue' } ,
        textAttr: { bgColor: 'default' } ,
        firstRowTextAttr: { bgColor: 'yellow' },
        //firstColumnTextAttr: { bgColor: 'gray' },
        width: term.width,
        evenRowTextAttr: { bgColor: 'grey' },
        x: 0,
        fit: true
    });
}