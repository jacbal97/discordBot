export function search(message, client, str1, str2)
{
    var count = 0;
    if(str2)
    {
        message.channel.messages.fetch()
            .then(messages =>
            {
                messages.forEach(m => 
                {
                    if(m.author.id === str2)
                    {
                        return count;
                    }
                    else if(m.author.id === str1)
                    {
                        count++;
                    }
                });
            })
    }
    else
    {
        message.channel.messages.fetch()
        .then(messages =>
        {
            messages.forEach(m => 
            {
                if(m.author.id === str1)
                {
                    count++;
                }
            });
        })
    }
    return count;
}