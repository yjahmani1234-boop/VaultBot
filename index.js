const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`[+] Vault Nuker is online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    if (message.content === '!nuke_panel') {
        const embed = new EmbedBuilder()
            .setTitle('💀 Vault Nuker')
            .setDescription('**أداة نيوك السيرفرات**\n\nاضغط على الزر في الأسفل، وحط التوكن والـ ID عشان نفحص السيرفر.')
            .setColor(0xFF0000)
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/564/564619.png');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('nuke_start')
                .setLabel('جحفلة سيرفر (Nuke)')
                .setEmoji('💀')
                .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        message.delete().catch(()=>{});
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    
    // 1. زر جحفلة
    if (interaction.isButton() && interaction.customId === 'nuke_start') {
        const modal = new ModalBuilder()
            .setCustomId('nuke_modal')
            .setTitle('بيانات النيوك');

        const tokenInput = new TextInputBuilder()
            .setCustomId('bot_token')
            .setLabel('توكن البوت (Bot Token)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const guildInput = new TextInputBuilder()
            .setCustomId('guild_id')
            .setLabel('ايدي السيرفر (Server ID)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(tokenInput),
            new ActionRowBuilder().addComponents(guildInput)
        );

        await interaction.showModal(modal);
    }

    // 2. استلام البيانات وفتح التكت
    if (interaction.isModalSubmit() && interaction.customId === 'nuke_modal') {
        const botToken = interaction.fields.getTextInputValue('bot_token');
        const guildId = interaction.fields.getTextInputValue('guild_id');

        await interaction.reply({ content: '⏳ جاري فحص التوكن وصلاحيات البوت...', ephemeral: true });

        try {
            // فحص التوكن
            const res = await fetch('https://discord.com/api/v10/users/@me', {
                headers: { Authorization: `Bot ${botToken}` }
            });

            if (!res.ok) {
                return interaction.editReply({ content: '❌ التوكن غلط أو البوت محظور.' });
            }

            const botData = await res.json();
            
            // فتح التكت (هذا الجزء اللي كان ناقص)
            const ticketChannel = await interaction.guild.channels.create({
                name: `nuke-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                ],
            });

            const embed = new EmbedBuilder()
                .setTitle('✅ تم فحص البوت بنجاح')
                .setDescription(`**البوت:** ${botData.username}\n**السيرفر:** \`${guildId}\`\n\nاختر نوع التخريب اللي بدك ياه من القائمة:`)
                .setColor(0x57F287);

            const select = new StringSelectMenuBuilder()
                .setCustomId('nuke_action')
                .setPlaceholder('اختر نوع التخريب...')
                .addOptions([
                    { label: 'حذف كل الرومات', value: 'delete_channels', emoji: '🗑️' },
                    { label: 'سبام رومات ورسائل', value: 'spam_channels', emoji: '💬' },
                    { label: 'حذف كل الرتب', value: 'delete_roles', emoji: '🛑' },
                    { label: 'طرد كل الأعضاء', value: 'ban_all', emoji: '🔨' },
                ]);

            const row = new ActionRowBuilder().addComponents(select);

            await ticketChannel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
            await interaction.editReply({ content: `✅ تم فتح التكت: ${ticketChannel}` });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ حدث خطأ أثناء فتح التكت (تأكد من صلاحيات البوت).' });
        }
    }

    // 3. خيارات التخريب
    if (interaction.isStringSelectMenu() && interaction.customId === 'nuke_action') {
        const action = interaction.values[0];
        
        if (action === 'delete_channels') {
            await interaction.reply({ content: '✅ جاري حذف الرومات...', ephemeral: true });
        }
        if (action === 'spam_channels') {
            await interaction.reply({ content: '✅ جاري السبام...', ephemeral: true });
        }
    }
});

http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
