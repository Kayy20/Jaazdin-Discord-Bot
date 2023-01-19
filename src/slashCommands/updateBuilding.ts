import { InteractionResponse, SlashCommandBuilder, EmbedBuilder, userMention, ButtonBuilder, ActionRowBuilder, ButtonStyle, SelectMenuBuilder, AnyComponentBuilder} from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import BuildingDB from "../schemas/Building";
import { timeout } from "cron";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("updatebuilding")
    .setDescription("Update a Building reminder")
    ,

    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await BuildingDB.find({});

            if (!buildings){
                interaction.editReply({content: "There are no buildings to update!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }


            let nembed = new EmbedBuilder()
            .setColor('Aqua')
            .setTitle("Buildings In Progress");

            const menu = new SelectMenuBuilder()
            .setCustomId(interaction.user.id)
            .setPlaceholder("No Building")

            // Selectable List for buildings
            for (const building of buildings) {
                let memb = await interaction.guild?.members.fetch(building.user);

                nembed.addFields(
                    {
                    name: building.name,
                    value: `Tier: ${building.tier} \t Weeks Left: ${building.time} \t Owner: ${userMention(building.user)}`
                    }
                )
                menu.addOptions(
                    {
                        label: `${building.name}, Weeks Left: ${building.time}, Owner: ${memb?.displayName}`,
                        value: building.name
                    }
                )
                
            }

            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('One Week Decrease')
                    .setCustomId(`1week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Two Week Decrease')
                    .setCustomId(`2week-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
                    ,
                    new ButtonBuilder()
                    .setLabel('Instant Finish')
                    .setCustomId(`finishbuilding-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Primary)
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