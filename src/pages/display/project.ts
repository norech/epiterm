import { terminal as term } from  'terminal-kit' ;
import { Session } from '../../session';

export async function displayProject(session: Session, state, project)
{   
    term.table([
        [ project ]
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
}