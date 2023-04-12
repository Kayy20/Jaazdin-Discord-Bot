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
            PlantDB.deleteOne({name: doc.name}).exec();
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

let buildingName = "";
let plantTime = 0;
let plantUser = "";

client.on('interactionCreate', async (interaction: Interaction): Promise<void> => {

    if (interaction.isSelectMenu()) {
        if (!interaction.customId.endsWith(interaction.user.id)){
            interaction.reply({
                content: "Touch that again and you'll get fed to the basement tree.",
                ephemeral: true
            });
            return;
        }
        let thing = interaction.values[0].split('-');
        if (thing[1]) {
            buildingName = thing[0];
            plantTime = parseInt(thing[1]);
            plantUser = thing[2];
        }
        else {
            buildingName = interaction.values[0];
        }
        interaction.reply({content: `${buildingName} Selected`})
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

        const foundBuilding = await BuildingDB.findOne({ name: buildingName});
        const foundPlant = await PlantDB.findOne({name: buildingName, time: plantTime, user: plantUser})
        const foundItem = await ItemDB.findOne({name: buildingName})
        if (plantTime != 0){
            if (!foundPlant) return;

            if (interaction.customId.split('-')[0] == '1week') // Increase time by 1 week
        {
            foundPlant.time -= 1;

            if (foundPlant.time <= 0) // Building is done!
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

            interaction.reply({content: `${buildingName} Updated`})
            interaction.deleteReply();
        }
        if (interaction.customId.split('-')[0] == '2week') // Increase time by 2 weeks
        {
            foundPlant.time -= 2;

            if (foundPlant.time <= 0) // Building is done!
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

            interaction.reply({content: `${buildingName} Updated`})
            interaction.deleteReply();
            
        }

        } else {
            if (!foundBuilding)
            {
                if (!foundItem) return;
                if (interaction.customId.split('-')[0] == '1week') // Increase time by 1 week
            {
                foundItem.time -= 1;

                if (foundItem.time <= 0) // Building is done!
                {
                    let embed = new EmbedBuilder()
                    .setTitle(foundItem.name)
                    .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now finished!`)

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

                interaction.reply({content: `${buildingName} Updated`})
                interaction.deleteReply();
            }
            if (interaction.customId.split('-')[0] == '2week') // Increase time by 2 weeks
            {
                foundItem.time -= 2;

                if (foundItem.time <= 0) // Building is done!
                {
                    let embed = new EmbedBuilder()
                    .setTitle(foundItem.name)
                    .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now finished!`)

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

                interaction.reply({content: `${buildingName} Updated`})
                interaction.deleteReply();
                
            }
            if (interaction.customId.split('-')[0] == 'finishitem') // Finish Building
            {
                let embed = new EmbedBuilder()
                .setTitle(foundItem.name)
                .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now finished!`)

                interaction.channel?.send({content: userMention(foundItem.user), embeds: [embed]})

                BuildingDB.deleteOne({name: foundItem.name}).exec();

                interaction.reply({content: `${buildingName} Updated`})
                interaction.deleteReply();
            }
            } else {
                if (interaction.customId.split('-')[0] == '1week') // Increase time by 1 week
            {
                foundBuilding.time -= 1;

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
                    .setDescription("Time till finished decreased by 1!")
                    .addFields(
                        {
                        name: 'Amount:',
                        value: `${foundBuilding.time} Weeks Left`
                        }
                    )
        
                    interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})
                }

                interaction.reply({content: `${buildingName} Updated`})
                interaction.deleteReply();
            }
            if (interaction.customId.split('-')[0] == '2week') // Increase time by 2 weeks
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

                interaction.reply({content: `${buildingName} Updated`})
                interaction.deleteReply();
                
            }
            if (interaction.customId.split('-')[0] == 'finishbuilding') // Finish Building
            {
                let embed = new EmbedBuilder()
                .setTitle(foundBuilding.name)
                .setDescription(`${userMention(foundBuilding.user)}, ${foundBuilding.name} is now Tier: ${foundBuilding.tier}!`)

                interaction.channel?.send({content: userMention(foundBuilding.user), embeds: [embed]})

                BuildingDB.deleteOne({name: foundBuilding.name}).exec();

                interaction.reply({content: `${buildingName} Updated`})
                interaction.deleteReply();
            } 
            }

            
        }

        interaction.message.delete();
        buildingName = "";
        plantTime = 0;
        plantUser = "";

    }
})