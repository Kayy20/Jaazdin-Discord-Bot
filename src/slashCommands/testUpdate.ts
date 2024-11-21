import { Client, GatewayIntentBits, Collection, Interaction, userMention, EmbedBuilder, TextChannel, SlashCommandBuilder, Embed, InteractionResponse } from "discord.js";
const { Guilds, MessageContent, GuildMessages, GuildMembers } = GatewayIntentBits
const client = new Client({ intents: [Guilds, MessageContent, GuildMessages, GuildMembers] })
import mongoose from "mongoose";
import { SlashCommand } from "../types";
import BuildingDB from "../schemas/Building";
import ChannelDB from "../schemas/Channel";
import PlantDB from "../schemas/Plant";
import ItemDB from "../schemas/Item";

const command: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("testupdate")
        .setDescription("Testing Update!")
    ,
    execute: async (interaction) => {
        
        if (interaction.channel?.id != "1065465368077946912"){
            interaction.reply({content: `There is a time and place for everything, but not now`, ephemeral: true})
            
            return;
        }

        try {
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
            const channel = interaction.channel;

            // Create embed with information
            let embed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle("Weekly Downtime Reset")
                .setTimestamp();

            if (channel instanceof TextChannel)
                channel.send({embeds: [embed] });

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

            if (channel instanceof TextChannel)
                channel.send({ embeds: [embed]})
                channel.send({content: finishedBuildings});

            // Plants
            embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle("Finished Plants")

            if (channel instanceof TextChannel)
                channel.send({ embeds: [embed]})
                channel.send({content: finishedPlants});


            // Readded Plants
            embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle("Readded Plants")

            if (channel instanceof TextChannel)
                channel.send({ embeds: [embed]})
                channel.send({content: readdedPlants});

            // Items
            embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle("Finished Items")

            if (channel instanceof TextChannel)
                channel.send({ embeds: [embed]})
                channel.send({content: finishedItems});

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

            if (channel instanceof TextChannel)
            {
                channel.send({ embeds: [embed] });
                // channel.send({content: "/showbuildings"});
                // channel.send({content: "/showplants"});
                // channel.send({content: "/showitems"});
            }
                
            


            // Buildings
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle("Buildings")

            if (channel instanceof TextChannel)
            {
                channel.send({ embeds: [embed]})
                channel.send({content: updatedBuildings});
            }

            // Plants
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle("Plants")

            if (channel instanceof TextChannel)
                {
                    channel.send({ embeds: [embed]})
                    channel.send({content: updatedPlants});
                }

            // Items
            embed = new EmbedBuilder()
                .setColor('DarkRed')
                .setTitle("Items")

            if (channel instanceof TextChannel)
                {
                    channel.send({ embeds: [embed]})
                    channel.send({content: updatedItems});
                }



            // Ship stuff
            // var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
            // var req = new XMLHttpRequest();
            // req.open("GET", "http://jaazdinapi.mygamesonline.org/Commands/UpdateDocks.php", true);
            // req.onload = function () {
            //     //console.log("Connected! --> " + this.responseText);
            //     let s = JSON.parse(this.responseText);

            //     let notTown = s.boatsNotInTown; // Array of information of boats not in town
            //     // {"boatsNotInTown":[{"boatName":"test","weeksLeft":"1"}]}
            //     let inTown = s.boatsInTown; // Array of information of boats in Town


            //     const embeds = new Array();
            //     console.log(Math.ceil(inTown.length / 4));
            //     if (inTown.length > 0) {
            //         for (let i = 0; i < Math.ceil(inTown.length / 4); i++) {

            //             let embed1 = new EmbedBuilder()
            //                 .setColor('Aqua')
            //                 .setTitle(i == 0 ? "Boat Information" : "Boat Information Continued...")
            //                 .setTimestamp();

            //             for (let j = 0; j < 4; j++) {
            //                 if (i * 4 + j >= inTown.length) break;
            //                 let m = inTown[i * 4 + j].jobs.split(' ');
            //                 let str = "";
            //                 for (const a of m) {
            //                     str += a + ", ";
            //                 }
            //                 str = str.slice(0, -2);

            //                 str += " have their gp wage die amount +1.";

            //                 console.log("Name: " + inTown[i * 4 + j].boatName + ", Weeks: " + inTown[i * 4 + j].weeksLeft + ", T2 Ability: " + inTown[i * 4 + j].tier2Ability + ", shipment Length: " + inTown[i * 4 + j].shipment.length + ", Jobs: " + inTown[i * 4 + j].jobs + " ");
            //                 console.log(inTown[i * 4 + j].shipment);


            //                 embed1.addFields({ name: inTown[i * 4 + j].boatName + " (Time till Departure: " + inTown[i * 4 + j].weeksLeft + " weeks)", value: str })

            //                 if (inTown[i * 4 + j].tier2Ability != "") {
            //                     embed1.addFields({ name: "Additional Feature!", value: inTown[i * 4 + j].tier2Ability });
            //                 }
            //                 if (inTown[i * 4 + j].shipment.length > 0) {
            //                     embed1.addFields({ name: "Goods", value: " " });

            //                     const targetLength = Math.ceil(inTown[i * 4 + j].shipment.length / 3);

            //                     // Need to change this depending on how many items are in the shipment

            //                     let firstArray = inTown[i * 4 + j].shipment.slice(0, targetLength);
            //                     let secondArray = inTown[i * 4 + j].shipment.slice(targetLength, targetLength * 2 - 1);
            //                     let thirdArray = inTown[i * 4 + j].shipment.slice(targetLength * 2 - 1);

            //                     switch (inTown[i * 4 + j].shipment.length) {
            //                         case 1:
            //                             firstArray = inTown[i * 4 + j].shipment.slice(0, 1);
            //                             secondArray = [];
            //                             thirdArray = [];
            //                             break;
            //                         case 2:
            //                             firstArray = inTown[i * 4 + j].shipment.slice(0, 1);
            //                             secondArray = inTown[i * 4 + j].shipment.slice(1, 2);
            //                             thirdArray = [];
            //                             break;
            //                         case 3:
            //                             firstArray = inTown[i * 4 + j].shipment.slice(0, 1);
            //                             secondArray = inTown[i * 4 + j].shipment.slice(1, 2);
            //                             thirdArray = inTown[i * 4 + j].shipment.slice(2, 3);
            //                             break;
            //                     }

            //                     // First Array
            //                     let mess = "";
            //                     for (const j of firstArray)
            //                         mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
            //                     if (mess != "")
            //                         embed1.addFields({ name: " ", value: mess, inline: true })
            //                     // Second Array
            //                     mess = "";
            //                     for (const j of secondArray)
            //                         mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
            //                     if (mess != "")
            //                         embed1.addFields({ name: " ", value: mess, inline: true })
            //                     // Third Array
            //                     mess = "";
            //                     for (const j of thirdArray)
            //                         mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
            //                     if (mess != "")
            //                         embed1.addFields({ name: " ", value: mess, inline: true })
            //                 }
            //             }
            //             embeds.push(embed1);
            //             console.log("Pushed " + embed1);
            //         }
            //     } else {
            //         let embed1 = new EmbedBuilder()
            //             .setColor('Aqua')
            //             .setTitle("Boat Information")
            //             .setTimestamp()
            //             .setDescription("No Boats in Town!")
            //         embeds.push(embed1);
            //     }



            //     if (notTown.length > 0) {
            //         let mess = ""
            //         let mess1 = ""
            //         for (const k of notTown) {
            //             mess += k.boatName + "\n";
            //             mess1 += k.weeksLeft + "\n"
            //         }
            //         let embed2 = new EmbedBuilder()
            //             .setColor('Aqua')
            //             .setTitle("Sea Information")
            //             .setTimestamp()
            //             .addFields({ name: "Boats at Sea", value: mess, inline: true })
            //             .addFields({ name: "Time till arrival", value: mess1, inline: true })
            //         embeds.push(embed2);
            //     } else {
            //         let embed2 = new EmbedBuilder()
            //             .setColor('Aqua')
            //             .setTitle("Sea Information")
            //             .setTimestamp()
            //             .setDescription("No Boats at Sea!")
            //         embeds.push(embed2);
            //     }

            //     if (channel instanceof TextChannel)
            //         channel.send({ embeds: embeds });
            // }

            // req.send();
            
            interaction.reply({ content: "Updated!"});

        } catch (error) {
            interaction.reply({ content: error.message });
        }
    }, cooldown: 10
}

export default command;
