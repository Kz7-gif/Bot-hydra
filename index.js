const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionFlagsBits, 
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Carregar ou criar configuração local
let config = {
    ticketCategory: "",
    staffRole: "",
    logChannel: "",
    pixKey: process.env.PIX_KEY || "Não configurada",
    pixName: process.env.PIX_NAME || "Beneficiário",
    pixCity: process.env.PIX_CITY || "Cidade"
};

const CONFIG_FILE = './config.json';
if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Comandos Slash
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Abre o Painel de Controle Administrativo do Bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Envia o painel de tickets para os usuários')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('painelpx')
        .setDescription('Envia o painel de apoio Pix')
        .addStringOption(option => option.setName('valor').setDescription('Valor sugerido'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot online como ${client.user.tag}!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Comandos registrados!');
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    // 1. COMANDOS SLASH
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'setup') {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Painel de Controle Administrativo')
                .setDescription('Configure as opções do seu bot abaixo. Essas configurações definem como os tickets e o Pix vão funcionar.')
                .setColor(0x2B2D31)
                .addFields(
                    { name: '📂 Categoria de Tickets', value: config.ticketCategory ? `<#${config.ticketCategory}>` : 'Não definida', inline: true },
                    { name: '🛡️ Cargo Staff', value: config.staffRole ? `<@&${config.staffRole}>` : 'Não definido', inline: true },
                    { name: '📜 Canal de Logs', value: config.logChannel ? `<#${config.logChannel}>` : 'Não definido', inline: true },
                    { name: '🔑 Chave Pix', value: `\`${config.pixKey}\``, inline: false }
                );

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('conf_tickets').setLabel('Configurar Tickets').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
                new ButtonBuilder().setCustomId('conf_pix').setLabel('Configurar Pix').setStyle(ButtonStyle.Success).setEmoji('💰')
            );

            await interaction.reply({ embeds: [embed], components: [row1], ephemeral: true });
        }

        if (interaction.commandName === 'painel') {
            const embed = new EmbedBuilder()
                .setTitle('👑 Central de Atendimento')
                .setDescription('Selecione o tipo de atendimento no menu abaixo e um **ticket privado** será aberto com a equipe.')
                .setColor(0xF1C40F)
                .addFields(
                    { name: '❓ Dúvidas', value: 'Notifier, planos, key, HWID ou o servidor' },
                    { name: '🍓 Reportar Grif', value: 'Tenha em mãos: `NICK` | `CLIP` | `MINUTO EXATO`' },
                    { name: '🔒 Desbloquear Contas', value: 'Indisponível no momento.' }
                );

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('📋 Selecione uma opção...')
                .addOptions([
                    { label: 'Dúvidas', value: 'duvidas', emoji: '❓' },
                    { label: 'Reportar Grif', value: 'grif', emoji: '🍓' },
                    { label: 'Desbloquear', value: 'desbloquear', emoji: '🔒' }
                ]);

            await interaction.reply({ content: 'Painel enviado!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }

        if (interaction.commandName === 'painelpx') {
            const valor = interaction.options.getString('valor') || 'Livre';
            const embed = new EmbedBuilder()
                .setTitle('💎 Apoie o Projeto / PIX')
                .setDescription(`Sua ajuda mantém o projeto online!\n\n**Chave Pix:** \`${config.pixKey}\`\n**Nome:** ${config.pixName}\n**Valor:** ${valor}`)
                .setColor(0x2ECC71);
            
            await interaction.reply({ embeds: [embed] });
        }
    }

    // 2. BOTÕES DO SETUP
    if (interaction.isButton()) {
        if (interaction.customId === 'conf_tickets') {
            const modal = new ModalBuilder().setCustomId('modal_tickets').setTitle('Configuração de Tickets');
            
            const catInput = new TextInputBuilder()
                .setCustomId('cat_id').setLabel('ID da Categoria dos Tickets').setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 123456789012345678').setValue(config.ticketCategory);
            
            const staffInput = new TextInputBuilder()
                .setCustomId('staff_id').setLabel('ID do Cargo da Staff').setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 123456789012345678').setValue(config.staffRole);

            const logInput = new TextInputBuilder()
                .setCustomId('log_id').setLabel('ID do Canal de Logs').setStyle(TextInputStyle.Short)
                .setPlaceholder('Ex: 123456789012345678').setValue(config.logChannel);

            modal.addComponents(
                new ActionRowBuilder().addComponents(catInput),
                new ActionRowBuilder().addComponents(staffInput),
                new ActionRowBuilder().addComponents(logInput)
            );
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'conf_pix') {
            const modal = new ModalBuilder().setCustomId('modal_pix').setTitle('Configuração do Pix');
            const keyInput = new TextInputBuilder().setCustomId('pix_key').setLabel('Sua Chave Pix').setStyle(TextInputStyle.Short).setValue(config.pixKey);
            const nameInput = new TextInputBuilder().setCustomId('pix_name').setLabel('Nome do Beneficiário').setStyle(TextInputStyle.Short).setValue(config.pixName);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(keyInput),
                new ActionRowBuilder().addComponents(nameInput)
            );
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply('🔒 Fechando ticket em 5 segundos...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
        }
    }

    // 3. RECEBER DADOS DOS MODALS
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_tickets') {
            config.ticketCategory = interaction.fields.getTextInputValue('cat_id');
            config.staffRole = interaction.fields.getTextInputValue('staff_id');
            config.logChannel = interaction.fields.getTextInputValue('log_id');
            saveConfig();
            await interaction.reply({ content: '✅ Configurações de Tickets salvas!', ephemeral: true });
        }
        if (interaction.customId === 'modal_pix') {
            config.pixKey = interaction.fields.getTextInputValue('pix_key');
            config.pixName = interaction.fields.getTextInputValue('pix_name');
            saveConfig();
            await interaction.reply({ content: '✅ Configurações de Pix salvas!', ephemeral: true });
        }
    }

    // 4. SELEÇÃO DE TICKET (USUÁRIO)
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
            const type = interaction.values[0];
            if (type === 'desbloquear') return interaction.reply({ content: '❌ Este setor está fechado.', ephemeral: true });

            const user = interaction.user;
            const channelName = `ticket-${user.username.toLowerCase()}`;
            
            const existing = interaction.guild.channels.cache.find(c => c.name === channelName);
            if (existing) return interaction.reply({ content: `Você já tem um ticket: ${existing}`, ephemeral: true });

            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: config.ticketCategory || null,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                    { id: config.staffRole || client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            const embed = new EmbedBuilder()
                .setTitle(`Atendimento: ${type.toUpperCase()}`)
                .setDescription(`Olá ${user}, aguarde um momento. A equipe <@&${config.staffRole}> foi notificada.`)
                .setColor(0x3498DB);

            const btn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
            );

            await channel.send({ content: `${user} | <@&${config.staffRole}>`, embeds: [embed], components: [btn] });
            await interaction.reply({ content: `✅ Ticket criado: ${channel}`, ephemeral: true });

            if (config.logChannel) {
                const log = interaction.guild.channels.cache.get(config.logChannel);
                if (log) log.send(`🎫 **Ticket Aberto:** ${user.tag} abriu um ticket de ${type}.`);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
