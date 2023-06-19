export const parseCookies = function(req, res, next) {
	req.app.locals.guildId = req.signedCookies.guildId;
	next();
}