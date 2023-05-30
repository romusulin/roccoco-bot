import { ParsedMessageRequest } from "./parsed-message-request";
import { MusicRouter } from "./router";
import {Commands} from "./commands";

export class TaskExecutorBuilder {
	private functionMap: TaskExecutorMap;
	private commandArgumentQueue: ParsedMessageRequest[];
	private context: MusicRouter;
	private isExecuting: boolean;

	constructor(context: MusicRouter) {
		this.functionMap = {};
		this.commandArgumentQueue = [];
		this.context = context;
	}

	register(cmds: string[], func: Function): TaskExecutorBuilder {
		for (let cmd of cmds) {
			this.functionMap[cmd] = func.bind(this.context);
		}

		return this;
	}

	async execute(argObj: ParsedMessageRequest): Promise<TaskExecutorBuilder> {
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
			const argObj: ParsedMessageRequest = this.commandArgumentQueue.shift();
			const registeredFunction = this.functionMap[argObj.command];

			await registeredFunction(argObj);
		}

		this.isExecuting = false;
		return;
	}
}

export type TaskExecutorMap = {
	[command: string]: Function
}
