import { terminal as term } from  'terminal-kit';

export async function loader<T>(action: () => Promise<T>, message?: string): Promise<T> {
    term.clear();
    const spinner = await term.spinner('unboxing-color');
    let data;
    term( message || ' Chargement... ' );
    try {
        data = await action();
        spinner.animate(false);
        term.clear();
        term.moveTo(1, 2);
    } catch(ex) {
        spinner.animate(false);
        term.clear();
        term.moveTo(1, 2);
        throw ex;
    }
    return data;
}