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
    panelTitle: "🛡️ Central de Suporte",
    panelDescription: "Olá! Precisa de ajuda? Selecione abaixo a categoria que melhor descreve o seu problema e nossa equipe entrará em contato em um canal privado exclusivo para você.",
    pixKey: process.env.PIX_KEY || "Não configurada",
    pixName: process.env.PIX_NAME || "Beneficiário",
    pixCity: process.env.PIX_CITY || "Cidade"
};

const CONFIG_FILE = './config.json';
if (fs.existsSync(CONFIG_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        config = { ...config, ...data };
    } catch (e) { console.error("Erro ao ler config:", e); }
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Comandos Slash
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Painel Administrativo para configurar o bot')
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
                .setTitle('⚙️ Configurações do Sistema')
                .setDescription('Gerencie o funcionamento e a aparência do seu bot.')
                .setColor(0x3498DB)
                .addFields(
                    { name: '📂 Categoria', value: config.ticketCategory ? `<#${config.ticketCategory}>` : 'Não definida', inline: true },
                    { name: '🛡️ Staff', value: config.staffRole ? `<@&${config.staffRole}>` : 'Não definido', inline: true },
                    { name: '📜 Logs', value: config.logChannel ? `<#${config.logChannel}>` : 'Não definido', inline: true },
                    { name: '📝 Descrição Atual', value: `\`${config.panelDescription.substring(0, 100)}...\``, inline: false }
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('conf_tickets').setLabel('Canais e Cargos').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
                new ButtonBuilder().setCustomId('conf_desc').setLabel('Editar Texto/Cor').setStyle(ButtonStyle.Secondary).setEmoji('✍️'),
                new ButtonBuilder().setCustomId('conf_pix').setLabel('Configurar Pix').setStyle(ButtonStyle.Success).setEmoji('💰')
            );

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        if (interaction.commandName === 'painel') {
            const embed = new EmbedBuilder()
                .setTitle(config.panelTitle)
                .setDescription(config.panelDescription)
                .setColor(0x3498DB) // Cor Azul conforme solicitado
                .addFields(
                    { name: '❓ Dúvidas Gerais', value: 'Para perguntas sobre o projeto, chaves ou suporte básico.' },
                    { name: '🍓 Denúncias / Grif', value: 'Reporte abusos. Lembre-se de anexar provas ou links de vídeos.' },
                    { name: '🔒 Outros Assuntos', value: 'Assuntos diversos que não se encaixam nas categorias acima.' }
                )
                .setFooter({ text: 'Clique abaixo para abrir um atendimento' });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('📋 Selecione uma categoria...')
                .addOptions([
                    { label: 'Dúvidas Gerais', value: 'duvidas', emoji: '❓' },
                    { label: 'Denúncias / Grif', value: 'grif', emoji: '🍓' },
                    { label: 'Outros Assuntos', value: 'outros', emoji: '🔒' }
                ]);

            await interaction.reply({ content: 'Painel enviado!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
        }

        if (interaction.commandName === 'painelpx') {
            const valor = interaction.options.getString('valor') || 'Livre';
            const embed = new EmbedBuilder()
                .setTitle('💎 Apoie o Projeto / PIX')
                .setDescription(`Sua contribuição ajuda a manter nossos serviços ativos!\n\n**Chave Pix:** \`${config.pixKey}\`\n**Beneficiário:** ${config.pixName}\n**Valor sugerido:** ${valor}`)
                .setColor(0x2ECC71);
            
            await interaction.reply({ embeds: [embed] });
        }
    }

    // 2. BOTÕES DO SETUP
    if (interaction.isButton()) {
        if (interaction.customId === 'conf_tickets') {
            const modal = new ModalBuilder().setCustomId('modal_tickets').setTitle('Canais e Cargos');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('cat_id').setLabel('ID da Categoria').setStyle(TextInputStyle.Short).setValue(config.ticketCategory)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('staff_id').setLabel('ID do Cargo Staff').setStyle(TextInputStyle.Short).setValue(config.staffRole)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('log_id').setLabel('ID do Canal de Logs').setStyle(TextInputStyle.Short).setValue(config.logChannel))
            );
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'conf_desc') {
            const modal = new ModalBuilder().setCustomId('modal_desc').setTitle('Personalizar Painel');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_title').setLabel('Título do Painel').setStyle(TextInputStyle.Short).setValue(config.panelTitle)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p_desc').setLabel('Descrição do Painel').setStyle(TextInputStyle.Paragraph).setValue(config.panelDescription))
            );
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'conf_pix') {
            const modal = new ModalBuilder().setCustomId('modal_pix').setTitle('Configurar Pix');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pix_key').setLabel('Chave Pix').setStyle(TextInputStyle.Short).setValue(config.pixKey)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('pix_name').setLabel('Nome').setStyle(TextInputStyle.Short).setValue(config.pixName))
            );
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply('🔒 Este ticket será encerrado em 5 segundos...');
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
            await interaction.reply({ content: '✅ Configurações de canais salvas!', ephemeral: true });
        }
        if (interaction.customId === 'modal_desc') {
            config.panelTitle = interaction.fields.getTextInputValue('p_title');
            config.panelDescription = interaction.fields.getTextInputValue('p_desc');
            saveConfig();
            await interaction.reply({ content: '✅ Texto do painel atualizado!', ephemeral: true });
        }
        if (interaction.customId === 'modal_pix') {
            config.pixKey = interaction.fields.getTextInputValue('pix_key');
            config.pixName = interaction.fields.getTextInputValue('pix_name');
            saveConfig();
            await interaction.reply({ content: '✅ Dados do Pix atualizados!', ephemeral: true });
        }
    }

    // 4. SELEÇÃO DE TICKET
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
            const type = interaction.values[0];
            const user = interaction.user;
            const channelName = `ticket-${user.username.toLowerCase().replace(/\s+/g, '-')}`;
            
            const existing = interaction.guild.channels.cache.find(c => c.name.includes(channelName));
            if (existing) return interaction.reply({ content: `Você já possui um atendimento aberto: ${existing}`, ephemeral: true });

            try {
                const channel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: config.ticketCategory || null,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                        { id: config.staffRole || client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                    ]
                });

                const embed = new EmbedBuilder()
                    .setTitle('🎫 Novo Atendimento')
                    .setDescription(`Olá ${user}! Você abriu um ticket para: **${type.toUpperCase()}**.\nDescreva sua dúvida ou problema e aguarde o suporte.`)
                    .setColor(0x3498DB)
                    .setFooter({ text: 'Use o botão abaixo para encerrar o atendimento' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await channel.send({ content: `${user} | <@&${config.staffRole}>`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `✅ Seu ticket foi criado: ${channel}`, ephemeral: true });

                if (config.logChannel) {
                    const log = interaction.guild.channels.cache.get(config.logChannel);
                    if (log) log.send(`📂 **Ticket Criado:** ${user.tag} (${user.id}) abriu um ticket de **${type}**.`);
                }
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Erro ao criar o ticket. Verifique as permissões do bot.', ephemeral: true });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
