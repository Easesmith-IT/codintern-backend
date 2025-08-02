const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser((user, done) => {
	done(null, user);
})
passport.deserializeUser(function (user, done) {
	done(null, user);
});

console.log("process.env.GOOGLE_CALLBACK_URL", process.env.GOOGLE_CALLBACK_URL);



passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID, // Your Credentials here. 
	clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Your Credentials here. 
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	passReqToCallback: true
},
	function (request, accessToken, refreshToken, profile, done) {
		return done(null, profile);
	}
));
