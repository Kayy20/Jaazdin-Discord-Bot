import { Client, GatewayIntentBits, Collection, Interaction, userMention, EmbedBuilder, TextChannel} from "discord.js";
const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits
const client = new Client({intents:[Guilds, MessageContent, GuildMessages, GuildMembers]})
import { Command, SlashCommand } from "./types";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { CronJob } from "cron";
import  mongoose from "mongoose";
import BuildingDB from "./schemas/Building";
import ChannelDB from "./schemas/Channel";
import PlantDB from "./schemas/Plant";
import ItemDB from "./schemas/Item";
config()

client.slashCommands = new Collection<string, SlashCommand>()
client.commands = new Collection<string, Command>()
client.cooldowns = new Collection<string, number>()

const handlersDir = join(__dirname, "./handlers")
readdirSync(handlersDir).forEach(handler => {
    require(`${handlersDir}/${handler}`)(client)
})

client.on('ready', () => {
    let job = new CronJob("00 01 00 * * 1",
    function() {SendUpdate()},
    null,
    true,
    'America/New_York')
})

client.login(process.env.TOKEN)

async function SendUpdate() {
    // No Connection...
    if (mongoose.connection.readyState === 0) {
        return;
    }
    // No channels found
    let foundBuilding = await ChannelDB.findOne({});
    
    if (!foundBuilding) {
        return
    }
    // Find each finished/unfinished building    
    let finishedBuildings = "";
    let updatedBuildings ="";
    let pings = "";
    // update each building
    for await (const doc of BuildingDB.find()) {
        doc.time -= 1;
        if (doc.time == 0) {
            pings += userMention(doc.user);
            finishedBuildings += `${userMention(doc.user)} ${doc.name} to Tier: ${doc.tier} has been completed!\n`;
            BuildingDB.deleteOne({name: doc.name}).exec();
        }
        else {
            updatedBuildings += `${doc.name} \t Tier: ${doc.tier} \t Weeks Left: ${doc.time}\n`;
            await doc.save();
        }
    }
    
    let finishedPlants = "";
    let updatedPlants = "";
    // update each plant
    for await (const doc of PlantDB.find()) {
        doc.time -= 1;
        if (doc.time == 0) {
            pings += userMention(doc.user);
            finishedPlants += `${userMention(doc.user)} fresh harvest of ${doc.name}!\n`;
            if(doc.repeatable) {
                doc.time = doc.repeatTime;
            }
            else PlantDB.deleteOne({name: doc.name}).exec();
        }
        else {
            updatedPlants += `${doc.name} \t Weeks Left: ${doc.time}\n`;
            await doc.save();
        }
    }

    let finishedItems = "";
    let updatedItems = "";
    // update each item
    for await (const doc of ItemDB.find()) {
        doc.time -= 1;
        if (doc.time == 0) {
            pings += userMention(doc.user);
            finishedItems += `${userMention(doc.user)}, your ${doc.name} is finished!\n`;
            ItemDB.deleteOne({name: doc.name}).exec();
        }
        else {
            updatedItems += `${doc.name} \t Weeks Left: ${doc.time}\n`;
            await doc.save();
        }
    }

    // Find Channel
    const channel = await client.channels.cache.get(foundBuilding.channel.toString());
        
    // Create embed with information
    const embed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle("Weekly Downtime Reset")
            .addFields(
                {
                    name: "Finished Buildings",
                    value: finishedBuildings == "" ? "None" : finishedBuildings
                },
                {
                    name: "Buildings In Progress",
                    value: updatedBuildings == "" ? "None" : updatedBuildings
                },
                {
                    name: "Finished Plants",
                    value: finishedPlants == "" ? "None" : finishedPlants
                },
                {
                    name: "Plants In Progress",
                    value: updatedPlants == "" ? "None" : updatedPlants
                },
                {
                    name: "Finished Items",
                    value: finishedItems == "" ? "None" : finishedItems
                },
                {
                    name: "Items in Progress",
                    value: updatedItems == "" ? "None" : updatedItems
                }
            )
            .setTimestamp();
    if (channel instanceof TextChannel)
         channel.send({content: pings, embeds: [embed]});
}

let name = ""; // used for all types
let time = 0; // only used for plants
let user = ""; // only used for plants
let type = 0; // 0 = nothing, 1 = building, 2 = plant, 3 = item

client.on('interactionCreate', async (interaction: Interaction): Promise<void> => {

    if (interaction.isStringSelectMenu()) {
        if (!interaction.customId.endsWith(interaction.user.id)){
            interaction.reply({
                content: "Touch that again and you'll get fed to the basement tree.",
                ephemeral: true
            });
            return;
        }
        
        let thing = interaction.values[0].split('-');
        name = thing[0];
        try {
            time = parseInt(thing[1]);
            user = thing[2];
        } catch (e){
            // No time... meaning not a plant kek
        }

        interaction.reply({content: `${name} Selected`});
        interaction.deleteReply();

    }
    
    if (interaction.isButton()){

        if (!interaction.customId.endsWith(interaction.user.id)){
            interaction.reply({
                content: "Touch that again and you'll get fed to the basement tree.",
                ephemeral: true
            });
            return;
        }
        // set up the drop down menu
        switch (interaction.customId.split('-')[0]){
            case "building": 
            // Get the building from the Database
                const foundBuilding = await BuildingDB.findOne({name: name});
                if (!foundBuilding) return; // Just to say if there is no found building
                
                if (interaction.customId.split('-')[1] == '1week') // Increase time by 1 week
                {
                    foundBuilding.time -= 1; // Reduce building time

                    if (foundBuilding.time <= 0) // Building is done!
                    {
                        let embed = new EmbedBuilder() // Create and embed to show the update to the user
                        .setTitle(foundBuilding.name)
                        .setDescription(`${userMention(foundBuilding.user)}, ${foundBuilding.name} is now Tier: ${foundBuilding.tier}!`)

                        interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})

                        BuildingDB.deleteOne({name: foundBuilding.name}).exec();

                    } else
                    {
                        await foundBuilding.save();

                        let embed = new EmbedBuilder()
                        .setTitle(foundBuilding.name)
                        .setDescription("Time till finished decreased by 1!")
                        .addFields(
                            {
                            name: 'Amount:',
                            value: `${foundBuilding.time} Weeks Left`
                            }
                        )
            
                        interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})
                    }

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                }
                if (interaction.customId.split('-')[1] == '2week') // Increase time by 2 weeks
                {
                    foundBuilding.time -= 2;

                    if (foundBuilding.time <= 0) // Building is done!
                    {
                        let embed = new EmbedBuilder()
                        .setTitle(foundBuilding.name)
                        .setDescription(`${userMention(foundBuilding.user)}, ${foundBuilding.name} is now Tier: ${foundBuilding.tier}!`)

                        interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})

                        BuildingDB.deleteOne({name: foundBuilding.name}).exec();
                    } else
                    {
                        await foundBuilding.save();

                        let embed = new EmbedBuilder()
                        .setTitle(foundBuilding.name)
                        .setDescription("Time till finished decreased by 2!")
                        .addFields(
                            {
                            name: 'Amount:',
                            value: `${foundBuilding.time} Weeks Left`
                            }
                        )
            
                        interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})
                    }

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                    
                }
                if (interaction.customId.split('-')[1] == 'finishbuilding') // Finish Building
                {
                    let embed = new EmbedBuilder()
                    .setTitle(foundBuilding.name)
                    .setDescription(`${userMention(foundBuilding.user)}, ${foundBuilding.name} is now Tier: ${foundBuilding.tier}!`)

                    interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})

                    BuildingDB.deleteOne({name: foundBuilding.name}).exec();

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                }

                break;
            case "plant":
                // Get the plant from the Database
                const foundPlant = await PlantDB.findOne({name: name, time: time, user: user});
                if (!foundPlant) return; // Just to say if there is no found building

                if (interaction.customId.split('-')[1] == '1week') // Increase time by 1 week
                {
                    foundPlant.time -= 1;

                    if (foundPlant.time <= 0) // Plant is done!
                    {
                        let embed = new EmbedBuilder()
                        .setTitle(foundPlant.name)
                        .setDescription(`${userMention(foundPlant.user)}, fresh harvest of ${foundPlant.name}!`)

                        interaction.channel?.send({content: userMention(foundPlant.user), embeds: [embed]})

                        PlantDB.deleteOne({name: foundPlant.name}).exec();

                    } else
                    {
                        await foundPlant.save();

                        let embed = new EmbedBuilder()
                        .setTitle(foundPlant.name)
                        .setDescription("Time till finished decreased by 1!")
                        .addFields(
                            {
                            name: 'Amount:',
                            value: `${foundPlant.time} Weeks Left`
                            }
                        )
            
                        interaction.channel?.send({content: userMention(foundPlant.user), embeds: [embed]})
                    }

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                }
                if (interaction.customId.split('-')[1] == '2week') // Increase time by 2 weeks
                {
                    foundPlant.time -= 2;

                    if (foundPlant.time <= 0) // Plant is done!
                    {
                        let embed = new EmbedBuilder()
                        .setTitle(foundPlant.name)
                        .setDescription(`${userMention(foundPlant.user)}, fresh harvest of ${foundPlant.name}!`)

                        interaction.channel?.send({content: userMention(foundPlant.user), embeds: [embed]})

                        PlantDB.deleteOne({name: foundPlant.name}).exec();
                    } else
                    {
                        await foundPlant.save();

                        let embed = new EmbedBuilder()
                        .setTitle(foundPlant.name)
                        .setDescription("Time till finished decreased by 2!")
                        .addFields(
                            {
                            name: 'Amount:',
                            value: `${foundPlant.time} Weeks Left`
                            }
                        )
            
                        interaction.channel?.send({content: userMention(foundPlant.user), embeds: [embed]})
                    }

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                    
                }
                break;
            case "item":
                // Get the item from the Database
                const foundItem = await ItemDB.findOne({name: name})
                if (!foundItem) return;
                if (interaction.customId.split('-')[1] == '1week') // Increase time by 1 week
                {
                    foundItem.time -= 1; // Reduce building time

                    if (foundItem.time <= 0) // Building is done!
                    {
                        let embed = new EmbedBuilder() // Create and embed to show the update to the user
                        .setTitle(foundItem.name)
                        .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now complete!`)

                        interaction.channel?.send({content: userMention(foundItem.user), embeds: [embed]})

                        ItemDB.deleteOne({name: foundItem.name}).exec();

                    } else
                    {
                        await foundItem.save();

                        let embed = new EmbedBuilder()
                        .setTitle(foundItem.name)
                        .setDescription("Time till finished decreased by 1!")
                        .addFields(
                            {
                            name: 'Amount:',
                            value: `${foundItem.time} Weeks Left`
                            }
                        )
            
                        interaction.channel?.send({content: userMention(foundItem.user), embeds: [embed]})
                    }

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                }
                if (interaction.customId.split('-')[1] == '2week') // Increase time by 2 weeks
                {
                    foundItem.time -= 2;

                    if (foundItem.time <= 0) // Building is done!
                    {
                        let embed = new EmbedBuilder()
                        .setTitle(foundItem.name)
                        .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now compelte!`)

                        interaction.channel?.send({content: userMention(foundItem.user), embeds: [embed]})

                        ItemDB.deleteOne({name: foundItem.name}).exec();
                    } else
                    {
                        await foundItem.save();

                        let embed = new EmbedBuilder()
                        .setTitle(foundItem.name)
                        .setDescription("Time till finished decreased by 2!")
                        .addFields(
                            {
                            name: 'Amount:',
                            value: `${foundItem.time} Weeks Left`
                            }
                        )
            
                        interaction.channel?.send({content: userMention(foundItem.user), embeds: [embed]})
                    }

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                    
                }
                if (interaction.customId.split('-')[1] == 'finishitem') // Finish Building
                {
                    let embed = new EmbedBuilder()
                    .setTitle(foundItem.name)
                    .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now complete!`)

                    interaction.channel?.send({content: userMention(foundItem.user), embeds: [embed]})

                    ItemDB.deleteOne({name: foundItem.name}).exec();

                    interaction.reply({content: `${name} Updated`})
                    interaction.deleteReply();
                }

                break;
        }


        


        interaction.message.delete();

    }
})