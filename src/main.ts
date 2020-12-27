import { terminal as term } from  'terminal-kit' ;
import { getSession, recreateSession } from "./session"
import axios from "axios";
import moment from 'moment';
import { projects } from './pages/projects';
import { profile } from './pages/profile';
import { planning } from './pages/planning';
import { logs } from './pages/logs';
import { modules } from './pages/modules';
import { read } from 'fs';

const pkg = require("../package.json");
term.fullscreen(true);
moment.locale('fr');

var options = {
	y: 1,
	style: term.inverse,
	selectedIndex: 0,
	selectedStyle: term.dim.blue.bgGreen,
	width: term.width,
	cancelable: true,
	exitOnUnexpectedKey: true
};

var pages = {
	'Aperçu': logs,
	'Planning': planning,
	'Projets': projects,
	'Modules': modules,
	'Profil': profile,
};

async function init()
{
	const session = await getSession();

	axios.interceptors.response.use(null, (error) => {
		if (error.config && error.response && error.response.status === 403) {
			recreateSession(session);
			error.config.headers.cookie = session.cookie;
			return axios.request(error.config);
		}
		return Promise.reject(error);
	});
	
	const min = (a, b) => a < b ? a : b;
	const width = min(100, term.width);
	const state = {
		page: undefined,
		onKeyPress: undefined
	};

	term.on('key' , (name, matches, data) => {
		if (name == "CTRL_C") {
			term.processExit();
		}
    });

	if (typeof session.autologin_link === "undefined") {
		term.green("epiterm ne supporte que les liens d'autologin pour l'instant. Vous pouvez récupérer le votre sur cette page: https://intra.epitech.eu/admin/autolog\n");
		term.gray("Format: https://intra.epitech.eu/auth-XXXXXXXXXXXXXXXXXXXXXXXXXXXX\n")
		term("\n")
		term.bold("Entrez votre lien d'autologin: ");
		const input = await term.inputField().promise;
		session.autologin_link = input;

		term("\n")
		term.bold("Voulez-vous enregistrer votre lien d'autologin et votre session? (y/N)");
		const saveSession = await term.yesOrNo( { yes: [ 'y' ] , no: [ 'n', 'ENTER' ] }).promise;
		if (!saveSession) {
			session.dont_save_session = true;
		}
		recreateSession(session);
		term.clear();
	}

	term('\n\n');
	term.drawImage( __dirname + "/../assets/logo.png", { shrink: { width, height: 30 } }, async () => {
		term("\n");
		const info = "epiterm " + pkg.version + " - " + pkg.author;
		const spacesCount = (width - info.length) / 2;
		term((spacesCount > 0 ? " ".repeat(spacesCount) : "") + info);
		term("\n\n")
		term('Utilisez les flèches et appuyez sur Entrer pour sélectionner un onglet. Appuyez sur Échap pour quitter.');
		while (true)
			await loadMenu(session, state);
	});

}

async function loadMenu(session, state)
{
	const pagesTitles = Object.keys(pages);
	return new Promise<void>((resolve, reject) => {
		term.grabInput({ mouse: 'button' });
		options.selectedIndex = pagesTitles.indexOf(state.page);
		if (options.selectedIndex < 0)
			options.selectedIndex = 0;
		term.singleLineMenu(pagesTitles, options, async (error, response) => {
			if (typeof response.unexpectedKey != 'undefined') {
				if (typeof state.onKeyPress != 'undefined')
					await state.onKeyPress(response.unexpectedKey);
				resolve();
				return;
			}
			term.clear();
			if (error)
				reject(error);
			if (response.selectedText == undefined) {
				term.processExit();
				return;
			}
			state.page = response.selectedText;
			state.onKeyPress = undefined;
			term.grabInput(false);
			pages[state.page](session, state).then(r => resolve());
		});
	});
}

init();