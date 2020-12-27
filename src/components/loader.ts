import { terminal as term } from  'terminal-kit';

export async function loader<T>(action: () => Promise<T>, message?: string): Promise<T> {
    term.clear();
    const spinner = await term.spinner('unboxing-color');
    term( message || ' Chargement... ' );
    const data = await action();
    spinner.animate(false);
    term.clear();
    term.moveTo(1, 2);
    return data;
}