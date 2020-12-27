import { terminal as term } from  'terminal-kit' ;
import { staticProgress } from '../components/staticProgress';
import { loader } from '../components/loader';
import { getDashboard, get } from "../intra";

const showKeymap = () => {
    term.eraseArea(1, term.height - 1, term.width, 1);
    term.bgWhite.black.moveTo(2, term.height - 1, "S");
    term(" Sélectionner");
}

export async function projects(session, state)
{
    const { data } = await loader(async () => {
        const dashboard = await getDashboard(session);
        let promises = [];
        dashboard.data.board.projets = dashboard.data.board.projets.filter(p => parseFloat(p.timeline_barre) < 100);
        let projets = dashboard.data.board.projets;

        for (const i in projets) {
            const projet = projets[i];
            promises.push((async () => {
                const { data } = await get(session, projet.title_link);
                if (data.register == "1")
                    projet.not_registered = true;
                projet.is_note = data.is_note;
            })());
        }
        await Promise.all(promises);
        return (dashboard);
    });

    term.table([
        [ 'Projet ', 'Inscrit ', 'Fin d\'inscription ', 'Début ', 'Fin ', 'Timeline ' ],
        ...data.board.projets.map(projet => {
            const note_state = projet.is_note ? " ^b⏺": "";
            const timeline_percent = parseFloat(projet.timeline_barre);
            const register_state = projet.not_registered ? "^rNON INSCRIT" : "^gINSCRIT";
            let date_inscription = projet.date_inscription || "Fermé";
            let timeline_start = projet.timeline_start;
            let timeline_end = projet.timeline_end;
            let timeline = Math.round(timeline_percent * 100) / 100 + "%";
            if (term.width <= 100) {
                date_inscription = date_inscription.split(',')[0];
                timeline_start = timeline_start.split(',')[0];
                timeline_end = timeline_end.split(',')[0];
            }
            if (term.width > 100)
                timeline = staticProgress(timeline_percent, 20) + " " + timeline;
            return [ projet.title + note_state + " ", register_state + " ", date_inscription + " ", timeline_start + " ", timeline_end + " ", timeline ]
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
    } );
    showKeymap();

    const projectNames = data.board.projets.map(projet => projet.title);

    state.onKeyPress = async (key) => {
        if (key.toLowerCase() != "s") return;
        term.eraseArea(0, term.height - 1, term.width, 2);

        let input;        
        while (true) {
            term.moveTo(2, term.height - 1, "Sélectionner un projet: ");
            input = await term.inputField({
                cancelable: true,
                autoCompleteMenu: true,
                history: projectNames,
                autoComplete: projectNames,
                autoCompleteHint: true
            }).promise;
            term.eraseArea(1, term.height - 1, term.width, 2);
            if (input == undefined) { // esc is pressed
                showKeymap();
                return;
            }
            if (projectNames.includes(input)) {
                break;
            } else {
                term.bgRed.white.moveTo(2, term.height, "Le projet '" + input + "' n'existe pas. Pensez à vérifier les majuscules. Appuyez sur TAB pour l'autocomplétion.");
            }
        }
        term.bgRed.white.moveTo(2, term.height, "Cette fonctionnalité n'est pas encore disponible.");
        showKeymap();
    };
}