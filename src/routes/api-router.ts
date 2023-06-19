import * as express from 'express';
import { Snowflake } from "discord.js";
import { MusicController } from "../music/controller";


export const createApiRouter = (controllerByGuildId: Map<Snowflake, MusicController>) => {
	const apiRouter = express.Router();

	apiRouter.use((req, res, next) => {
		const guildId = req.app.locals.guildId;
		if (!guildId || !controllerByGuildId.has(guildId)) {
			return res.json({});
		}

		next();
	});

	apiRouter.get('/history', (req, res) => {
		const router = controllerByGuildId.get(req.app.locals.guildId);
		const history = router?.audioHistory;

		res.json(history);
	});

	apiRouter.get('/queue', (req, res) => {
		const router = controllerByGuildId.get(req.app.locals.guildId);
		const queue = router?.audioQueue;

		res.json(queue);
	});

	apiRouter.get('/currentSong', (req, res) => {
		const router = controllerByGuildId.get(req.app.locals.guildId);
		const currentSong = router?.currentSong;

		res.json(currentSong);
	});

	return apiRouter;
}