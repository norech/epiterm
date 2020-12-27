import { terminal as term } from  'terminal-kit' ;
import { loader } from '../components/loader';
import { getDashboard, getModules } from "../intra";

const showKeymap = () => {
    term.eraseArea(1, term.height - 1, term.width, 1);
    term.bgWhite.black.moveTo(2, term.height - 1, "S");
    term(" Sélectionner");
}

export async function modules(session, state)
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
        term.eraseArea(1, term.height - 1, term.width, 2);

        let input;        
        while (true) {
            term.moveTo(2, term.height - 1, "Sélectionner un module: ");
            input = await term.inputField({
                cancelable: true,
                autoCompleteMenu: true,
                history: moduleNames,
                autoComplete: moduleNames,
                autoCompleteHint: true
            }).promise;
            term.eraseArea(1, term.height - 1, term.width, 2);
            if (input == undefined) // esc is pressed
                return;
            if (moduleNames.includes(input)) {
                break;
            } else {
                term.bgRed.white.moveTo(2, term.height, "Le module '" + input + "' n'existe pas. Pensez à vérifier les majuscules. Appuyez sur TAB pour l'autocomplétion.");
            }
        }
        term.bgRed.white.moveTo(2, term.height, "Cette fonctionnalité n'est pas encore disponible.");
        showKeymap();
    };
}