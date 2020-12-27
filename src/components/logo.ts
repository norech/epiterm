import { terminal as term } from  'terminal-kit';

export function logo(width) {
    return new Promise<void>((resolve, reject) => {
        term.drawImage( __dirname + "/../../assets/logo.png", { shrink: { width, height: 30 } }, () => resolve());
    });
}