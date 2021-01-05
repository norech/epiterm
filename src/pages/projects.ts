import { terminal as term } from  'terminal-kit' ;
import { staticProgress } from '../components/staticProgress';
import { loader } from '../components/loader';
import { getDashboard, get } from "../intra";
import { Session } from '../session';
import { actionBarInput, actionBarKeymap, showActionBarError } from '../components/actionBar';
import { loadPage, State } from '../state';
import { displayProject } from './display/project';

const showKeymap = () => (
    actionBarKeymap([
        { key: "s", desc: "Sélectionner" }
    ])
);

const select = async (session: Session, state: State, projects) => {
    const projectNames = projects.map(projet => projet.title);

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
        [ 'Projet ', ' ', ' ' ],
        ...visibleProjects.map(projet => {
            const timeline_percent = parseFloat(projet.timeline_barre);
            let register_state = projet.date_inscription == false ? "" : "^rNON INSCRIT ^w(" + projet.date_inscription + ")";
            let timeline_start = projet.timeline_start;
            let timeline_end = projet.timeline_end;
            let timeline = "-";
            let timelinePercentage = (Math.round(timeline_percent * 100) / 100).toFixed(2) + "%";
            if (term.width <= 100) {
                register_state = register_state.split(' ^w(')[0];
                timeline_start = timeline_start.split(',')[0];
                timeline_end = timeline_end.split(',')[0];
            }
            let tail = "";
            if (term.width > 120) {
                timeline = staticProgress(timeline_percent, 20) + " ";
            }
            if (term.width > 140) {
                tail = "  ^w(" + timelinePercentage + ")";
            }
            return [ projet.title + " ", register_state + " ", timeline_start + " " + timeline + " " + timeline_end + tail ]
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

    state.onKeyPress = async (key) => {
        if (key.toLowerCase() != "s") return;

        return select(session, state, projects);
    };
}