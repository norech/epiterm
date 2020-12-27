import { terminal as term } from  'terminal-kit';

export async function loader<T>(action: () => Promise<T>): Promise<T> {
    const spinner = await term.spinner('unboxing-color');
    term( ' Chargement... ' );
    const data = await action();
    spinner.animate(false);
    term.eraseLine();
    term('\n');
    return data;
}