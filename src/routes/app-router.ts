import * as path from "path";
import * as express from 'express';

export const appRouter = express.Router();
appRouter.get('/', (req, res) => {
	const guildId = req.query['guildId'];
	if (!guildId) {
		res.sendStatus(400);
	}


	res.cookie('guildId', guildId, {
		maxAge: 1000 * 60 * 60,
		httpOnly: true,
		signed: true
	});

	const indexPath = path.join(__dirname, '../../client/dist/index.html');
	res.sendFile(indexPath);
});