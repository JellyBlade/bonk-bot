# bonk-bot

The only discord bot that plays VIP Aersia Playlists (I think, anyways).

It was an interesting experiment in making a discord bot, and a bit unique in my opinion.

Most discord music bots simply request youtube links from users, then play those.
Bonk Bot maintains a list of [.xspf files](https://en.wikipedia.org/wiki/XML_Shareable_Playlist_Format) that contains play information for the various [Aersia playlists](https://aersia.net/).
The bot parses these lists when asked by a user, and randomly shuffle-plays the entire list randomly forever, like a radio. This is similar to how the [playlist itself functions](https://www.vipvgm.net/).

As far as I know, this is the only publicly-available discord bot in the world to do this, which is pretty neat.

**However, currently this bot is a bit obsolete** as the Aersia playlists have moved away from the .xspf rosters. Additionally, Bonk Bot uses the old style of bot commands (?help vs. /help, for example). In the future, I'd like to switch to using the new json rosters and discordjs' slash commands.

[Video Example](https://www.youtube.com/watch?v=M8BLbkeZmuM)
![The discord bot in a channel](https://i.imgur.com/QTyxfgc.png)

