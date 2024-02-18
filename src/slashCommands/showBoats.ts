import { EmbedBuilder, SlashCommandBuilder, userMention } from "discord.js";
import { SlashCommand } from "../types";


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

                for (const i of inTown){

                    let m = i.jobs.split(' ');
                    let str = "";
                    for (const a of m){
                        str += a + ", ";
                    }
                    str = str.slice(0, -2);

                    str += " have their gp wage die amount +1.";


                    embed1.addFields({name: i.boatName + "(Time till Departure: " + i.weeksLeft + " weeks)", value: str})

                    if (i.tier2Ability != ""){
                        embed1.addFields({name: "Additional Feature!", value: i.tier2Ability});
                    }
                    if (i.shipment.length > 0)
                    {
                        embed1.addFields({name: "Goods", value: " "});

                        const targetLength = Math.ceil(i.shipment.length / 3);

                        const firstArray = i.shipment.slice(0, targetLength);
                        const secondArray = i.shipment.slice(targetLength, targetLength * 2 - 1);
                        const thirdArray = i.shipment.slice(targetLength * 2 - 1);
                        // First Array
                        let mess = "";
                        for (const j of firstArray) 
                            mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";

                        embed1.addFields({name: " ", value: mess, inline: true})
                        // Second Array
                        mess = "";
                        for (const j of secondArray) 
                            mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";

                        embed1.addFields({name: " ", value: mess, inline: true})
                        // Third Array
                        mess = "";
                        for (const j of thirdArray) 
                            mess += j.name + " (x" + j.quantity + " " + j.price + ")\n";

                        embed1.addFields({name: " ", value: mess, inline: true})
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
