import { Installation } from "models/installation";
import { Subscription } from "models/subscription";
import { RepoSyncState } from "models/reposyncstate";
import { GitHubServerApp } from "models/github-server-app";
import fs from "fs";
import path from "path";
import { getHashedKey } from "models/sequelize";
import { v4 } from "uuid";

interface CreatorResult {
	installation: Installation;
	subscription: Subscription;
	repoSyncState: RepoSyncState | undefined;
	gitHubServerApp: GitHubServerApp | undefined
}

export class DatabaseStateCreator {

	private forServerFlag: boolean;
	private withActiveRepoSyncStateFlag: boolean;
	private pendingForPrs: boolean;
	private pendingForBranches: boolean;
	private failedForBranches: boolean;
	private pendingForCommits: boolean;
	private pendingForBuilds: boolean;
	private pendingForDeployments: boolean;

	private buildsCustomCursor: string | undefined;
	private prsCustomCursor: string | undefined;

	public static GITHUB_INSTALLATION_ID = 111222;

	public forServer() {
		this.forServerFlag = true;
		return this;
	}

	public forCloud() {
		this.forServerFlag = false;
		return this;
	}

	public withActiveRepoSyncState() {
		this.withActiveRepoSyncStateFlag = true;
		return this;
	}

	public repoSyncStatePendingForPrs() {
		this.pendingForPrs = true;
		return this;
	}

	public repoSyncStatePendingForCommits() {
		this.pendingForCommits = true;
		return this;
	}

	public repoSyncStatePendingForBuilds() {
		this.pendingForBuilds = true;
		return this;
	}

	public withBuildsCustomCursor(cursor: string) {
		this.buildsCustomCursor = cursor;
		return this;
	}

	public withPrsCustomCursor(cursor: string) {
		this.prsCustomCursor = cursor;
		return this;
	}

	public repoSyncStatePendingForDeployments() {
		this.pendingForDeployments = true;
		return this;
	}

	public repoSyncStatePendingForBranches() {
		this.pendingForBranches = true;
		return this;
	}

	public repoSyncStateFailedForBranches() {
		this.failedForBranches = true;
		return this;
	}

	public static createServerApp(installationIdPk: number): Promise<GitHubServerApp> {
		return GitHubServerApp.install({
			uuid: v4(),
			appId: 12321,
			gitHubBaseUrl: gheUrl,
			gitHubClientId: "client-id" + Math.random(),
			gitHubClientSecret: "client-secret",
			webhookSecret: "webhook-secret",
			privateKey: fs.readFileSync(path.resolve(__dirname, "../../test/setup/test-key.pem"), { encoding: "utf8" }),
			gitHubAppName: "app-name",
			installationId: installationIdPk
		}, jiraHost);
	}

	public async create(): Promise<CreatorResult> {
		const installation  = await Installation.create({
			jiraHost,
			encryptedSharedSecret: "secret",
			clientKey: getHashedKey("client-key"),
			plainClientKey: "client-key"
		});

		const gitHubServerApp = this.forServerFlag
			? await DatabaseStateCreator.createServerApp(installation.id)
			: undefined;

		const subscription = await Subscription.create({
			gitHubInstallationId: DatabaseStateCreator.GITHUB_INSTALLATION_ID,
			jiraHost,
			syncStatus: "ACTIVE",
			repositoryStatus: "complete",
			gitHubAppId: gitHubServerApp?.id
		});

		const repoSyncState = this.withActiveRepoSyncStateFlag ? await RepoSyncState.create({
			subscriptionId: subscription.id,
			repoId: 1,
			repoName: "test-repo-name",
			repoOwner: "integrations",
			repoFullName: "test-repo-name",
			repoUrl: "test-repo-url",
			repoPushedAt: new Date(),
			repoUpdatedAt: new Date(),
			repoCreatedAt: new Date(),
			branchStatus: this.pendingForBranches ? "pending" : (
				this.failedForBranches ? "failed" : "complete"
			),
			commitStatus: this.pendingForCommits ? "pending" : "complete",
			pullStatus: this.pendingForPrs ? "pending" : "complete",
			buildStatus: this.pendingForBuilds ? "pending" : "complete",
			deploymentStatus: this.pendingForDeployments ? "pending" : "complete",
			... (this.buildsCustomCursor ? { buildCursor: this.buildsCustomCursor } : { }),
			... (this.prsCustomCursor ? { pullCursor: this.prsCustomCursor } : { }),
			updatedAt: new Date(),
			createdAt: new Date()
		}) : undefined;

		return {
			installation: (await Installation.findByPk(installation.id))!,
			subscription: (await Subscription.findByPk(subscription.id))!,
			gitHubServerApp: (gitHubServerApp ? await GitHubServerApp.findByPk(gitHubServerApp.id) : undefined)!,
			repoSyncState:(repoSyncState ? await RepoSyncState.findByPk(repoSyncState.id) : undefined)!
		};
	}

}
