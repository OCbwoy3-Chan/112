import {
	InteractionHandler,
	InteractionHandlerTypes,
} from "@sapphire/framework";
import {
	type ButtonInteraction,
	type StringSelectMenuInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import { GetUserDetails } from "../../../lib/roblox";
import { general } from "../../../locale/commands";
import { IsWhitelisted } from "../../Database/helpers/DiscordWhitelist";
import { UnbanUser } from "../../Database/helpers/RobloxBan";

export class MessageComponentHandler extends InteractionHandler {
	public constructor(
		ctx: InteractionHandler.LoaderContext,
		options: InteractionHandler.Options
	) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.MessageComponent,
		});
	}

	public override parse(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		// console.log("ban",(/^112\-(confirm\-)?unban\-/.test(interaction.customId)),interaction.customId)
		if (/^112\-(confirm\-)?unban\-/.test(interaction.customId))
			return this.some();

		return this.none();
	}

	public async run(
		interaction: ButtonInteraction | StringSelectMenuInteraction
	) {
		if (!interaction.isButton()) return;

		if (interaction.customId.startsWith("112-confirm-unban-")) {
			const userid = interaction.customId.replace(
				"112-confirm-unban-",
				""
			);

			await interaction.deferReply({
				ephemeral: false,
				fetchReply: true
			});

			const ru = await GetUserDetails(parseInt(userid));

			if (!(await IsWhitelisted(interaction.user.id))) {
				return await interaction.reply({
					content: general.errors.missingPermission("WHITELIST"),
					ephemeral: true,
				});
			}

			try {
				await UnbanUser(userid);
			} catch (e_) {
				return await interaction.followUp({
					content: `> ${e_}`,
					ephemeral: true,
				});
			}

			return await interaction.followUp({
				content: `> [${ru.displayName}](https://fxroblox.com/users/${userid}) has been unbanned.`,
				ephemeral: false,
			});
		}

		if (interaction.customId.startsWith("112-unban-")) {
			if (!(await IsWhitelisted(interaction.user.id))) {
				return await interaction.reply({
					content: general.errors.missingPermission("WHITELIST"),
					ephemeral: true,
				});
			}

			await interaction.deferReply({
				ephemeral: false,
				fetchReply: true
			});

			const userid = interaction.customId.replace("112-unban-", "");

			const stupidFuckingButton = new ButtonBuilder()
				.setLabel("CONFIRM UNBAM")
				.setCustomId(`112-confirm-unban-${userid}`)
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(
				stupidFuckingButton
			);

			const ru = await GetUserDetails(parseInt(userid));

			return await interaction.followUp({
				content: `> Are you sure you want to unban [${ru.displayName}](https://fxroblox.com/users/${userid})?`,
				components: [row as any],
				ephemeral: true,
			});
		}
	}
}
