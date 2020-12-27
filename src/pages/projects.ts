import { terminal as term } from  'terminal-kit' ;
import { staticProgress } from '../components/staticProgress';
import { loader } from '../components/loader';
import { getDashboard, get } from "../intra";
import { Session } from '../session';
import { actionBarInput, clearActionBar, showActionBarError } from '../components/actionBar';
import { loadPage, State } from '../state';
import { displayProject } from './display/project';

const showKeymap = () => {
    clearActionBar(false);
    term.bgWhite.black.moveTo(2, term.height - 1, "S");
    term(" Sélectionner");
}

export async function projects(session: Session, state: State)
{
    const { data } = await loader(async () => {
        const dashboard = await getDashboard(session);
        let projets = dashboard.data.board.projets;

        for (const i in projets) {
            const projet = projets[i];
            if (parseFloat(projet.timeline_barre) >= 100) {
                projet.is_hidden = true;
                continue;
            }
            projet.is_hidden = false;
        }
        return (dashboard);
    });
    const projects = data.board.projets;
    const visibleProjects = projects.filter(p => !p.is_hidden);

    term.table([
        [ 'Projet ', 'Inscrit ', 'Début ', 'Fin ', 'Timeline ' ],
        ...visibleProjects.map(projet => {
            const timeline_percent = parseFloat(projet.timeline_barre);
            let register_state = projet.date_inscription == false ? "^gINSCRIT" : "^rNON INSCRIT ^w(" + projet.date_inscription + ")";
            let timeline_start = projet.timeline_start;
            let timeline_end = projet.timeline_end;
            let timeline = (Math.round(timeline_percent * 100) / 100).toFixed(2) + "%";
            if (term.width <= 100) {
                register_state = register_state.split(' ^w(')[0];
                timeline_start = timeline_start.split(',')[0];
                timeline_end = timeline_end.split(',')[0];
            }
            if (term.width > 100)
                timeline = staticProgress(timeline_percent, 20) + " " + timeline;
            return [ projet.title + " ", register_state + " ", timeline_start + " ", timeline_end + " ", timeline ]
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

    const projectNames = projects.map(projet => projet.title);

    state.onKeyPress = async (key) => {
        if (key.toLowerCase() != "s") return;

        const input = await actionBarInput({
            label: "Sélectionner un projet: ", 
            inputFieldOptions: {
                cancelable: true,
                autoCompleteMenu: true,
                history: projectNames,
                autoComplete: projectNames,
                autoCompleteHint: true
            },
            validate: async (input) => {
                const valid = projectNames.includes(input);
                if (!valid)
                    showActionBarError("Le projet '" + input + "' n'existe pas. Pensez à vérifier les majuscules. Appuyez sur TAB pour l'autocomplétion.");
                return (valid);
            }
        });

        if (input == undefined) {
            showKeymap();
            return;
        }
        const project = projects.find(p => p.title == input);

        const { data: activity } = await loader(() => get(session, project.title_link));

        return loadPage(displayProject, session, state, project.title_link + "project/", activity);
    };
}