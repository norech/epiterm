import { terminal as term } from  'terminal-kit' ;
import { clearActionBar, actionBarInput, showActionBarError } from '../components/actionBar';
import { loader } from '../components/loader';
import { getDashboard, getModules } from "../intra";
import { Session } from '../session';

const showKeymap = () => {
    clearActionBar(term, false);
    term.bgWhite.black.moveTo(2, term.height - 1, "S");
    term(" Sélectionner");
}

export async function modules(session: Session, state)
{
    const { data } = await loader(async () => {
        let modules = await getModules(session);
        let dashboard = await getDashboard(session);
        let promises = [];

        for (const i in modules.data) {
            const module = modules.data[i];
            const module_data = dashboard.data.current.find(m => module.code == m.code_module);
            if (module_data == undefined)
                continue;
            module.grade = module_data.grade;
        }

        modules.data = modules.data.filter(m => !(m.status === "notregistered" && m.open === "0"));
        await Promise.all(promises);
        return (modules);
    });

    term.table([
        [ 'Module ', 'Grade', 'État ', 'Fin d\'inscription ', 'Début ', 'Fin ', 'Crédits' ],
        ...data.map(module => {
            let note_state = module.is_note ? " ^b⏺": "";
            note_state += module.is_projet ? " ^y⏺": "";
            let state = "^rÉCHEC";
            switch (module.status) {
                case "ongoing":
                    state = "^bEN COURS";
                    break;
                case "notregistered":
                    state = "^rNON INSCRIT";
                    break;
                case "valid":
                    state = "^gVALIDÉ";
                    break;
            }
            let date_inscription = module.end_register || "Fermé";
            let credits = module.credits;
            return [ module.title + note_state + " ", (module.grade || "-") + ' ', state + " ", date_inscription + " ", module.begin + " ", module.end + " ", credits ]
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

    const moduleNames = data.map(module => module.title);

    state.onKeyPress = async (key) => {
        if (key.toLowerCase() != "s") return;

        const input = await actionBarInput(term, {
            label: "Sélectionner un module: ", 
            inputFieldOptions: {
                autoCompleteMenu: true,
                history: moduleNames,
                autoComplete: moduleNames,
                autoCompleteHint: true
            },
            validate: async (input) => {
                const valid = moduleNames.includes(input);
                if (!valid)
                    showActionBarError(term, "Le module '" + input + "' n'existe pas. Pensez à vérifier les majuscules. Appuyez sur TAB pour l'autocomplétion.");
                return (valid);
            }
        });

        if (input == undefined) {
            showKeymap();
            return;
        }
        showActionBarError(term, "Cette fonctionnalité n'est pas encore disponible.");
        showKeymap();
    };
}