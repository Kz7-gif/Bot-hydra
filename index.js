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
    ChannelType 
} = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Configurações de comandos slash
const commands = [
    new SlashCommandBuilder()
        .setName('painel')
        .setDescription('Envia o painel oficial de atendimento (tickets)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    new SlashCommandBuilder()
        .setName('painelpx')
        .setDescription('Envia o painel de apoio ao projeto via Pix')
        .addStringOption(option => 
            option.setName('valor')
                .setDescription('Valor sugerido para apoio (Ex: R$ 10,00 ou Personalizado)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot online como ${client.user.tag}!`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        console.log('Registrando comandos slash (/) ...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Comandos slash registrados com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar comandos:', error);
    }
});

// Lidar com interações (Comandos, Menus e Botões)
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'painel') {
            const embed = new EmbedBuilder()
                .setTitle('👑 Central de Atendimento')
                .setDescription('Selecione o tipo de atendimento no menu abaixo e um **ticket privado** será aberto com a equipe.')
                .setColor(0xF1C40F) // Cor amarela dourada igual ao print
                .addFields(
                    { name: '❓ Dúvidas', value: 'Notifier, planos, key, HWID ou o servidor' },
                    { name: '🍓 Reportar Grif', value: 'Tenha em mãos: `NICK` | `CLIP` | `MINUTO EXATO`\nPode postar o clip no YouTube (não privado) e enviar só o link' },
                    { name: '🔒 Desbloquear Contas', value: 'Indisponível no momento. Avisaremos quando reabrir.' }
                )
                .setFooter({ text: 'Sistema de Tickets Oficial' })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select_menu')
                .setPlaceholder('📋 Selecione o tipo de atendimento...')
                .addOptions([
                    {
                        label: 'Dúvidas',
                        description: 'Tirar uma dúvida com a equipe',
                        value: 'ticket_duvidas',
                        emoji: '❓'
                    },
                    {
                        label: 'Reportar Grif',
                        description: 'Reportar quem te grifou (clip obrigatório)',
                        value: 'ticket_reportar',
                        emoji: '🍓'
                    },
                    {
                        label: 'Desbloquear Contas (indisponível)',
                        description: 'Temporariamente fechado — não é possível abrir ticket',
                        value: 'ticket_desbloquear',
                        emoji: '🔒'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ content: 'Painel enviado com sucesso!', ephemeral: true });
            await interaction.channel.send({ embeds: [embed], components: [row] });
        }

        if (commandName === 'painelpx') {
            const valorInput = interaction.options.getString('valor') || 'R$ 10,00 (Valor Livre)';

            const pixKey = process.env.PIX_KEY || 'sua-chave-pix-aqui';
            const pixName = process.env.PIX_NAME || 'Nome do Beneficiário';
            const pixCity = process.env.PIX_CITY || 'Cidade';

            const embed = new EmbedBuilder()
                .setTitle('💎 Apoie o Projeto / PIX')
                .setDescription('Gostou do nosso trabalho e quer ajudar a manter o projeto ativo e crescendo? Faça uma doação via Pix!\n\n**Como apoiar:**\n1. Copie a chave Pix abaixo ou escaneie o QR Code.\n2. Faça o pagamento no valor desejado.\n3. Envie o comprovante em nosso canal de suporte ou abra um ticket.')
                .setColor(0x2ECC71) // Verde Pix
                .addFields(
                    { name: '💰 Valor Sugerido', value: `\`${valorInput}\``, inline: true },
                    { name: '🔑 Chave Pix', value: `\`${pixKey}\``, inline: false },
                    { name: '👤 Beneficiário', value: `${pixName} (${pixCity})`, inline: false }
                )
                .setFooter({ text: 'Agradecemos imensamente o seu apoio!' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('copy_pix_key')
                    .setLabel('Copiar Chave Pix')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('📋')
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    } 
    else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select_menu') {
            const selectedValue = interaction.values[0];

            if (selectedValue === 'ticket_desbloquear') {
                return interaction.reply({ 
                    content: '❌ O setor de **Desbloquear Contas** está temporariamente indisponível no momento.', 
                    ephemeral: true 
                });
            }

            const guild = interaction.guild;
            const user = interaction.user;

            // Verificar se o usuário já tem um ticket aberto
            const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
            if (existingChannel) {
                return interaction.reply({ 
                    content: `❌ Você já possui um ticket aberto em ${existingChannel}!`, 
                    ephemeral: true 
                });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                // Criar canal de ticket privado
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
                        }
                    ],
                });

                const ticketEmbed = new EmbedBuilder()
                    .setTitle(`Ticket de ${user.username}`)
                    .setDescription(`Olá ${user}, seja bem-vindo ao seu atendimento!\n\n**Categoria:** ${selectedValue === 'ticket_duvidas' ? 'Dúvidas' : 'Reportar Grif'}\n\nExplique detalhadamente o seu caso e aguarde a resposta da nossa equipe.`)
                    .setColor(0x3498DB)
                    .setTimestamp();

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Fechar Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

                await ticketChannel.send({ content: `${user} <@&${process.env.STAFF_ROLE_ID || ''}>`, embeds: [ticketEmbed], components: [closeRow] });

                await interaction.editReply({ 
                    content: `✅ Seu ticket foi criado com sucesso! Acesse: ${ticketChannel}` 
                });
            } catch (error) {
                console.error('Erro ao criar canal de ticket:', error);
                await interaction.editReply({ 
                    content: '❌ Ocorreu um erro ao criar o canal de ticket. Verifique as permissões do bot.' 
                });
            }
        }
    }
    else if (interaction.isButton()) {
        if (interaction.customId === 'copy_pix_key') {
            const pixKey = process.env.PIX_KEY || 'sua-chave-pix-aqui';
            await interaction.reply({ 
                content: `🔑 A chave Pix é: \`${pixKey}\`\nCopie e cole no seu aplicativo bancário. Muito obrigado pelo apoio! ❤️`, 
                ephemeral: true 
            });
        }
        else if (interaction.customId === 'close_ticket') {
            const channel = interaction.channel;
            await interaction.reply({ content: '🔒 Este ticket será fechado em 5 segundos...' });
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (err) {
                    console.error('Erro ao deletar canal:', err);
                }
            }, 5000);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
