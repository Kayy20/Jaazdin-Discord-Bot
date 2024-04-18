import { InteractionResponse, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, userMention, ButtonStyle } from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import PlantDB from "../schemas/Plant";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("updateplant")
    .setDescription("Update a Plant reminder")
    ,
    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            //await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await PlantDB.find({});

            if (!buildings || buildings.length == 0){
                interaction.reply({content: "There are no plants to update!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }

            const embeds = [];
            const menus = [];

            let nembed = new EmbedBuilder()
            .setColor('Green')
            .setTitle("Plants In Progress");

            let menu = new StringSelectMenuBuilder()
            .setCustomId("0-"+interaction.user.id)
            .setPlaceholder("No Plant")
            let count = 0;
            // Selectable List for buildings
            for (const building of buildings) {
                let memb = await interaction.guild?.members.fetch(building.user);

                

                if (count == 25) {
                    embeds.push(nembed);
                    nembed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle("Plants In Progress Continued...");
                    count = 0;
                    menus.push(menu);
                    menu = new StringSelectMenuBuilder()
                    .setCustomId(menus.length+"-"+interaction.user.id)
                    .setPlaceholder("No Plant continued...")
                }

                nembed.addFields(
                    {
                    name: building.name,
                    value: `Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
                    }
                )
                menu.addOptions(
                    {
                        label: `${building.name.substring(0, 40)}, Weeks Left: ${building.time}, Owner: ${memb?.displayName}`,
                        value: `${building.name}-${building.time}-${building.user}`
                    }
                )
                
                count++;
            }
            embeds.push(nembed);
            menus.push(menu);

            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('One Week Decrease')
                    .setCustomId(`plant-1week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Two Week Decrease')
                    .setCustomId(`plant-2week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel("Stop Repeat")
                    .setCustomId(`plant-stoprep-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel("Start Repeat")
                    .setCustomId(`plant-startrep-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                ])

            // Button for each option, not for buildings
            const firstRow = [];
            for (let i = 0; i < menus.length; i++) {
                firstRow.push(new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(menus[i]));
            }

            interaction.reply({embeds: embeds, components: [...firstRow, secRow]})
            

        } catch (error) {
            interaction.reply({content: error.message});
        }
    }, cooldown: 10
}

export default command;