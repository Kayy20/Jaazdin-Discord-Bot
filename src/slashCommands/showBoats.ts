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
            req.open("GET", "http://jaazdinapi.mygamesonline.org/Commands/ShowBoats.php", true);
            req.onload = function(){
                //console.log("Connected! --> " + this.responseText);
                let s = JSON.parse(this.responseText);
                
                let notTown = s.boatsNotInTown; // Array of information of boats not in town
                // {"boatsNotInTown":[{"boatName":"test","weeksLeft":"1"}]}
                let inTown = s.boatsInTown; // Array of information of boats in Town


                const embed1 = new EmbedBuilder()
                .setColor('Aqua')
                .setTitle("Boat Information")
                .setTimestamp();
                if (inTown.length > 0){
                    for (const i of inTown){

                        let m = i.jobs.split(' ');
                        let str = "";
                        for (const a of m){
                            str += a + ", ";
                        }
                        str = str.slice(0, -2);

                        str += " have their gp wage die amount +1.";

                        //console.log("Name: " + i.boatName + ", Weeks: " + i.weeksLeft + ", T2 Ability: " + i.tier2Ability + ", shipment Length: " + i.shipment.length + ", Jobs: " + i.jobs + " ");
                        //console.log(i.shipment);


                        embed1.addFields({name: i.boatName + "(Time till Departure: " + i.weeksLeft + " weeks)", value: str})

                        if (i.tier2Ability != ""){
                            embed1.addFields({name: "Additional Feature!", value: i.tier2Ability});
                        }
                        if (i.shipment.length > 0)
                        {
                            embed1.addFields({name: "Goods", value: " "});

                            const targetLength = Math.ceil(i.shipment.length / 3);

                            // Need to change this depending on how many items are in the shipment

                            let firstArray = i.shipment.slice(0, targetLength);
                            let secondArray = i.shipment.slice(targetLength, targetLength * 2 - 1);
                            let thirdArray = i.shipment.slice(targetLength * 2 - 1);

                            switch (i.shipment.length) {
                                case 1:
                                    firstArray = i.shipment.slice(0, 1);
                                    secondArray = [];
                                    thirdArray = [];
                                    break;
                                case 2:
                                    firstArray = i.shipment.slice(0, 1);
                                    secondArray = i.shipment.slice(1, 2);
                                    thirdArray = [];
                                    break;
                                case 3:
                                    firstArray = i.shipment.slice(0, 1);
                                    secondArray = i.shipment.slice(1, 2);
                                    thirdArray = i.shipment.slice(2, 3);
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
                }
                
                if (notTown.length > 0){
                    let mess = ""
                    let mess1 = ""
                    for (const i of notTown){
                        mess += i.boatName + "\n";
                        mess1 += i.weeksLeft + "\n"
                    }
                    embed1.addFields({name: "Boats at Sea", value: mess, inline: true})
                    embed1.addFields({name: "Time till arrival", value: mess1, inline: true})
                }
                

                interaction.editReply({embeds: [embed1]});
            }

            req.send();

        } catch (error) {
            interaction.editReply({content: error.message});
        }
    }, cooldown: 10
}

export default command;
