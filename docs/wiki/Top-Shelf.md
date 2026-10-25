# Top Shelf

*Settings › Home screen › Layout › Shelf.* As on Apple TV, the focused app fills the screen with what is trending there. **Down** opens a row of recommendations. **OK** opens an item directly in YouTube, Twitch, ZDF or ARTE, and opens the app itself for the others. **Up** or **Back** returns to the apps.

Google TV doesn't share its recommendations with other launchers, so Shore reads public catalogues about once an hour, over HTTPS only:

| Apps | Source | Key |
| --- | --- | --- |
| ARD Mediathek, ZDF, ARTE | Their own public catalogues | None |
| Netflix, Disney+, Prime Video, Joyn, waipu.tv, Apple TV | [TMDB](https://www.themoviedb.org) watch providers for Germany | `tmdb.token` |
| YouTube | YouTube Data API v3 | `youtube.apiKey` |
| Twitch | Twitch Helix API | `twitch.clientId`, `twitch.clientSecret` |

Apps without recommendations show their own banner, softly blurred. Release APKs carry no keys, so only the catalogues that need none work there; for the rest [build from source](Build-from-source) with your own keys.

Keys go in `android/local.properties`, or the environment variables `TMDB_TOKEN`, `YOUTUBE_API_KEY`, `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` (also used as GitHub Actions secrets).

## Getting the Twitch keys

No login or user token needed. Shore asks Twitch for an **app access token** by itself (the *client credentials* flow), so you never sign in or paste a token. You need two values from your own Twitch application:

1. Open the [Twitch developer console](https://dev.twitch.tv/console/apps) and choose **Register Your Application**. Turn on two-factor authentication first if Twitch asks for it.
2. **Name**: anything unique, for example `Shore-TV-yourname`. **OAuth Redirect URLs**: `http://localhost`. Twitch requires one, but Shore never uses it. **Category**: *Application Integration*. **Client type**: *Confidential*.
3. Open the application with **Manage**. Copy the **Client ID**, then choose **New Secret** and copy the **Client Secret**. Twitch shows it only once.
4. Add both to `android/local.properties` and rebuild:

   ```properties
   twitch.clientId=your-client-id
   twitch.clientSecret=your-client-secret
   ```

To check the pair before building, ask Twitch for a token yourself. A JSON reply with `access_token` means the keys work:

```bash
curl -X POST "https://id.twitch.tv/oauth2/token" -d "client_id=YOUR_ID" -d "client_secret=YOUR_SECRET" -d "grant_type=client_credentials"
```

Authorize links (`https://id.twitch.tv/oauth2/authorize?…`) and token generator websites create *user* tokens, which Shore doesn't use. Never paste a user token anywhere: it can act as your account. If you made one, revoke it under twitch.tv › *Settings › Connections*.
