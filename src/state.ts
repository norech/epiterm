import { terminal as term } from  'terminal-kit';
import { Session } from './session';

export interface State {
    page?: string;
    onKeyPress: (key: string) => Promise<void>;
}

export type Page = (session: Session, state: State, ...args: any[]) => Promise<void>;

export async function loadPage(page: Page, session: Session, state: State, ...args: any[]): Promise<void> {
    term.clear();
    term.moveTo(1, 2);
	state.onKeyPress = undefined;
	term.grabInput(false);
	await page(session, state, ...args);
}