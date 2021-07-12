const {Client, MessageEmbed} = require("discord.js");
const {Player, Filters} = require("discord-player");
const f = require("fs");
const Settings = require("./includes/Settings")
const fetchWiki = require("./includes/fetchWiki");

//const embed messages
const embedHelp = new MessageEmbed()
	.setColor('#ff3300')
	.setTitle('HELP')
	.setDescription('available commands:')
	.setThumbnail('https://i.imgur.com/MMU3EDK.png')
	.addFields
	(
		{ name: 'MUTE ON/OFF', value: 'Mute/unmute everyone else in room' },
		{ name: 'ADD <name> <code> <dd.mm.yyyy>', value: 'Add new discount code' },
		{ name: 'DELETE <number>', value: 'Remove number of messages' },
		{ name: 'COUNT <name1> <name2>', value: 'Count messages from name1 to name2' },
		{ name: 'TRIVIA <wiki link>', value: 'Display new trivia' },
		{ name: 'LIVE', value: 'Move all users to live channel' },
		{ name: 'PLAYER', value: 'Display all player related commands' },
	)

const embedPlayer = new MessageEmbed()
	.setColor('#ff3300')
	.setTitle('Player')
	.setDescription('available commands:')
	.setThumbnail('https://i.imgur.com/MMU3EDK.png')
	.addFields
	(
		{ name: 'SKIP', value: 'Skip to the next song in the queue' },
		{ name: 'PLAY', value: 'Add song to the queue and plays it if the queue is empty' },
		{ name: 'LIST', value: 'Display current playlist' },
		{ name: 'LOOP', value: 'Loop/continue current playlist' },
		{ name: 'PAUSE', value: 'Pause/unpause song' },
		{ name: 'REMOVE <number>', value: 'Remove track number from the playlist' },
		{ name: 'VOLUME <number>', value: 'Set the volume in percent' },
		{ name: 'FILTER <name>', value: 'Change filter' },
	)


const bot = new Client;
const player = new Player(bot);
const settings = new Settings(JSON.parse(f.readFileSync("data/settings.json")))
bot.player = player;

const token = settings.token;
const prefix = settings.prefix;
var volume = settings.volume;

var loopMSG;
var loop = settings.loop;
var pause = settings.pause;
var paramStop = settings.paramStop;
var filter = null;

async function del(mes)
{
	if(mes)
	{
		if(!mes.deleted)
		{
			mes.delete();
			return true;
		}
	}
}

function add(string)
{	
	if(string)
	{
		let tmp = string.split(".");
		return [tmp[0], tmp[1], tmp[2]];
	}
	else
	{
		let today = new Date();
		today.setDate(today.getDate()+7);
		return [String(today.getDate()).padStart(2, '0'), String(today.getMonth() + 1).padStart(2, '0'), today.getFullYear()];
	}
}

function check(obj)
{
	let today = new Date();
	let day = Number(String(today.getDate()).padStart(2, '0'));
	let month = Number(String(today.getMonth() + 1).padStart(2, '0'));
	let year = today.getFullYear();

	for (let key in obj)
	{
		if (obj.hasOwnProperty(key))
		{
			var dayObj = obj[key].day;
			var monthObj = obj[key].month;
			var yearObj = obj[key].year;
		}

		if(yearObj < year)
		{
			delete obj[key];
			return;
		}
		else if(yearObj <= year && monthObj < month)
		{
			delete obj[key];
			return;
		}
		else if (yearObj <= year && monthObj <= month && dayObj < day)
		{
			delete obj[key];
			return;
		}
	}
}

function rep(obj, code, day, month, year)
{
	obj.code = code;
	obj.day = day;
	obj.month = month;
	obj.year = year;
}

async function search(message, str1, str2)
{

	let count = 0;
	return await message.channel.messages.fetch()
		.then(messages =>
		{
			let arr = messages.array();

			if(str2)
			{
				//console.log(arr);
				for(element in arr)
				{
					//console.log(arr[element].author.id);
					if(arr[element].author.id === str1)
					{
						count++;
					}
					else if (arr[element].author.id === str2)
					{
						return count;
					}
				}
			}
			else
			{
				for(element in arr)
				{
					if(arr[element].author.id === str1)
					{
						count++;
					}
					else
					{
						return count;
					}
				}
			}
		})
}

bot.on('ready', () =>  
{
	console.log(`Logged in as ${bot.user.tag}!`);
});

bot.player
	.on('trackStart', (message, track) => 
	{	
		const embedSong = new MessageEmbed()
			.setColor('#ff3300')
			.setAuthor(`We are playing`)
			.setTitle(`${track.title}`)
			.setURL(`${track.url}`)
			.setThumbnail(`${track.thumbnail}`)
			.setFooter(`added by ${message.author.username}`, `${message.author.avatarURL()}`)
		message.channel.send(embedSong).then(msg => {if (!msg.deleted) msg.delete({timeout: `${track.durationMS}`})});
	})
	.on('trackAdd', (message, queue, track) => 
	{
		const embedAdd = new MessageEmbed()
			.setColor('#ff3300')
			.setTitle(`${track.title}`)
			.setURL(`${track.url}`)
			.setThumbnail(`${track.thumbnail}`)
			.setFooter(`added by ${message.author.username}`, `${message.author.avatarURL()}`)
		message.channel.send(embedAdd).then(msg => {if(!msg.deleted) msg.delete({timeout: 10*1000})});
	})
	.on('looped', (message, enabled) =>
	{
		if(enabled)
		{
			const loopEmbed = new MessageEmbed()
				.setColor('#ff3300')
				.setFooter('Loop is enabled', bot.user.avatarURL());
			message.channel.send(loopEmbed).then(msg =>
			{
				loopMSG = msg;
			})
		}
		else if (loopMSG)
		{
			loopMSG.delete();
			loopMSG = undefined;
		}
	})
	.on('playlistAdd', (message, queue, playlist) => 
	{
		//message.channel.send(`${playlist.title} has been added to the queue (${playlist.tracks.length} songs)!`)
	})
	.on('searchResults', (message, query, tracks) => 
	{
		const embedTrack = new MessageEmbed()
			.setColor('#ff3300')
			.setThumbnail('https://i.imgur.com/MMU3EDK.png')
			.setAuthor(`Here are your search results for ${query}!`)
			.setDescription(tracks.map((t, i) => `${i}. ${t.title}`))
			.setFooter('Send the number of the song you want to play!')

		message.channel.send(embedTrack).then(msg => {if(!msg.deleted) msg.delete({timeout: 10*1000})});
	})
	.on('changedVolume', (message, percent) =>
	{
		const embedVolume = new MessageEmbed()
			.setColor('#ff3300')
			.setThumbnail('https://i.imgur.com/MMU3EDK.png')
			.setDescription(`Volume set to: ${percent}%`)
			.setFooter('brought by Our Comrade', bot.user.avatarURL());

		message.channel.send(embedVolume).then(msg => {if(!msg.deleted) msg.delete({timeout: 10*1000})});	
	})
	.on('searchInvalidResponse', (message, query, tracks, content, collector) => {

		if (content === 'cancel') {
			collector.stop()
			return message.channel.send('Search cancelled!')
		}
	
		message.channel.send(`You must send a valid number between 1 and ${tracks.length}!`)
	
	})
	.on('searchCancel', (message, query, tracks) =>
	{
		 message.channel.send('You did not provide a valid response... Please send the command again!')
	})
	.on('noResults', (message, query) => 
	{
		message.channel.send(`No results found on YouTube for ${query}!`)
	})
	.on('filterSet', (message, filter) => 
	{
		message.channel.send(`Changed filter to: ${filter}`)
	});

bot.on('message', async (message) =>
{
	//splitting message
	if (message.content.charAt(0) === prefix && (message.author.id === admin || !paramStop))
	{
		var command = message.content.slice(1, message.content.length).split(" ");

		if(command[1])
			if(!(command[1].startsWith("https") || command[1].startsWith("spotify")))
				for(key in command)
				{
					command[key].toLowerCase();
				}

		//command handler
		switch (command[0].toLowerCase())
		{
			case "help":
			{
				message.channel.send(embedHelp);
				break;
			}
			case "mute":
			{
				if(message.member.voice.channelID != null)
				{
					//variables
					channel = message.member.voice.channel;
					var author = message.author.id;

					//mute unmute handler
					switch (command[1])
					{
						case "on":
						{
							channel.members.each(user => 
							{
								if(user.id != author || user.id != bot.user.id)
								{
									message.guild.member(user).voice.setDeaf(true);
								}
							});
							break;
						}
						case "off":
						{
							channel.members.each(user => 
							{
								if(user.id != author || user.id != bot.user.id)
								{
									message.guild.member(user).voice.setDeaf(false);
								}
							});
							break;
						}
					}	
					break;
				}
			}
			case "add":
			{	
				try 
				{
					let obj = JSON.parse(f.readFileSync("data/data.json"));
					check(obj);

					//$add <nazwa> <code> <data("<day>.<month>.<year>")>
					if(command[1])
					{
						//read variables
						let name = command[1];
						let [day, month, year] = add(command[3]);
						let code = command[2];

						if(!code)
						{
							break;
						}

						if(obj[name] != undefined)
						{
							if(obj[name].year < year)
							{
								rep(obj[name], code, day, month, year);
							}
							else if (obj[name].year == year && obj[name].month < month)
							{
								rep(obj[name], code, day, month, year);
							}
							else if (obj[name].year == year && obj[name].month == month && obj[name].day <= day)
							{
								rep(obj[name], code, day, month, year);
							}	
						}
						else
						{
							obj[name] = {code, day, month, year};
						}

						f.writeFileSync("data/data.json", JSON.stringify(obj));
					}

					//variables
					let nameArr = [];
					let codeArr = [];
					let dataArr = [];

					for (let key in obj) 
					{
						if (obj.hasOwnProperty(key)) 
						{
							nameArr.push(key);
							codeArr.push(obj[key].code.toUpperCase());
							dataArr.push(`${obj[key].day}.${obj[key].month}.${obj[key].year}`);
						}
					}

					var codeEmbed = new MessageEmbed()
						.setColor('#ff3300')
						.setTitle('Kody Rabatowe')
						.setDescription('lista aktualnych kodów rabatowych')
						.setThumbnail('https://i.imgur.com/MMU3EDK.png');
					for(let i = 0; i < nameArr.length; i++)
					{
						codeEmbed.addField(nameArr[i], codeArr[i].concat(" ", dataArr[i]));
					}
					codeEmbed.setFooter('$add <name> <code> <DD.MM.YYYY> , default date + 7 days');

					channel = bot.channels.cache.find(c => c.id === promo_channel);

					channel.messages.fetch({limit: 2}).then(message => 
					{
						message.each(key => del(key));
						channel.send(codeEmbed);
					})

				} 
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "delete": //WIP
			{
				del(message);
				try 
				{
					if(!command[1] || !Number(command[1]) || command[1] < 1)
					{
						return;
					}

					if(command[2] > 10)
					{
						command[2] = 10;
					}

					if (!command[2])
					{
						(message.channel.messages.fetch({limit: Number(command[1])}))
							.then(messages => 
							{
								messages.each(key => 
									{
										console.log(key);
										del(key);
									})
								})
					}
					else
					{
						let i = 0;
						//console.log(bot.users.cache.find(u => u.username.toLowerCase() == command[2]));
						message.channel.messages.fetch({limit: 20})
							.then(messages => 
							{
								(messages.filter(m => m.author.id === bot.users.cache.find(u => u.username.toLowerCase() == command[2]).id)).forEach(msg => 
								{
									console.log(msg.id);
									if(!(i === Number(command[1])))
									{
										del(msg);
										i++
									}
									else
									{
										return;
									}
								});
							})
					}
					break;
				} 
				catch (error) 
				{
					console.log(error);	
				}
			}
			case "count":
			{
				del(message).then(message.author.send(await search(message, list[command[1]], list[command[2]])));
				break;
			}
			case "play":
			{
				try
				{
					command.shift();			
					let query = command.join(" "); //making querry from rest of the command

					if(command[0] === "our" && command[1] === "music")
					{
						query = "https://www.youtube.com/playlist?list=PLGfnB7toik4fKvD_mHCCoUwsIywB132Ys"
					}
					else if (command[0] === "our" && command[1] === "bond")
					{
						query = "https://www.youtube.com/watch?v=q_fI3EWYZqU";
					}

					if(!query)
						return;

					if(message.member.voice.channel)
					{
						//check if bot is already in voice channel
						if(!bot.voice.connections.first())
						{
							message.member.voice.channel.join();
							message.guild.member(bot.user).voice.setDeaf();
						}

						player.play(message, query, true);

					}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "filter":
			{
				try
				{
					if(player.isPlaying(message))
					{
						if(filter != null)
							{
								await player.setFilters(message, { [filter] : false });
							}

						for (key in player.filters)
						{
							if(key == command[1])
							{	
								await player.setFilters(message, { [key] : true });
								filter = key;
							}
						}
					}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "skip":
			{
				try
				{
					if(player.isPlaying(message))
						if(player.setLoopMode(message, false))
							player.skip(message);
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "volume":
			{
				try
				{
					if(player.isPlaying(message) && message.member.voice.channelID === message.guild.member(bot.user).voice.channelID)
					{
						if(command[1])
						{
							command[1] = parseInt(command[1]);
							if(command[1] <= 100 && command[1] >= 0)
							{
								volume = command[1];
								player.setVolume(message, volume);
							}
							else
							{
								player.emit('changedVolume', message, volume);
							}
						}
						else
						{
							player.emit('changedVolume', message, volume);
						}
					}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "list":
			{
				try
				{
					if(player.isPlaying(message))
					{
						const list = [...player.getQueue(message).tracks];
						if(list[0])
						{
							const embedList = new MessageEmbed()
								.setColor('#ff3300')
								.setTitle('Queue')
								.setThumbnail('https://i.imgur.com/MMU3EDK.png')
								.addField('Now playing', `${list[0].title}`);
							list.shift();
							for(key in list)
							{
								embedList.addField(`${parseInt(key)+1}`, `${list[key].title}`);
							}

							embedList.setFooter('brought by Our Comrade', bot.user.avatarURL());

							message.channel.send(embedList).then(msg => {if(!msg.deleted) msg.delete({timeout: 10*1000})});
						}
					}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "loop":
			{
				try
				{
					if(player.isPlaying(message) && player.getQueue(message).tracks)
					{
						if(loop)
						{
							player.setLoopMode(message, false);
							loop = false;
						}
						else
						{
							player.setLoopMode(message, true);
							loop = true;
						}
					}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "remove":
			{
				try
				{
					if(parseInt(command[1])+1 != 0)
						if(player.isPlaying(message) && player.getQueue(message).tracks.length >= 2)
						{
							console.log(player.getQueue(message).tracks.length);
							player.remove(message, parseInt(command[1]));

						}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "player":
			{
				try
				{
					message.channel.send(embedPlayer);
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "pause":
			{
				try
				{
					if(player.isPlaying(message))
					{
						if(pause)
						{
							player.resume(message);
							pause = false;
						}
						else
						{
							player.pause(message);
							pause = true;
						}
					}
				}
				catch (error) 
				{
					console.log(error);
				}
				break;
			}
			case "stop":
			{
				try 
				{
					if(message.author.id === admin)
					{
						if(paramStop)
						{
							paramStop = false;
						}
						else
						{
							paramStop = true;
						}
					}	
				} 
				catch (error) 
				{
					console.log(error);	
				}
				break;
			}
			case "trivia":
			{
				try 
				{
					//remove message
					del(message);
					trivia = fetchWiki((bot.channels.cache.find(c => c.id === trivia_channel)), bot.user.avatarURL(), command[1]);
					//trivia = fetchWiki(message.channel, bot.user.avatarURL(), command[1]);
				} 
				catch (error) 
				{
					console.log(error)
				}
				break;
			}
			case "live":
			{
				try
				{
					del(message);
					if(message.member.voice.channelID != null && message.member.voice.channelID != live_channel)
					{
						channel = message.member.voice.channel;
						channel.members.each(user =>
						{
							message.guild.member(user).voice.setChannel(live_channel, 'LIVE');
						});
						break;
					}	
				}
				catch (error)
				{
					console.log(error);
				}
				break;
			}	
		}
	}
});

//move message on reaction
bot.on('messageReactionAdd', async (reaction) =>
{
	try 
	{
		if(reaction.message.member.hasPermission("ADMINISTRATOR"))
		{

			var img = reaction.message.attachments;
			var name = reaction.message.author.username;
			var content = reaction.message.content;
			var channel;

			if (reaction.emoji.name === "👑")
			{
				channel = bot.channels.cache.find(c => c.id === meme_channel) //meme
				del(reaction.message);
			}
			else if (reaction.emoji.name === "🎯") 
			{
				channel = bot.channels.cache.find(c => c.id === text_channel) //text
				del(reaction.message);
			}
			else if (reaction.emoji.name === "👀")
			{
				channel = bot.channels.cache.find(c => c.id === trivia_channel) //ciekawostki
				del(reaction.message);
			}
			else if (reaction.emoji.name === "🍕")
			{
				channel = bot.channels.cache.find(c => c.id === promo_channel) //kody
				del(reaction.message);
			}
			else if (reaction.emoji.name === "😵")
			{
				channel = bot.channels.cache.find(c => c.id === olinks) //Obko-linki
				del(reaction.message);
			}
			else if (reaction.emoji.name === "📬")
			{
				channel = bot.channels.cache.find(c => c.id === mlinks) //Miodek-linki
				del(reaction.message);
			}
			else
			{
				//console.log(reaction.emoji.name);
				return 0;
			}

			reaction.message.guild.members.cache.get(bot.user.id).setNickname(name);
			//console.log(img, "---");
			if(img)
			{
				if(content)
				{
					channel.send(content, img.first());
				}
				else
				{
					channel.send(img.first());
				}
			}
			else
			{
				if(content)
				{
					channel.send(content.img.first());
				}
			}
			reaction.message.guild.members.cache.get(bot.user.id).setNickname(`Our Comrade (${prefix})`);
		}
	}
	catch (error) 
	{
		console.log(error);
	}
});

bot.login(token);