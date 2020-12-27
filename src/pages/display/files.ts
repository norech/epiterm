import { join } from 'path';
import { terminal as term } from  'terminal-kit' ;
import { actionBarInput, showActionBarError, showActionBarInfo } from '../../components/actionBar';
import { loader } from '../../components/loader';
import { downloadFile } from '../../intra';
import { Session } from '../../session';
import { State } from '../../state';

export async function displayFiles(session: Session, state: State, files)
{
    const fileNames = [ "Annuler", ...files.map(f => f.title) ];
    while (true) {
        term.moveTo.cyan(1, 2, 'Sélectionnez un fichier à télécharger:\n');
        const id = (await term.gridMenu(fileNames).promise).selectedIndex - 1;
        if (id == -1) {
            showActionBarError("Action annulée.");
            return;
        }

        const file = files[id];

        await loader(
            () => downloadFile(session, file.fullpath, join(process.cwd(), file.slug)),
            " Téléchargement de " + file.fullpath + "... "
        );

        showActionBarInfo("Fichier enregistré sous ./" + file.slug);
    }
}