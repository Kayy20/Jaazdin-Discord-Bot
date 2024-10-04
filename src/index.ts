import { Client, GatewayIntentBits, Collection, Interaction, userMention, EmbedBuilder, TextChannel, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, Message, ButtonBuilder, ButtonStyle } from "discord.js";
const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits
const client = new Client({ intents: [Guilds, MessageContent, GuildMessages, GuildMembers] })
import { Command, SlashCommand } from "./types";
import { config } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { CronJob } from "cron";
import mongoose from "mongoose";
import BuildingDB from "./schemas/Building";
import ChannelDB from "./schemas/Channel";
import PlantDB from "./schemas/Plant";
import ItemDB from "./schemas/Item";
import BirthdayDB from "./schemas/Birthday";
import { isString } from "util";
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
        function () { SendUpdate() },
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
    let buildingsFinishedList = new Array();
    let updatedBuildings = "";
    // update each building
    for await (const doc of BuildingDB.find()) {
        doc.time -= 1;
        if (doc.time == 0) {
            let pushed = false;
            for (let s of buildingsFinishedList) {
                if (s.includes(userMention(doc.user))) {
                    let str = s;
                    str += `${doc.name}\n`;
                    buildingsFinishedList.splice(buildingsFinishedList.indexOf(s), 1, str);
                    //console.log(buildingsFinishedList);
                    pushed = true;
                }
            }
            if (!pushed) {
                buildingsFinishedList.push(`${userMention(doc.user)}:\n${doc.name} to Tier: ${doc.tier}\n`);
            }
            //BuildingDB.deleteOne({ name: doc.name }).exec();
        }
        else {
            updatedBuildings += `${doc.name} \t Tier: ${doc.tier} \t Weeks Left: ${doc.time}\n`;
            //await doc.save();
        }
    }

    let finishedBuildings = "";
    for (let s of buildingsFinishedList) {
        finishedBuildings += s;
    }

    let plantsFinishedList = [];
    let updatedPlants = "";
    let readdedPlants = "";
    // update each plant
    for await (const doc of PlantDB.find()) {
        doc.time -= 1;
        if (doc.time == 0) {
            let pushed = false;
            for (let s of plantsFinishedList) {
                if (s.includes(userMention(doc.user))) {
                    let str = s;
                    str += `${doc.name}\n`;
                    plantsFinishedList.splice(plantsFinishedList.indexOf(s), 1, str);
                    //console.log(plantsFinishedList);
                    pushed = true;
                }
            }
            if (!pushed) {
                plantsFinishedList.push(`${userMention(doc.user)}:\n${doc.name}\n`);
            }
            if (doc.repeatable) {
                if (doc.repeatTime)
                    doc.time = doc.repeatTime;
                readdedPlants += `${doc.name} \t Weeks Left: ${doc.time}\n`;
                //await doc.save();
            }
            //else PlantDB.deleteOne({ name: doc.name }).exec();
        }
        else {
            updatedPlants += `${doc.name} \t Weeks Left: ${doc.time}\n`;
            //await doc.save();
        }
    }

    let finishedPlants = "";
    for (let s of plantsFinishedList) {
        finishedPlants += s;
    }

    let itemsFinishedList = new Array();
    let updatedItems = "";
    // update each item
    for await (const doc of ItemDB.find()) {
        doc.time -= 1;
        if (doc.time == 0) {
            let pushed = false;
            for (let s of itemsFinishedList) {
                if (s.includes(userMention(doc.user))) {
                    let str = s;
                    str += `${doc.name}\n`;
                    itemsFinishedList.splice(itemsFinishedList.indexOf(s), 1, str);
                    //console.log(itemsFinishedList);
                    pushed = true;
                }
            }
            if (!pushed) {
                itemsFinishedList.push(`${userMention(doc.user)}:\n${doc.name}\n`);
            }
            //ItemDB.deleteOne({ name: doc.name }).exec();
        }
        else {
            updatedItems += `${doc.name} \t Weeks Left: ${doc.time}\n`;
            //await doc.save();
        }
    }


    let finishedItems = "";
    for (let s of itemsFinishedList) {
        finishedItems += s;
    }

    // Find the days of the week and apply them to the birthdays here //

    // Find Channel
    const channel = await client.channels.cache.get(foundBuilding.channel.toString());

    // Create embed with information
    let embed = new EmbedBuilder()
        .setColor('Gold')
        .setTitle("Weekly Downtime Reset")
        .setTimestamp();

    if (channel instanceof TextChannel)
        channel.send({ embeds: [embed] });

    // Buildings

    embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle("Finished Buildings")
    // .addFields(
    //     {
    //         name: "Buildings",
    //         value: finishedBuildings == "" ? "None" : finishedBuildings
    //     },
    //     {
    //         name: "Plants",
    //         value: finishedPlants == "" ? "None" : finishedPlants
    //     },
    //     {
    //         name: "Readded Plants",
    //         value: readdedPlants == "" ? "None" : readdedPlants
    //     },
    //     {
    //         name: "Items",
    //         value: finishedItems == "" ? "None" : finishedItems
    //     },
    // )
    // .setTimestamp();

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: finishedBuildings });
    }

    // Plants
    embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle("Finished Plants")

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: finishedPlants });
    }


    // Readded Plants
    embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle("Readded Plants")

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: readdedPlants });
    }

    // Items
    embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle("Finished Items")

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: finishedItems });
    }

    // In Progress
    embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle("In Progress")
    // .setFields(
    // {
    //     name: "Buildings",
    //     value: updatedBuildings == "" ? "None" : updatedBuildings
    // },
    // {
    //     name: "Plants",
    //     value: updatedPlants == "" ? "None" : updatedPlants
    // },
    // {
    //     name: "Items",
    //     value: updatedItems == "" ? "None" : updatedItems
    // },
    // )

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] });
        // channel.send({content: "/showbuildings"});
        // channel.send({content: "/showplants"});
        // channel.send({content: "/showitems"});
    }




    // Buildings
    embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle("Buildings")

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: updatedBuildings });
    }

    // Plants
    embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle("Plants")

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: updatedPlants });
    }

    // Items
    embed = new EmbedBuilder()
        .setColor('DarkRed')
        .setTitle("Items")

    if (channel instanceof TextChannel) {
        channel.send({ embeds: [embed] })
        channel.send({ content: updatedItems });
    }

    await new Promise(r => setTimeout(r, 5000));

    // Ship stuff
    var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
    var req = new XMLHttpRequest();
    req.open("GET", "http://jaazdinapi.mygamesonline.org/Commands/UpdateDocks.php", true);
    req.onload = function () {
        //console.log("Connected! --> " + this.responseText);
        let s = JSON.parse(this.responseText);

        let notTown = s.boatsNotInTown; // Array of information of boats not in town
        // {"boatsNotInTown":[{"boatName":"test","weeksLeft":"1"}]}
        let inTown = s.boatsInTown; // Array of information of boats in Town


        const embeds = new Array();
        console.log(Math.ceil(inTown.length / 4));
        if (inTown.length > 0) {
            for (let i = 0; i < Math.ceil(inTown.length / 4); i++) {

                let embed1 = new EmbedBuilder()
                    .setColor('Aqua')
                    .setTitle(i == 0 ? "Boat Information" : "Boat Information Continued...")
                    .setTimestamp();

                for (let j = 0; j < 4; j++) {
                    if (i * 4 + j >= inTown.length) break;
                    let m = inTown[i * 4 + j].jobs.split(' ');
                    let str = "";
                    for (const a of m) {
                        str += a + ", ";
                    }
                    str = str.slice(0, -2);

                    str += " have their gp wage die amount +1.";

                    console.log("Name: " + inTown[i * 4 + j].boatName + ", Weeks: " + inTown[i * 4 + j].weeksLeft + ", T2 Ability: " + inTown[i * 4 + j].tier2Ability + ", shipment Length: " + inTown[i * 4 + j].shipment.length + ", Jobs: " + inTown[i * 4 + j].jobs + " ");
                    console.log(inTown[i * 4 + j].shipment);


                    embed1.addFields({ name: inTown[i * 4 + j].boatName + " (Time till Departure: " + inTown[i * 4 + j].weeksLeft + " weeks)", value: str })

                    if (inTown[i * 4 + j].tier2Ability != "") {
                        embed1.addFields({ name: "Additional Feature!", value: inTown[i * 4 + j].tier2Ability });
                    }
                    if (inTown[i * 4 + j].shipment.length > 0) {
                        embed1.addFields({ name: "Goods", value: " " });

                        const targetLength = Math.ceil(inTown[i * 4 + j].shipment.length / 3);

                        // Need to change this depending on how many items are in the shipment

                        let firstArray = inTown[i * 4 + j].shipment.slice(0, targetLength);
                        let secondArray = inTown[i * 4 + j].shipment.slice(targetLength, targetLength * 2 - 1);
                        let thirdArray = inTown[i * 4 + j].shipment.slice(targetLength * 2 - 1);

                        switch (inTown[i * 4 + j].shipment.length) {
                            case 1:
                                firstArray = inTown[i * 4 + j].shipment.slice(0, 1);
                                secondArray = [];
                                thirdArray = [];
                                break;
                            case 2:
                                firstArray = inTown[i * 4 + j].shipment.slice(0, 1);
                                secondArray = inTown[i * 4 + j].shipment.slice(1, 2);
                                thirdArray = [];
                                break;
                            case 3:
                                firstArray = inTown[i * 4 + j].shipment.slice(0, 1);
                                secondArray = inTown[i * 4 + j].shipment.slice(1, 2);
                                thirdArray = inTown[i * 4 + j].shipment.slice(2, 3);
                                break;
                        }

                        // First Array
                        let mess = "";
                        for (const j of firstArray)
                            mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
                        if (mess != "")
                            embed1.addFields({ name: " ", value: mess, inline: true })
                        // Second Array
                        mess = "";
                        for (const j of secondArray)
                            mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
                        if (mess != "")
                            embed1.addFields({ name: " ", value: mess, inline: true })
                        // Third Array
                        mess = "";
                        for (const j of thirdArray)
                            mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
                        if (mess != "")
                            embed1.addFields({ name: " ", value: mess, inline: true })
                    }
                }
                embeds.push(embed1);
                console.log("Pushed " + embed1);
            }
        } else {
            let embed1 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Boat Information")
                .setTimestamp()
                .setDescription("No Boats in Town!")
            embeds.push(embed1);
        }



        if (notTown.length > 0) {
            let mess = ""
            let mess1 = ""
            for (const k of notTown) {
                mess += k.boatName + "\n";
                mess1 += k.weeksLeft + "\n"
            }
            let embed2 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Sea Information")
                .setTimestamp()
                .addFields({ name: "Boats at Sea", value: mess, inline: true })
                .addFields({ name: "Time till arrival", value: mess1, inline: true })
            embeds.push(embed2);
        } else {
            let embed2 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Sea Information")
                .setTimestamp()
                .setDescription("No Boats at Sea!")
            embeds.push(embed2);
        }

        if (channel instanceof TextChannel)
            channel.send({ embeds: embeds });
        }

    req.send();

}

let name = ""; // used for all types
let time = 0; // only used for plants/birthday
let user = ""; // only used for plants

client.on('interactionCreate', async (interaction: Interaction): Promise<void> => {

    if (interaction.isStringSelectMenu()) {
        if (!interaction.customId.endsWith(interaction.user.id)) {
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
        } catch (e) {// No time... meaning not a plant kek
        }

        interaction.reply({ content: `${name} Selected` });
        interaction.deleteReply();

        const mess = await interaction.channel?.messages.fetch(interaction.message.id);
        const comp = mess?.components;
        const firstRow = [];
        let men = new ActionRowBuilder<StringSelectMenuBuilder>()

        if (comp)
            if (comp.length > 2) {

                for (let i = 0; i < comp.length - 1; i++) {
                    men = new ActionRowBuilder<StringSelectMenuBuilder>()

                    let newComp = new StringSelectMenuBuilder();
                    let cd = comp[i].components[0];
                    console.log(cd.data)
                    console.log(cd.type)
                    if (cd.type == 3) {
                        if (comp[i].components[0].customId != interaction.customId) {
                            newComp.setCustomId(i + "-" + interaction.customId.split('-')[1])// comp[i].components[0].customId : '0')
                                .setPlaceholder(i > 0 ? "No Selection Continued..." : "No Selection")
                            for (const opt of cd.options) {
                                newComp.addOptions({
                                    label: opt.label,
                                    value: opt.value,
                                    default: false
                                })
                            }
                        } else {
                            newComp.setCustomId(i + "-" + interaction.customId.split('-')[1])
                            for (const opt of cd.options) {
                                if (opt.value.split('-')[0] == name) {
                                    newComp.addOptions({
                                        label: opt.label,
                                        value: opt.value,
                                        default: true
                                    })
                                } else {
                                    newComp.addOptions({
                                        label: opt.label,
                                        value: opt.value,
                                        default: false
                                    })
                                }
                            }
                        }
                        men.addComponents(newComp);
                        firstRow.push(men);
                    }
                }
                const secRow = new ActionRowBuilder<ButtonBuilder>()
                if (comp)
                    for (const c of comp[comp.length - 1].components) {
                        if (c.data.type == 2)
                            secRow.addComponents(new ButtonBuilder()
                                .setCustomId(c.customId ? c.customId : '0')
                                .setLabel(c.data.label ? c.data.label : '0')
                                .setStyle(ButtonStyle.Primary)
                            )
                    }
                //secRow.addComponents(comp[comp.length - 1])
                //  if (comp)
                //  console.log(comp[comp.length - 1].components[0].type)
                //console.log("First Row: " + firstRow.length);
                interaction.message.edit({ components: [...firstRow, secRow] })
            }



    }

    if (interaction.isButton()) {

        if (!interaction.customId.endsWith(interaction.user.id)) {
            interaction.reply({
                content: "Touch that again and you'll get fed to the basement tree.",
                ephemeral: true
            });
            return;
        }


        // set up the drop down menu
        switch (interaction.customId.split('-')[0]) {
            case "building":
                // Get the building from the Database
                const foundBuilding = await BuildingDB.findOne({ name: name });
                if (!foundBuilding) return; // Just to say if there is no found building

                if (interaction.customId.split('-')[1] == '1week') // Increase time by 1 week
                {
                    foundBuilding.time -= 1; // Reduce building time

                    if (foundBuilding.time <= 0) // Building is done!
                    {
                        let embed = new EmbedBuilder() // Create and embed to show the update to the user
                            .setTitle(foundBuilding.name)
                            .setDescription(`${userMention(foundBuilding.user)}, ${foundBuilding.name} is now Tier: ${foundBuilding.tier}!`)

                        interaction.channel?.send({ content: userMention(foundBuilding.user), embeds: [embed] })

                        BuildingDB.deleteOne({ name: foundBuilding.name }).exec();

                    } else {
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

                        interaction.channel?.send({ content: userMention(foundBuilding.user), embeds: [embed] })
                    }

                    interaction.reply({ content: `${name} Updated` })
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

                        interaction.channel?.send({ content: userMention(foundBuilding.user), embeds: [embed] })

                        BuildingDB.deleteOne({ name: foundBuilding.name }).exec();
                    } else {
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

                        interaction.channel?.send({ content: userMention(foundBuilding.user), embeds: [embed] })
                    }

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();

                }
                if (interaction.customId.split('-')[1] == 'finishbuilding') // Finish Building
                {
                    let embed = new EmbedBuilder()
                        .setTitle(foundBuilding.name)
                        .setDescription(`${userMention(foundBuilding.user)}, ${foundBuilding.name} is now Tier: ${foundBuilding.tier}!`)

                    interaction.channel?.send({ content: userMention(foundBuilding.user), embeds: [embed] })

                    BuildingDB.deleteOne({ name: foundBuilding.name }).exec();

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();
                }

                break;
            case "plant":
                // Get the plant from the Database
                const foundPlant = await PlantDB.findOne({ name: name, time: time, user: user });
                if (!foundPlant) return; // Just to say if there is no found building

                if (interaction.customId.split('-')[1] == '1week') // Increase time by 1 week
                {
                    foundPlant.time -= 1;

                    if (foundPlant.time <= 0) // Plant is done!
                    {
                        if (foundPlant.repeatable && foundPlant.repeatTime) {
                            foundPlant.time = foundPlant.repeatTime;

                            await foundPlant.save();

                            let embed = new EmbedBuilder()
                                .setTitle(foundPlant.name)
                                .setDescription(`${userMention(foundPlant.user)}, fresh harvest of ${foundPlant.name} as well as being replanted!`)

                            interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })

                        } else {
                            let embed = new EmbedBuilder()
                                .setTitle(foundPlant.name)
                                .setDescription(`${userMention(foundPlant.user)}, fresh harvest of ${foundPlant.name}!`)

                            interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })



                            PlantDB.deleteOne({ name: foundPlant.name }).exec();
                        }

                    } else {
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

                        interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })
                    }

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();
                }
                if (interaction.customId.split('-')[1] == '2week') // Increase time by 2 weeks
                {
                    foundPlant.time -= 2;

                    if (foundPlant.time <= 0) // Plant is done!
                    {

                        if (foundPlant.repeatable && foundPlant.repeatTime) {
                            foundPlant.time = foundPlant.repeatTime;

                            await foundPlant.save();

                            let embed = new EmbedBuilder()
                                .setTitle(foundPlant.name)
                                .setDescription(`${userMention(foundPlant.user)}, fresh harvest of ${foundPlant.name} as well as being replanted!`)

                            interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })

                        } else {
                            let embed = new EmbedBuilder()
                                .setTitle(foundPlant.name)
                                .setDescription(`${userMention(foundPlant.user)}, fresh harvest of ${foundPlant.name}!`)

                            interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })



                            PlantDB.deleteOne({ name: foundPlant.name }).exec();
                        }


                    } else {
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

                        interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })
                    }

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();

                }
                if (interaction.customId.split('-')[1] == 'stoprep') {
                    foundPlant.repeatable = false;
                    let embed = new EmbedBuilder()
                        .setTitle(foundPlant.name)
                        .setDescription("You are no longer repeating this plant on weekly resets!");

                    await foundPlant.save();

                    interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })
                }
                if (interaction.customId.split('-')[1] == 'startrep') {
                    foundPlant.repeatable = true;
                    let embed = new EmbedBuilder()
                        .setTitle(foundPlant.name)
                        .setDescription("You are now repeating this plant on weekly resets!");

                    await foundPlant.save();

                    interaction.channel?.send({ content: userMention(foundPlant.user), embeds: [embed] })
                }
                break;
            case "item":
                // Get the item from the Database
                const foundItem = await ItemDB.findOne({ name: name })
                if (!foundItem) return;
                if (interaction.customId.split('-')[1] == '1week') // Increase time by 1 week
                {
                    foundItem.time -= 1; // Reduce building time

                    if (foundItem.time <= 0) // Building is done!
                    {
                        let embed = new EmbedBuilder() // Create and embed to show the update to the user
                            .setTitle(foundItem.name)
                            .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now complete!`)

                        interaction.channel?.send({ content: userMention(foundItem.user), embeds: [embed] })

                        ItemDB.deleteOne({ name: foundItem.name }).exec();

                    } else {
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

                        interaction.channel?.send({ content: userMention(foundItem.user), embeds: [embed] })
                    }

                    interaction.reply({ content: `${name} Updated` })
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

                        interaction.channel?.send({ content: userMention(foundItem.user), embeds: [embed] })

                        ItemDB.deleteOne({ name: foundItem.name }).exec();
                    } else {
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

                        interaction.channel?.send({ content: userMention(foundItem.user), embeds: [embed] })
                    }

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();

                }
                if (interaction.customId.split('-')[1] == 'finishitem') // Finish Building
                {
                    let embed = new EmbedBuilder()
                        .setTitle(foundItem.name)
                        .setDescription(`${userMention(foundItem.user)}, ${foundItem.name} is now complete!`)

                    interaction.channel?.send({ content: userMention(foundItem.user), embeds: [embed] })

                    ItemDB.deleteOne({ name: foundItem.name }).exec();

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();
                }

                break;
            case "birthday":
                // Get the item from the Database
                const foundDate = await BirthdayDB.findOne({ name: name })
                if (!foundDate) return;
                if (interaction.customId.split('-')[1] == 'date') // Get user input to change the date
                {

                    const modal = new ModalBuilder()
                        .setTitle(`Update ${foundDate.name}'s Birthdate!`)
                        .setCustomId(`birthdate-${foundDate.name}-${interaction.user.id}`)

                    const newDate = new TextInputBuilder()
                        .setLabel("Input New Birthdate")
                        .setCustomId('newDate')
                        .setMaxLength(5).setMinLength(5)
                        .setRequired(true)
                        .setPlaceholder("Input Birthdate Format: MM/DD")
                        .setStyle(TextInputStyle.Short)

                    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(newDate);

                    modal.addComponents(firstRow)

                    console.log("Sending Modal");

                    await interaction.showModal(modal);

                }
                if (interaction.customId.split('-')[1] == 'age') // Change Age
                {
                    const modal = new ModalBuilder()
                        .setTitle(`Update ${foundDate.name}'s Birthdate!`)
                        .setCustomId(`age-${foundDate.name}-${interaction.user.id}`)

                    const newDate = new TextInputBuilder()
                        .setLabel("Input New Age")
                        .setCustomId('newAge')
                        .setMaxLength(4).setMinLength(1)
                        .setRequired(true)
                        .setPlaceholder("Input Age (Integer)")
                        .setStyle(TextInputStyle.Short)

                    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(newDate);

                    modal.addComponents(firstRow)
                    await interaction.showModal(modal);

                }
                if (interaction.customId.split('-')[1] == 'delete') // Finish Building
                {
                    let embed = new EmbedBuilder()
                        .setTitle(foundDate.name)
                        .setDescription(`${userMention(foundDate.user)}, ${foundDate.name} is now birthday-less!`)

                    interaction.channel?.send({ content: userMention(foundDate.user), embeds: [embed] })

                    BirthdayDB.deleteOne({ name: foundDate.name }).exec();

                    interaction.reply({ content: `${name} Updated` })
                    interaction.deleteReply();
                }

                break;
            case "job":
                if (interaction.customId.split('-')[1] == 'cancel') {
                    // Delete Reply
                }
                else if (interaction.customId.split('-')[1] == 'continue') {

                    const modal = new ModalBuilder()
                        .setCustomId('job-' + name)
                        .setTitle('Job Roll for ' + name + '!')

                    const tier = new TextInputBuilder()
                        .setMaxLength(1)
                        .setMinLength(1)
                        .setPlaceholder("1")
                        .setCustomId('tier')
                        .setLabel("Tier (Must be between 3 and 7)")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)

                    const roll = new TextInputBuilder()
                        .setMaxLength(3)
                        .setMinLength(1)
                        .setPlaceholder("0")
                        .setCustomId('roll')
                        .setLabel("What did you roll?")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)

                    const ar1 = new ActionRowBuilder<TextInputBuilder>().addComponents(tier);
                    const ar2 = new ActionRowBuilder<TextInputBuilder>().addComponents(roll);

                    modal.addComponents(ar1, ar2);

                    await interaction.showModal(modal);
                }

                break;
        }
        interaction.message.delete();


    }

    if (interaction.isModalSubmit()) {

        switch (interaction.customId.split('-')[0]) {
            case "birthdate":
                const foundDate = await BirthdayDB.findOne({ name: interaction.customId.split('-')[1] })
                if (!foundDate) return;

                const info = interaction.fields.getTextInputValue('newDate')

                let month = foundDate.date.getMonth();
                let day = foundDate.date.getDate();

                try {
                    month = parseInt(info.split('/')[0])
                    day = parseInt(info.split('/')[1])
                    console.log("Month: " + month + ", Day: " + day)
                    if (month < 1 || month > 12 || day < 1)
                        interaction.reply("Invalid Input, try using numbers that are valid! \n Months are 1-12, Days are 1-31 (depending on the month)")
                    if (month < 8) {
                        if (day > (month % 2 == 0 ? month == 2 ? 28 : 30 : 31))
                            interaction.reply("Invalid Input, try using numbers that are valid! \n Months are 1-12, Days are 1-31 (depending on the month)")
                    } else {
                        if (day > (month % 2 == 0 ? 31 : 30))
                            interaction.reply("Invalid Input, try using numbers that are valid! \n Months are 1-12, Days are 1-31 (depending on the month)")
                    }

                } catch (e) {
                    // Something went wrong, get them to start over!
                    interaction.reply("Invalid Input, try using numbers that are valid! \n Months are 1-12, Days are 1-31 (depending on the month)")
                }

                foundDate.date.setFullYear(2000);
                foundDate.date.setMonth(month - 1);
                foundDate.date.setDate(day);

                console.log(foundDate.date);

                await foundDate.save();
                //await BirthdayDB.replaceOne()

                let embed = new EmbedBuilder()
                    .setTitle(`${foundDate.name}'s New Birthday!`)
                    .setColor('Blurple')
                    .setDescription(`New Birthday:  ${foundDate.date.getMonth() + 1 < 10 ? "0" + (foundDate.date.getMonth() + 1) : foundDate.date.getMonth() + 1}/${foundDate.date.getDate() < 10 ? "0" + foundDate.date.getDate() : foundDate.date.getDate()}`)


                interaction.reply({ content: userMention(foundDate.user), embeds: [embed] });
                break;
            case "age":
                const foundAge = await BirthdayDB.findOne({ name: interaction.customId.split('-')[1] })
                if (!foundAge) return;

                const info1 = interaction.fields.getTextInputValue('newAge')

                let age = foundAge.age;

                try {
                    age = parseInt(info1)

                    if (age < 1 || !age)
                        throw new Error("Age not valid");

                } catch (e) {
                    // Something went wrong, get them to start over!
                    interaction.reply("Invalid Input, try using numbers that are valid! \n Age needs to be greater than 0!")
                }

                foundAge.age = age;

                await foundAge.save();

                let embed1 = new EmbedBuilder()
                    .setTitle(`${foundAge.name}'s New Age!`)
                    .setColor('Blurple')
                    .setDescription(`New Age:  ${foundAge.age}`)

                interaction.reply({ content: userMention(foundAge.user), embeds: [embed1] });
                break;
            case "job":
                const tier = interaction.fields.getTextInputValue('tier');
                const roll = interaction.fields.getTextInputValue('roll');

                try {
                    let q = parseInt(tier)

                    if (q > 7 || !q || q < 3) {

                        interaction.reply({ content: "Invalid Input, try using numbers that are valid! \nTier needs to be between 3 and 7", ephemeral: true })
                        return;
                    }

                } catch (e) {
                    // Something went wrong, get them to start over!
                    interaction.reply({ content: "Invalid Input, try using numbers that are valid! \nRoll needs to be between 1 and 100!", ephemeral: true })
                }

                try {
                    let w = parseInt(roll)

                    if (w > 100 || !w || w < 1) {
                        interaction.reply({ content: "Invalid Input, try using numbers that are valid! \nRoll needs to be between 1 and 100!", ephemeral: true })
                        return;
                    }

                } catch (e) {
                    // Something went wrong, get them to start over!
                    interaction.reply({ content: "Invalid Input, try using numbers that are valid! \nRoll needs to be between 1 and 100!", ephemeral: true })
                }

                let link = "?roll=" + roll + "&tier=" + tier + "&job=" + interaction.customId.split('-')[1].split(' ').join('-');

                var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
                var req = new XMLHttpRequest();
                req.open("GET", "http://jaazdinapi.mygamesonline.org/Commands/ProfessionRoll.php" + link, true);
                req.onload = function () {
                    //console.log("Connected! --> " + this.responseText);
                    let s = JSON.parse(this.responseText);

                    const emb = new EmbedBuilder()
                        .setTitle("Rewards")
                        .setColor("Random")
                        .addFields(
                            {
                                name: " ",
                                value: s.message
                            }
                        )
                    interaction.reply({ content: userMention(interaction.user.id), embeds: [emb] })
                }

                req.send();
                break;
        }


    }
})