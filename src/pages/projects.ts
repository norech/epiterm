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
        let promises = [];
        let projets = dashboard.data.board.projets;

        for (const i in projets) {
            const projet = projets[i];
            if (parseFloat(projet.timeline_barre) >= 100) {
                projet.is_hidden = true;
                continue;
            }
            projet.is_hidden = false;
            promises.push((async () => {
                const { data } = await get(session, projet.title_link);
                if (data.register == "1")
                    projet.not_registered = true;
                projet.is_note = data.is_note;
                projet.is_projet = data.is_projet;
                projet.activity = data;
            })());
        }
        await Promise.all(promises);
        return (dashboard);
    });
    const projects = data.board.projets.filter(p => p.is_projet);
    const visibleProjects = projects.filter(p => !p.is_hidden);

    term.table([
        [ 'Projet ', 'Inscrit ', 'Fin d\'inscription ', 'Début ', 'Fin ', 'Timeline ' ],
        ...visibleProjects.map(projet => {
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

        if (typeof project.activity === "undefined") {
            const { data } = await loader(() => get(session, project.title_link));
            project.activity = data;
        }

        return loadPage(displayProject, session, state, project.title_link + "project/", project.activity);
    };
}