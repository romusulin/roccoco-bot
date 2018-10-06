
declare const console;

import { ArgumentPassObject, Commands } from "./interfaces";
import { MusicRouter } from "./music-router";

export class TaskExecutorBuilder {
	private functionMap: TaskExecutorMap;
	private commandArgumentQueue: ArgumentPassObject[];
	private context: MusicRouter;
	private isExecuting: boolean;

	constructor(context: MusicRouter) {
		this.functionMap = {};
		this.commandArgumentQueue = [];
		this.context = context;
	}

	register(cmd: string, func: Function): TaskExecutorBuilder {
		this.functionMap[cmd] = func.bind(this.context);

		return this;
	}

	async execute(argObj: ArgumentPassObject): Promise<TaskExecutorBuilder> {
		const cmd: string = argObj.command;
		if (!this.functionMap[cmd]) {
			return;
		}

		this.commandArgumentQueue.push(argObj);
		if (!this.isExecuting) {
			try {
				await this.run();
			} catch (err) {
				this.isExecuting = false;
				console.warn(`<-->Task executor: Error:" + ${err.message}`);
			}

		}

		return this;
	}

	async run(): Promise<void> {
		this.isExecuting = true;
		while (this.commandArgumentQueue.length) {
			const argObj: ArgumentPassObject = this.commandArgumentQueue.shift();
			const registeredFunction = this.functionMap[argObj.command];

			await registeredFunction(argObj);
		}

		this.isExecuting = false;
		return;
	}
}

export type TaskExecutorMap = {
	[value in Commands]?: Function
}