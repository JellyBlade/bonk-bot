const Discord = require('discord.js');
const fs = require('fs');
const xspf = require('xspf');
const util = require('util');
const { randomInt } = require('crypto');

const {
    prefix,
    token,
    playlists,
    defaultPlaylist
} = require('./settings.json');

// I hate this, I really need to make a class for this information
const dispatchers = {};
const guildSongs = {};
const connections = {};


const client = new Discord.Client();
client.login(token);

// Debug messages
client.once('ready', () => {
    client.user.setActivity(`${prefix}help`, {type: 'PLAYING'});
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnected!');
});

// Listen for commands
client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    else {
        var command = message.content.toLowerCase();
        command = command.replace(prefix, '');
        command = command.split(' ')[0];
        switch(command) {
            case 'play':
                playSong(message);
                break;
            case 'leave':
            case 'stop':
                leave(message);
                break;
            case 'pause':
            case 'p':
            case 'shh':
                pause(message);
                break;
            case 'resume':
            case 'r':
                resume(message);
                break;
            case 'skip':
                skip(message);
                break;
            case 'help':
            default:
                help(message);
                break;
        }
        return;
    }
})


async function playSong(message) {
    try {
        if (dispatchers[message.guild.id] != undefined) {
            if (dispatchers[message.guild.id].paused) {
                resume(message);
                return;
            }
        }
        var args = message.content.split(" ");
        var silent = false;

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.channel.send("You need to be in a voice channel to play music!");
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send("I need permissions to join and speak in your voice channel.");
        }

        let selectedPlaylist = args[1];
        let silentMode = args[2];

        if (selectedPlaylist != undefined) { selectedPlaylist = selectedPlaylist.toUpperCase(); }
        if (silentMode != "" && (silentMode == 'silent' || silentMode == 's')) {
            silent = true;
        }

        if (!selectedPlaylist || (selectedPlaylist == 'SILENT' || selectedPlaylist == 'S')) {
            if (selectedPlaylist == 'SILENT' || selectedPlaylist == 'S') {
                silent = true;
            }
            selectedPlaylist = defaultPlaylist;
        }
        else if (!(selectedPlaylist.toUpperCase() in playlists)) {
            message.channel.send(`Unrecognized playlist, use \`${prefix}help\` for a list of playlists.`);
            return;
        }

        if (!silent) {
            message.channel.send(`Playlist selected: ${selectedPlaylist}`);
        }
        var connection = await voiceChannel.join();
        updateGlobalConnectionsList(message, connection);
        updateGlobalSongsList(message, selectedPlaylist);
        
        if (dispatchers[message.guild.id] != undefined) {
            pause(message);
        }
        await new Promise(r => setTimeout(r, 500));
        actuallyPlayTheSong(message, connection, silent);
    }
    catch(error) {
        console.error(error);
    }
}

// I hate these
// I crave the sweet release of death

function updateGlobalDispatcherList(message, newDispatcher) {
    dispatchers[message.guild.id] = newDispatcher;
}

function updateGlobalSongsList(message, playlist) {
    guildSongs[message.guild.id] = parsePlaylist(playlist);
}

function updateGlobalConnectionsList(message, newConnection) {
    connections[message.guild.id] = newConnection;
}

function actuallyPlayTheSong(message, connection, silent) {    
    dispatcher = connection
        .play(selectSong(message, guildSongs[message.guild.id], silent))
        .on('finish', () => {
            setTimeout(function() {
                actuallyPlayTheSong(message, connection, silent);
            }, 500);
        })
        .on('error', error => console.error(error));
        dispatcher.setVolume(0.5);
        updateGlobalDispatcherList(message, dispatcher);
}

function parsePlaylist(playlist) {
    var songList = [];
    res = fs.createReadStream(`./manifests/${playlist}.xml`);
    new xspf(res).on('track', function (track) {
        songList.push(track);
    })
    .on('end', () => {
        res.close();
    });
    return songList;
}

function selectSong(message, songs, silent) {
    var currentSong = songs[randomInt(songs.length - 1)];
    if (!silent) {
        message.channel.send(`Now playing: \`` + util.format('%s - %s', currentSong['creator'], currentSong['title'] + '`'));
    }
    return currentSong['location'];    
}

function help(message) {
    message.channel.send(`Hi there, I'm BonkBot v1.0. Here's what I can do:
**Play:** \`${prefix}play [playlist]\`
    - Shuffle-plays the selected playlist, swapping out and skipping the current playlist if needed.
    - Optional: Appending "silent" or "s" to the command won't spam your chat.
    - (ie \`${prefix}play vip s\`)
**Skip:** \`${prefix}skip\`
    - Skips to the next song.
**Stop:** \`${prefix}stop\`
    - Stops and disconnects the bot.
    - Alternate: \`${prefix}leave\`
**Pause:** \`${prefix}pause\`
    - Pauses playback
    - Alternate: \`${prefix}p\` and \`${prefix}shh\`

Valid Playlists:
    - **VIP** - Videogame soundtracks [VIP]
    - **Mellow** - Videogame soundtracks, but soft. Perfect for sad boy hours [Mellow]
    - **Source** - VIP, minus any remixes [Source]
    - **Exiled** - Extra stuff not included in VIP [Exiled]
    - **WAP** - Weeaboo Animu Playlist [WAP]
    - **CPP** - TV/Movie/Cartoon themes [CPP]
    `);
}

function leave(message) {
    if (!message.member.voice.channel) {
        return message.channel.send("You have to be in a voice channel to stop the music!");
    }
    message.member.voice.channel.leave();
    message.channel.send("Goodbye!");
}

function pause(message) {
    dispatchers[message.guild.id].pause(true);
}

function resume(message) {
    dispatchers[message.guild.id].resume();
}

function skip(message) {
    if (connections[message.guild.id] == undefined) {
        return;
    }
    dispatchers[message.guild.id].pause(true);
    actuallyPlayTheSong(message, connections[message.guild.id], guildSongs[message.guild.id], false); // TODO: fix the silent thing lmao
}
