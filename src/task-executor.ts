import { ArgumentPassObject, Commands } from "./interfaces";
import { MusicRouter } from "./music-router";

declare const console;

export class TaskExecutorBuilder {
	private functionMap: TaskExecutorMap;
	private commandQueue: Task[];
	private context: MusicRouter;
	private isExecuting: boolean;

	constructor(context: MusicRouter) {
		this.functionMap = {};
		this.commandQueue = [];
		this.context = context;
	}

	register(cmd: string, func: Function): TaskExecutorBuilder {
		this.functionMap[cmd] = func;

		return this;
	}

	async add(cmd: string, argObj: ArgumentPassObject): Promise<TaskExecutorBuilder> {
		if (!this.functionMap[cmd]) {
			return;
		}

		const newTask = <Task> { cmd: cmd, argObj: argObj };
		this.commandQueue.push(newTask);
		if (!this.isExecuting) {
			try {
				await this.execute();
			} catch (err) {
				this.isExecuting = false;
				console.warn("<-->Task executor: Error:" + err.message);
			}

		}

		return this;
	}

	async execute(): Promise<void> {
		this.isExecuting = true;
		while (this.commandQueue.length) {
			const task: Task = this.commandQueue.shift();
			const registeredFunction = this.functionMap[task.cmd];

			console.log("execute next");
			await registeredFunction.bind(this.context)(task.argObj);
			console.log("execute after");
		}

		this.isExecuting = false;
		return;
	}
}

export type TaskExecutorMap = {
	[value in Commands]?: Function
}

export interface Task {
	cmd: string,
	argObj: ArgumentPassObject
}