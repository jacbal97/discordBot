class Settings
{
	constructor(jsonObj)
	{
		this.token = jsonObj.token;
		this.prefix = jsonObj.prefix;
		this.volume = jsonObj.volume;

		this.loop = false;
        this.pause = false;
        this.paramStop = false;
	}
};

module.exports = Settings;