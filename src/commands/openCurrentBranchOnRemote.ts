import { TextEditor, Uri, window } from 'vscode';
import { Commands } from '../constants';
import type { Container } from '../container';
import { GitUri } from '../git/gitUri';
import { RemoteResourceType } from '../git/remotes/provider';
import { Logger } from '../logger';
import { RepositoryPicker } from '../quickpicks/repositoryPicker';
import { command, executeCommand } from '../system/command';
import { ActiveEditorCommand, getCommandUri } from './base';
import { OpenOnRemoteCommandArgs } from './openOnRemote';

@command()
export class OpenCurrentBranchOnRemoteCommand extends ActiveEditorCommand {
	constructor(private readonly container: Container) {
		super(Commands.OpenCurrentBranchOnRemote);
	}

	async execute(editor?: TextEditor, uri?: Uri) {
		uri = getCommandUri(uri, editor);

		const gitUri = uri != null ? await GitUri.fromUri(uri) : undefined;

		const repository = await RepositoryPicker.getBestRepositoryOrShow(gitUri, editor, 'Open Current Branch Name');
		if (repository == null) return;

		try {
			const branch = await repository.getBranch();
			if (branch?.name) {
				void (await executeCommand<OpenOnRemoteCommandArgs>(Commands.OpenOnRemote, {
					resource: {
						type: RemoteResourceType.Branch,
						branch: branch.name || 'HEAD',
					},
					repoPath: repository.path,
				}));
			}
		} catch (ex) {
			Logger.error(ex, 'OpenCurrentBranchOnRemoteCommand');
			void window.showErrorMessage(
				'Unable to open branch on remote provider. See output channel for more details',
			);
		}
	}
}
