import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import { parseCookies } from "./middleware/cookie-parser";
import { appRouter } from "./routes/app-router";
import { createApiRouter } from "./routes/api-router";
import { controllerByGuildId as routerMap } from "./discord-client/discord-client";

const app = express();
app.use(express.static('client/dist'));
app.use(cookieParser(process.env.COOKIE_SECRET || crypto.randomUUID()));
app.use(cors());

app.use('/app', appRouter);
app.use('/api', parseCookies, createApiRouter(routerMap));

const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
	console.log(`App running on port ${PORT}`);
});