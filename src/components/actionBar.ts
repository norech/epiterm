export function clearActionBar(term, clearErrors: boolean) {
    term.eraseArea(0, term.height - 1, term.width, clearErrors ? 2 : 1);
}

export function showActionBarError(term, message) {
    term.bgRed.white.moveTo(2, term.height, message);
}

export interface ActionBarInputOptions {
    label: string;
    inputFieldOptions: any;
    validate: (input: string) => Promise<boolean>;
}

export async function actionBarInput(term, options: ActionBarInputOptions) {
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