import { InteractionResponse, SlashCommandBuilder, EmbedBuilder, SelectMenuBuilder, ActionRowBuilder, ButtonBuilder, userMention, ButtonStyle } from "discord.js";
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
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await PlantDB.find({});

            if (!buildings){
                interaction.editReply({content: "There are no plants to update!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }


            let nembed = new EmbedBuilder()
            .setColor('Green')
            .setTitle("Plants In Progress");

            const menu = new SelectMenuBuilder()
            .setCustomId(interaction.user.id)
            .setPlaceholder("No Plant")

            // Selectable List for buildings
            for (const building of buildings) {
                let memb = await interaction.guild?.members.fetch(building.user);

                nembed.addFields(
                    {
                    name: building.name,
                    value: `Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
                    }
                )
                menu.addOptions(
                    {
                        label: `${building.name}, Weeks Left: ${building.time}, Owner: ${memb?.displayName}`,
                        value: `${building.name}-${building.time}-${building.user}`
                    }
                )
                
            }

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
                ])

            // Button for each option, not for buildings

            const firstRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(menu)

            interaction.editReply({embeds: [nembed], components: [firstRow, secRow]})
            

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
        }
    }, cooldown: 10
}

export default command;