import { terminal as term } from  'terminal-kit' ;

export function clearActionBar(clearErrors: boolean) {
    term.eraseArea(0, term.height - 1, term.width, clearErrors ? 2 : 1);
}

export function showActionBarError(message) {
    term.eraseArea(0, term.height, term.width, 1);
    term.bgRed.white.moveTo(2, term.height, message);
}

export function showActionBarInfo(message) {
    term.eraseArea(0, term.height, term.width, 1);
    term.moveTo(2, term.height, message);
}

export interface ActionBarInputOptions {
    label: string;
    inputFieldOptions: any;
    validate: (input: string) => Promise<boolean>;
}

export async function actionBarInput(options: ActionBarInputOptions) {
    let input: string;        
    term.eraseArea(1, term.height - 1, term.width, 2);
    while (true) {
        term.moveTo(2, term.height - 1, options.label);
        input = await term.inputField({
            cancelable: true,
            ...options.inputFieldOptions
        }).promise;
        term.eraseArea(1, term.height - 1, term.width, 2);
        if (input == undefined) { // esc is pressed
            return (undefined);
        }
        if (await options.validate(input)) {
            break;
        }
    }
    return (input);
}