const { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require('discord.js');
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
    console.log(`[+] Bot is online: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

    // أمر إنشاء رسالة المتجر
    if (message.content === '!store') {
        const embed = new EmbedBuilder()
            .setTitle('Welcome to Vault')
            .setDescription('**Premium Tools & Services**\n\nاضغط على الزر في الأسفل لفتح تذكرة وطلب الأداة التي تريدها.\n\n> ✅ تسليم فوري\n> 🔒 موثوق 100%')
            .setColor(0x8B5CF6) // لون بنفسجي (يناسب اسم Vault)
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/2885/2885417.png') // أيقونة خزنة/صندوق
            .setFooter({ text: 'Vault Store | discord.gg/197' })
            .setTimestamp(); 

        // إنشاء الزر
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('طلب أداة (Order Tool)')
                .setEmoji('🛒')
                .setStyle(ButtonStyle.Success) // زر أخضر
        );

        await message.channel.send({ embeds: [embed], components: [row] });
        message.delete().catch(()=>{});
    }
});

// التعامل مع الأزرار
client.on(Events.InteractionCreate, async (interaction) => {
    
    if (interaction.isButton() && interaction.customId === 'open_ticket') {
        await interaction.reply({ content: '⏳ جاري فتح تذكرة لك... (هنا تضع كود إنشاء التكت)', ephemeral: true });
    }
});

// سطر الحماية عشان Render ما يطفي البوت
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

client.login(TOKEN);