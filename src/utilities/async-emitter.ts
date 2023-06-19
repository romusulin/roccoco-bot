import { EventEmitter } from "events";

interface ListenerState {
	fired: boolean;
	wrapFn: (...args: any[]) => void;
	event: string;
	listener: Function;
	emitter: AsyncEmitter;
};

export class AsyncEmitter extends EventEmitter {
	static async onceAsyncWrapper(...args): Promise<any> {
		const self = this as any as ListenerState;
		if (!self.fired) {
			self.emitter.removeListener(self.event, self.wrapFn);
			self.fired = true;

			return Reflect.apply(self.listener, self, args);
		}
	}

	static asyncOnceWrap(emitter: AsyncEmitter, event: string, listener: Function) {
		let state: ListenerState = {
			fired: false,
			wrapFn: undefined,
			event,
			listener,
			emitter
		};

		const wrapped = AsyncEmitter.onceAsyncWrapper.bind(state);
		wrapped.listener = listener;
		state.wrapFn = wrapped;

		return wrapped;
	}

	async asyncEmit(type, ...args): Promise<any[]> {
		const listeners: Function[] = this.rawListeners(type);
		if (!listeners || !listeners.length) {
			return;
		}

		const promises = [];
		for (const listener of listeners) {
			promises.push(Reflect.apply(listener, this, args));
		}

		return Promise.all(promises);
    }

    async asyncOnce(event: string, listener: any) {
		this.on(event, AsyncEmitter.asyncOnceWrap(this, event, listener));
	}
}

