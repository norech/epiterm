import { terminal as term } from  'terminal-kit';
import { Session } from './session';

export interface State {
    page?: string;
    onKeyPress: (key: string) => Promise<void>;
}

export type Page = (session: Session, state: State, ...args: any[]) => Promise<void>;
export type GenericPage<T extends any[]> = (session: Session, state: State, ...args: T) => Promise<void>;

export async function loadPage<T extends any[]>(page: GenericPage<T>, session: Session, state: State, ...args: T): Promise<void> {
    term.clear();
    term.moveTo(1, 2);
	state.onKeyPress = undefined;
	term.grabInput(false);
	return page(session, state, ...args);
}