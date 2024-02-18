import { ModalBuilder, Events, SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle} from "discord.js";
import { SlashCommand } from "../types";
import  mongoose from "mongoose";
import JobDB from "../schemas/Job";
import { job } from "cron";

const command : SlashCommand = {
    command: new SlashCommandBuilder()
    .setName("jobreward")
    .setDescription("Congradulations you get something!")
    ,
    execute: async (interaction) => {
        // Returns with a menu either to speed up a week, or auto complete
        try {
            // Construct the information
            await interaction.deferReply({});

            if (mongoose.connection.readyState === 0) throw new Error("Database not connected");

            // Find all buildings and display them

            const buildings = await JobDB.find({});

            if (!buildings || buildings.length == 0){
                interaction.editReply({content: "There are no jobs!"})
                setTimeout(function() {
                    interaction.deleteReply();
                }, 5000)
                return
            }

            const jobSelect = new StringSelectMenuBuilder()
                .setCustomId('job-'+interaction.user.id)
                .setPlaceholder('Select your job');
                for (const i of buildings){
                    jobSelect.addOptions(
                        {
                            label: i.name,
                            value: i.name
                        }
                    )
                }
            const secRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
                [
                    new ButtonBuilder()
                    .setLabel('Cancel')
                    .setCustomId(`job-cancel-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Danger)
                    ,
                    new ButtonBuilder()
                    .setLabel('Continue')
                    .setCustomId(`job-continue-${interaction.user.id}`)
                    .setStyle(ButtonStyle.Success)
                ]
            )

            const firRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(jobSelect);

            interaction.editReply({components: [firRow, secRow]})

        } catch (error) {
            interaction.editReply({content: "Something went wrong..."});
        }
    }, cooldown: 10
}

export default command;