import { terminal as term } from  'terminal-kit';
import { getSession, recreateSession } from "./session"
import axios from "axios";
import moment from 'moment';
import { projects } from './pages/projects';
import { profile } from './pages/profile';
import { planning } from './pages/planning';
import { logs } from './pages/logs';
import { modules } from './pages/modules';
import { loadPage } from './state';
import { logo } from './components/logo';

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

	axios.interceptors.response.use(null, async (error) => {
		if (error.config && error.response && error.response.status === 403) {
			if (error.config.retries && error.config.retries > 5)
				return Promise.reject(error);
			if (typeof error.config.retries == "undefined")
				error.config.retries = 0;
			error.config.retries++;
			await recreateSession(session);
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
		await recreateSession(session);
		term.clear();
	}

	term('\n\n');
	await logo(width);
	term("\n");
	const info = "epiterm " + pkg.version + " - " + pkg.author;
	const spacesCount = (width - info.length) / 2;
	term((spacesCount > 0 ? " ".repeat(spacesCount) : "") + info);
	term("\n\n");
	term('Utilisez les flèches et appuyez sur Entrer pour sélectionner un onglet. Appuyez sur Échap pour quitter.');
	while (true)
		await loadMenu(session, state);
}

async function loadMenu(session, state)
{
	const pagesTitles = Object.keys(pages);
	term.grabInput({ mouse: 'button' });
	options.selectedIndex = pagesTitles.indexOf(state.page);
	if (options.selectedIndex < 0)
		options.selectedIndex = 0;
	const response = await term.singleLineMenu(pagesTitles, options).promise;
	if (typeof response.unexpectedKey != 'undefined') {
		if (typeof state.onKeyPress != 'undefined')
			await state.onKeyPress(response.unexpectedKey);
		return;
	}
	term.clear();
	if (response.selectedText == undefined) {
		term.processExit();
		return;
	}
	const pageName = response.selectedText;
	state.page = pageName;
	return loadPage(pages[pageName], session, state);
}

init().catch(err => {
	console.error("A fatal error occured.");
	console.error(err);
});