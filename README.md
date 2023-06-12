<h1 style="text-align:center;">Jaazdin Discord Bot</h1>

### Huge thanks to: [MerricaN41](https://github.com/MericcaN41)
I took the template that was supplied [here](https://github.com/MericcaN41/discordjs-v14-template-ts) and utilized it to make my own discord.js bot for a personal server!

## Useage
Clone the repository then create a file named `.env` and fill it out accordingly

```js
TOKEN=YOURTOKENHERE
CLIENT_ID=BOTS CLIENT ID
PREFIX=!
MONGO_URI=YOUR MONGO CONNECTION STRING
MONGO_DATABASE_NAME=YOUR DATABASE NAME
```

Build the project using the typescript module `tsc` and start the bot using the `npm start` command

## New Slash Commands
To create any new slash commands, simply create a file inside `src/slashCommands/` be sure to include `.ts` behind the file, and insert the following:
```js
import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("slashcommand")
    .setDescription("This is a new Slash Command")
    ...
    ,
    execute: async (interaction) => {
        try {
            await interaction.deferReply({ephemeral: true}); // Or if you want everyone to see it, leave it blank
            ...
        }
        catch (error){
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}
export default command;
```
With this, you can create custom interactions with each command.



## Integration into live 24/7 discord bot for my friends Dungeons and Dragons server
Following this [video](https://www.youtube.com/watch?v=90JbCrB3m3I) went into Oracle Cloud Infrastructure (OCI), followed along.

Made sure to go into the `package.json` file on the OCI and make the following changes:
```js
...
  "scripts": {
    "start": "cls && node build/index.js" --> "start": "pm2 start build/index.js",
	    --> "stop" : "pm2 stop all"
  },
...
```