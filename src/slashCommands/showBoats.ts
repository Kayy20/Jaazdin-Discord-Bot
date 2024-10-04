import { EmbedBuilder, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";
import { isObjectIdOrHexString } from "mongoose";


const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("showboats")
    .setDescription("Show's the status of all boats")
    ,
    execute: async (interaction) => {
        // Put all this information into the db
        try {
            // Construct the information
            await interaction.deferReply({});

            // Ship stuff
            var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest
            var req = new XMLHttpRequest();

            let replied = false;

            req.open("GET", "http://jaazdinapi.mygamesonline.org/Commands/ShowBoats.php", true);
            req.onload = function(){
                console.log("Connected! --> " + this.responseText);
                let s = JSON.parse(this.responseText);

                //console.log(s);
                
                let notTown = s.boatsNotInTown; // Array of information of boats not in town
                // {"boatsNotInTown":[{"boatName":"test","weeksLeft":"1"}]}
                let inTown = s.boatsInTown; // Array of information of boats in Town

                const embeds = [];
                console.log(Math.ceil(inTown.length/4));
                if (inTown.length > 0){
                    for (let i = 0; i < Math.ceil(inTown.length / 4); i++){

                    let embed1 = new EmbedBuilder()
                    .setColor('Aqua')
                    .setTitle(i == 0? "Boat Information" : "Boat Information Continued...")
                    .setTimestamp();
                
                    for (let j = 0; j < 4; j++){
                        if (i*4 + j >= inTown.length) break;
                        let m = inTown[i*4 + j].jobs.split(' ');
                        let str = "";
                        for (const a of m){
                            str += a + ", ";
                        }
                        str = str.slice(0, -2);

                        str += " have their gp wage die amount +1.";

                        console.log("Name: " + inTown[i*4 + j].boatName + ", Weeks: " + inTown[i*4 + j].weeksLeft + ", T2 Ability: " + inTown[i*4 + j].tier2Ability + ", shipment Length: " + inTown[i*4 + j].shipment.length + ", Jobs: " + inTown[i*4 + j].jobs + " ");
                        console.log(inTown[i*4 + j].shipment);


                        embed1.addFields({name: inTown[i*4 + j].boatName + " (Time till Departure: " + inTown[i*4 + j].weeksLeft + " weeks)", value: str})

                        if (inTown[i*4 + j].tier2Ability != ""){
                            embed1.addFields({name: "Additional Feature!", value: inTown[i*4 + j].tier2Ability});
                        }
                        if (inTown[i*4 + j].shipment.length > 0)
                        {
                            embed1.addFields({name: "Goods", value: " "});

                            const targetLength = Math.ceil(inTown[i*4 + j].shipment.length / 3);

                            // Need to change this depending on how many items are in the shipment

                            let firstArray = inTown[i*4 + j].shipment.slice(0, targetLength);
                            let secondArray = inTown[i*4 + j].shipment.slice(targetLength, targetLength * 2 - 1);
                            let thirdArray = inTown[i*4 + j].shipment.slice(targetLength * 2 - 1);

                            switch (inTown[i*4 + j].shipment.length) {
                                case 1:
                                    firstArray = inTown[i*4 + j].shipment.slice(0, 1);
                                    secondArray = [];
                                    thirdArray = [];
                                    break;
                                case 2:
                                    firstArray = inTown[i*4 + j].shipment.slice(0, 1);
                                    secondArray = inTown[i*4 + j].shipment.slice(1, 2);
                                    thirdArray = [];
                                    break;
                                case 3:
                                    firstArray = inTown[i*4 + j].shipment.slice(0, 1);
                                    secondArray = inTown[i*4 + j].shipment.slice(1, 2);
                                    thirdArray = inTown[i*4 + j].shipment.slice(2, 3);
                                    break;
                            }

                            // First Array
                            let mess = "";
                            for (const j of firstArray) 
                                mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
                            if (mess != "")
                                embed1.addFields({name: " ", value: mess, inline: true})
                            // Second Array
                            mess = "";
                            for (const j of secondArray) 
                                mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
                            if (mess != "")
                                embed1.addFields({name: " ", value: mess, inline: true})
                            // Third Array
                            mess = "";
                            for (const j of thirdArray) 
                                mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";
                            if (mess != "")
                                embed1.addFields({name: " ", value: mess, inline: true})
                        }
                    }
                    embeds.push(embed1);
                console.log("Pushed " +embed1);
                }
            } else {
                let embed1 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Boat Information")
                .setTimestamp()
                .addFields({name: "No Boats in Town", value: " "});
                embeds.push(embed1);
            }
            
            

            if (notTown.length > 0){
                let mess = ""
                let mess1 = ""
                for (const k of notTown){
                    mess += k.boatName + "\n";
                    mess1 += k.weeksLeft + "\n"
                }
                let embed2 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Sea Information")
                .setTimestamp()
                .addFields({name: "Boats at Sea", value: mess, inline: true})
                .addFields({name: "Time till arrival", value: mess1, inline: true})
                embeds.push(embed2);
            } else {
                let embed2 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Sea Information")
                .setTimestamp()
                .addFields({name: "No Boats at Sea", value: " "})
                embeds.push(embed2);
            }
                
                
                replied = true;
                interaction.editReply({embeds: embeds});
            }

            req.send();
            if (!replied){
                const embeds = [];
                let embed1 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Boat Information")
                .setTimestamp()
                .addFields({name: "No Boats in Town", value: " "});
                embeds.push(embed1);
                let embed2 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Sea Information")
                .setTimestamp()
                .addFields({name: "No Boats at Sea", value: " "})
                embeds.push(embed2);
                interaction.editReply({embeds: embeds});
            }

        } catch (error) {
            interaction.editReply({content: error.message});
        }

        

    }, cooldown: 10
}

export default command;
