const { Client, GatewayIntentBits, Events, Partials, EmbedBuilder } = require('discord.js');

// Lade Umgebungsvariablen
require('dotenv').config();

const CONFIG = {
  // Umgebungsvariablen aus .env-Datei
  token: process.env.BOT_TOKEN,
  logChannelId: process.env.LOG_CHANNEL_ID,
  
  // Farben für Embeds
  colors: {
    add: '#00ff00',
    remove: '#ff0000'
  },
  
  // Emojis
  emojis: {
    memberAdd: '👤',
    vipAdd: '⭐',
    memberRemove: '👤',
    vipRemove: '⭐'
  }
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Bot ist eingeloggt als ${client.user.tag}`); //Bot starten und in der Konsole bescheid geben
});

/**
 * Erstellt ein Embed für Reaktionsbenachrichtigungen
 * @param {Object} options - Optionen für das Embed
 * @returns {EmbedBuilder} Das erstellte Embed
 */
function createReactionEmbed({ color, title, description, user, emoji, messageId, messageLink }) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .addFields(
      { 
        name: title.includes('Hinzugefügt') 
          ? `${CONFIG.emojis.memberAdd} Mitglied` 
          : `${CONFIG.emojis.memberRemove} Mitglied`, 
        value: `<@${user.id}>`, 
        inline: true 
      },
      { 
        name: title.includes('Hinzugefügt') 
          ? `${CONFIG.emojis.vipAdd} Emoji` 
          : `${CONFIG.emojis.vipRemove} Emoji`, 
        value: emoji.toString(), 
        inline: true 
      }
    )
    .setTimestamp()
    .setFooter({ text: `Nachricht ID: ${messageId}` });
    
  if (user.displayAvatarURL()) {
    embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
  }
  
  return embed;
}

/**
 * Verarbeitet Reaktionsereignisse und sendet Logs
 * @param {Object} reaction - Die Reaktion
 * @param {Object} user - Der Benutzer, der reagiert hat
 * @param {boolean} isAdded - Ob die Reaktion hinzugefügt oder entfernt wurde
 */
async function handleReaction(reaction, user, isAdded) {
  // Ignoriere Bot-Reaktionen
  if (user.bot) return;

  try {
    // Lade vollständige Daten, falls nötig
    if (reaction.partial) await reaction.fetch();
    
    let message = reaction.message;
    if (message.partial) await message.fetch();
    
    // Nachrichtenlink
    const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
  
    );
    
    // Sende Embed in den Log-Kanal
    const logChannel = await client.channels.fetch(CONFIG.logChannelId);
    if (!logChannel) return;
    
    const embed = createReactionEmbed({
      color: isAdded ? CONFIG.colors.add : CONFIG.colors.remove,
      title: isAdded ? 'Reaktion Hinzugefügt!' : 'Reaktion Entfernt!',
      description: `> Benutzer hat ${isAdded ? 'auf' : 'von'} eine${isAdded ? 'r' : ''} [Nachricht](${messageLink}) ${isAdded ? 'reagiert' : 'eine Reaktion entfernt'}`,
      user,
      emoji: reaction.emoji,
      messageId: message.id,
      messageLink
    });
    
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Fehler bei der Verarbeitung einer Reaktion: ${error.message}`);
  }
}

// Event-Listener für hinzugefügte Reaktionen
client.on(Events.MessageReactionAdd, (reaction, user) => 
  handleReaction(reaction, user, true)
);

// Event-Listener für entfernte Reaktionen
client.on(Events.MessageReactionRemove, (reaction, user) => 
  handleReaction(reaction, user, false)
);

client.login(CONFIG.token); //Login mit token
