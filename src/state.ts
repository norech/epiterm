import { Session } from 'inspector';
import { terminal as term } from  'terminal-kit';

export interface State {
    page?: string;
    onKeyPress: (key: string) => Promise<void>;
}

export type Page = (session: Session, state: State, ...args: any[]) => Promise<void>;

export async function loadPage(page: Page, session: Session, state: State, ...args: any[]): Promise<void> {
	term.clear();
	state.onKeyPress = undefined;
	term.grabInput(false);
	await page(session, state, ...args);
}