const rp = require('request-promise');
const {MessageEmbed, Message} = require("discord.js")
const $ = require('cheerio');
let url = 'https://en.wikipedia.org/wiki/Special:Random';

module.exports = async function fetchWiki(channel, id, urls)
{
    let arr = [];
    if(urls)
    {
        url = urls;
    }

    const charList = [
        "[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]", "[0]"
    ]

    rp(url)
        .then(function(html) {
            arr[0] = `https://${$('.firstHeading', html).attr('lang')}.wikipedia.org`.concat($('#ca-view a[href]', html).attr('href'));
            arr[1] = $('.firstHeading', html).text();
            arr[3] = $('meta[property="og:image"]', html).attr('content');
            let tmp = $.load(html);
            if(($(tmp('div').find('p')[0]).text()).length < 20)
            {
                //console.log(($(tmp('div').find('p')[0]).text()).length, '\n');
                arr[2] = $(tmp('div').find('p')[1]).text();
            }
            else
            {
                arr[2] = $(tmp('div').find('p')[0]).text();
            }
            for(element in charList)
            {
                //console.log(charList[element]);
                arr[2] = String(arr[2]).replace(/charList[element]/g, '');
            }
            //console.log("LINK:", arr[0], " | TITLE: ", arr[1], " | CONTENT: " , arr[2]);

            let embedTrivia = new MessageEmbed()
						.setColor('#ff3300')
						.setTitle(arr[1])
						.setURL(arr[0])
                        .setDescription(arr[2])
                        .setFooter('brought by Our Comrade', id);
                        if(arr[3])
                        {
                            embedTrivia.setThumbnail(arr[3]);
                        }

            let tmpMsg = new Message();
            tmpMsg.channel = channel;

            tmpMsg.channel.send(embedTrivia);

        })
        .catch(function(err) {
            throw(err);
        })
}