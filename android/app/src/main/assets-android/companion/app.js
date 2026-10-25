/* Shore Companion. The pairing key arrives once in the QR link (#k=…), is kept in localStorage and sent with every API call. */
(function () {
  'use strict';
  var STR = {
    de: { "Keyboard": "Tastatur", "Type on the TV": "Auf dem TV tippen", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Wähle auf dem TV ein Textfeld aus und tippe dann hier. Die Suche in Shore funktioniert sofort; andere Apps brauchen „Shore phone keyboard“ in den Bedienungshilfen des TVs.", "Enter": "Enter", "Clear": "Leeren", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Schalte „Shore phone keyboard“ auf dem TV ein: Einstellungen › Bedienungshilfen.", "Select a text field on the TV first.": "Wähle zuerst ein Textfeld auf dem TV aus.", "Pi-hole and AdGuard": "Pi-hole und AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "Adresse und Passwort deines Pi-hole oder AdGuard Home. AdGuard Home braucht auch den Benutzernamen. Das Passwort bleibt auf dem Fernseher.", "User name (AdGuard Home)": "Benutzername (AdGuard Home)", "Password": "Passwort", "The server refused the password.": "Der Server hat das Passwort abgelehnt.", "That doesn’t look like Pi-hole or AdGuard Home.": "Das sieht nicht nach Pi-hole oder AdGuard Home aus.", "Disconnect the ad blocker from the TV?": "Den Werbeblocker vom Fernseher trennen?", 'Inputs': 'Eingänge', 'Give a device its own name. Leave it empty for the name the device sends.': 'Gib einem Gerät einen eigenen Namen. Leer lassen für den Namen, den das Gerät sendet.', 'Add-ons': 'Erweiterungen', 'Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.': 'Die Adresse deines Servers und ein langlebiger Zugriffstoken, den du in deinem Home-Assistant-Profil unter Sicherheit erstellst. Der Token bleibt auf dem Fernseher.', 'Connect': 'Verbinden', 'Disconnect': 'Trennen', 'Paste a long-lived access token.': 'Füge einen langlebigen Zugriffstoken ein.', 'Home Assistant refused this token.': 'Home Assistant hat diesen Token abgelehnt.', 'The TV couldn’t reach this address.': 'Der Fernseher erreicht diese Adresse nicht.', 'That doesn’t look like Home Assistant.': 'Das sieht nicht nach Home Assistant aus.', 'Saved on the TV': 'Auf dem Fernseher gespeichert', 'Long-lived access token': 'Langlebiger Zugriffstoken', 'Connected': 'Verbunden', 'Checking…': 'Wird geprüft…', 'Disconnect Home Assistant from the TV?': 'Home Assistant vom Fernseher trennen?', 'Calendar': 'Kalender', 'Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.': 'Füge die private iCal-Adresse deines Kalenders ein, um deinen nächsten Termin unter der Uhr zu sehen. Google: Einstellungen › dein Kalender › Privatadresse im iCal-Format. Apple: Kalender öffentlich teilen. Outlook: Kalender veröffentlichen › ICS. Schalte es am Fernseher unter Einstellungen › Uhr ein.', 'News feed': 'Nachrichtenquelle', 'Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.': 'Ein gespeicherter RSS- oder Atom-Feed wird zur Quelle der Schlagzeilen unter der Uhr. Andere Quellen findest du am Fernseher unter Einstellungen › Nachrichten.', 'That isn’t a web address.': 'Das ist keine Webadresse.', 'Backup': 'Sicherung', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Speichere alle TV-Einstellungen auf diesem Handy und stelle sie später oder auf einem anderen Fernseher wieder her. Fotos bleiben auf dem Fernseher.', 'Save backup': 'Sicherung speichern', 'Restore…': 'Wiederherstellen…', 'This isn’t a Shore backup.': 'Das ist keine Shore-Sicherung.', 'Replace the TV’s settings with this backup?': 'Die Einstellungen des Fernsehers durch diese Sicherung ersetzen?', 'Restored': 'Wiederhergestellt', 'Photos': 'Fotos', 'TV settings': 'Einstellungen', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Öffne Shore am Fernseher, um die Einstellungen von hier zu ändern.', 'Connecting to your TV…': 'Verbinde mit deinem Fernseher…', 'Connected to your TV': 'Mit deinem Fernseher verbunden', 'Your TV is not reachable': 'Dein Fernseher ist nicht erreichbar',
      'Pair this phone': 'Dieses Handy koppeln', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Öffne am Fernseher Shore › Einstellungen › Handy und scanne den Code mit der Kamera.',
      'Send to your TV': 'An den Fernseher senden', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Fotos, GIFs und kurze Videos werden zu Hintergründen unter „Meine Fotos“. Querformat füllt den Bildschirm am besten.',
      'Choose photos': 'Fotos auswählen', 'My photos': 'Meine Fotos', 'Nothing here yet.': 'Noch nichts hier.', 'Remove all': 'Alle entfernen', 'Weather place': 'Ort fürs Wetter',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Die Uhr zeigt das Wetter für diese Stadt. Leer lassen, um die Zeitzone des Fernsehers zu nutzen.',
      'Save': 'Speichern', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Funktioniert nur im Heim-WLAN. Nichts verlässt dein Netzwerk.',
      'Sending…': 'Wird gesendet…', 'Sent': 'Gesendet', 'Failed': 'Fehlgeschlagen', 'Saved': 'Gespeichert', 'Removed': 'Entfernt', 'Remove all your photos from the TV?': 'Alle deine Fotos vom Fernseher entfernen?', 'Install as an app': 'Als App installieren', 'Remove this photo?': 'Dieses Foto entfernen?', 'Frame it for your TV': 'Für den Fernseher zuschneiden', 'Drag to move. Pinch or use the slider to zoom.': 'Zum Verschieben ziehen. Zum Zoomen mit zwei Fingern oder dem Regler.', 'Skip': 'Überspringen', 'Whole photo': 'Ganzes Foto', 'Send': 'Senden', 'Skipped': 'Übersprungen', 'of': 'von' },
    fr: { "Keyboard": "Clavier", "Type on the TV": "Taper sur la TV", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Sélectionnez un champ de texte sur la TV, puis tapez ici. La recherche de Shore marche tout de suite ; les autres apps demandent d’activer « Shore phone keyboard » dans l’accessibilité de la TV.", "Enter": "Entrée", "Clear": "Effacer", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Activez « Shore phone keyboard » sur la TV : Paramètres › Accessibilité.", "Select a text field on the TV first.": "Sélectionnez d’abord un champ de texte sur la TV.", "Pi-hole and AdGuard": "Pi-hole et AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "L’adresse et le mot de passe de votre Pi-hole ou AdGuard Home. AdGuard Home demande aussi le nom d’utilisateur. Le mot de passe reste sur le téléviseur.", "User name (AdGuard Home)": "Nom d’utilisateur (AdGuard Home)", "Password": "Mot de passe", "The server refused the password.": "Le serveur a refusé le mot de passe.", "That doesn’t look like Pi-hole or AdGuard Home.": "Cela ne ressemble pas à Pi-hole ou AdGuard Home.", "Disconnect the ad blocker from the TV?": "Déconnecter le bloqueur de publicités du téléviseur ?", 'Inputs': 'Entrées', 'Give a device its own name. Leave it empty for the name the device sends.': 'Donnez un nom à un appareil. Laissez vide pour le nom qu’il envoie.', 'Add-ons': 'Modules', 'Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.': 'L’adresse de votre serveur et un jeton d’accès longue durée, créé dans votre profil Home Assistant sous Sécurité. Le jeton reste sur le téléviseur.', 'Connect': 'Connecter', 'Disconnect': 'Déconnecter', 'Paste a long-lived access token.': 'Collez un jeton d’accès longue durée.', 'Home Assistant refused this token.': 'Home Assistant a refusé ce jeton.', 'The TV couldn’t reach this address.': 'Le téléviseur n’a pas pu joindre cette adresse.', 'That doesn’t look like Home Assistant.': 'Cela ne ressemble pas à Home Assistant.', 'Saved on the TV': 'Enregistré sur le téléviseur', 'Long-lived access token': 'Jeton d’accès longue durée', 'Connected': 'Connecté', 'Checking…': 'Vérification…', 'Disconnect Home Assistant from the TV?': 'Déconnecter Home Assistant du téléviseur ?', 'Calendar': 'Agenda', 'Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.': 'Collez l’adresse iCal privée de votre agenda pour voir votre prochain événement sous l’horloge. Google : Paramètres › votre agenda › Adresse secrète au format iCal. Apple : partagez l’agenda publiquement. Outlook : Publier le calendrier › ICS. Activez-le dans Réglages › Horloge sur le téléviseur.', 'News feed': 'Flux d’actualités', 'Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.': 'Un flux RSS ou Atom enregistré devient la source des titres sous l’horloge. Les autres sources sont dans Réglages › Actualités sur le téléviseur.', 'That isn’t a web address.': 'Ce n’est pas une adresse web.', 'Backup': 'Sauvegarde', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Enregistrez tous les réglages du téléviseur sur ce téléphone, puis restaurez-les plus tard ou sur un autre téléviseur. Les photos restent sur le téléviseur.', 'Save backup': 'Enregistrer la sauvegarde', 'Restore…': 'Restaurer…', 'This isn’t a Shore backup.': 'Ce n’est pas une sauvegarde Shore.', 'Replace the TV’s settings with this backup?': 'Remplacer les réglages du téléviseur par cette sauvegarde ?', 'Restored': 'Restauré', 'Photos': 'Photos', 'TV settings': 'Réglages TV', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Ouvrez Shore sur le téléviseur pour modifier ses réglages d’ici.', 'Connecting to your TV…': 'Connexion au téléviseur…', 'Connected to your TV': 'Connecté au téléviseur', 'Your TV is not reachable': 'Téléviseur injoignable',
      'Pair this phone': 'Associer ce téléphone', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Sur le téléviseur, ouvrez Shore › Réglages › Téléphone et scannez le code avec l’appareil photo.',
      'Send to your TV': 'Envoyer au téléviseur', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Photos, GIF et courtes vidéos deviennent des fonds dans Mes photos. Le format paysage remplit mieux l’écran.',
      'Choose photos': 'Choisir des photos', 'My photos': 'Mes photos', 'Nothing here yet.': 'Rien pour l’instant.', 'Remove all': 'Tout supprimer', 'Weather place': 'Lieu pour la météo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'L’horloge affiche la météo de cette ville. Laissez vide pour utiliser le fuseau horaire du téléviseur.',
      'Save': 'Enregistrer', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Fonctionne uniquement sur votre Wi-Fi. Rien ne quitte votre réseau.',
      'Sending…': 'Envoi…', 'Sent': 'Envoyé', 'Failed': 'Échec', 'Saved': 'Enregistré', 'Removed': 'Supprimé', 'Remove all your photos from the TV?': 'Supprimer toutes vos photos du téléviseur ?', 'Install as an app': 'Installer comme app', 'Remove this photo?': 'Supprimer cette photo ?', 'Frame it for your TV': 'Cadrer pour le téléviseur', 'Drag to move. Pinch or use the slider to zoom.': 'Faites glisser pour déplacer. Pincez ou utilisez le curseur pour zoomer.', 'Skip': 'Ignorer', 'Whole photo': 'Photo entière', 'Send': 'Envoyer', 'Skipped': 'Ignorée', 'of': 'sur' },
    es: { "Keyboard": "Teclado", "Type on the TV": "Escribir en la TV", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Selecciona un campo de texto en la TV y escribe aquí. La búsqueda de Shore funciona al momento; otras apps necesitan activar «Shore phone keyboard» en la accesibilidad de la TV.", "Enter": "Intro", "Clear": "Borrar", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Activa «Shore phone keyboard» en la TV: Ajustes › Accesibilidad.", "Select a text field on the TV first.": "Primero selecciona un campo de texto en la TV.", "Pi-hole and AdGuard": "Pi-hole y AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "La dirección y la contraseña de tu Pi-hole o AdGuard Home. AdGuard Home también necesita el nombre de usuario. La contraseña se queda en el televisor.", "User name (AdGuard Home)": "Usuario (AdGuard Home)", "Password": "Contraseña", "The server refused the password.": "El servidor rechazó la contraseña.", "That doesn’t look like Pi-hole or AdGuard Home.": "No parece Pi-hole ni AdGuard Home.", "Disconnect the ad blocker from the TV?": "¿Desconectar el bloqueador de anuncios del televisor?", 'Inputs': 'Entradas', 'Give a device its own name. Leave it empty for the name the device sends.': 'Ponle un nombre propio a un dispositivo. Déjalo vacío para usar el nombre que envía.', 'Add-ons': 'Complementos', 'Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.': 'La dirección de tu servidor y un token de acceso de larga duración, creado en tu perfil de Home Assistant en Seguridad. El token se queda en el televisor.', 'Connect': 'Conectar', 'Disconnect': 'Desconectar', 'Paste a long-lived access token.': 'Pega un token de acceso de larga duración.', 'Home Assistant refused this token.': 'Home Assistant rechazó este token.', 'The TV couldn’t reach this address.': 'El televisor no pudo acceder a esta dirección.', 'That doesn’t look like Home Assistant.': 'Eso no parece Home Assistant.', 'Saved on the TV': 'Guardado en el televisor', 'Long-lived access token': 'Token de acceso de larga duración', 'Connected': 'Conectado', 'Checking…': 'Comprobando…', 'Disconnect Home Assistant from the TV?': '¿Desconectar Home Assistant del televisor?', 'Calendar': 'Calendario', 'Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.': 'Pega la dirección iCal privada de tu calendario para ver tu próximo evento bajo el reloj. Google: Configuración › tu calendario › Dirección secreta en formato iCal. Apple: comparte el calendario públicamente. Outlook: Publicar calendario › ICS. Actívalo en Ajustes › Reloj en el televisor.', 'News feed': 'Fuente de noticias', 'Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.': 'Al guardar un feed RSS o Atom, será la fuente de los titulares bajo el reloj. Las demás fuentes están en Ajustes › Noticias en el televisor.', 'That isn’t a web address.': 'Eso no es una dirección web.', 'Backup': 'Copia de seguridad', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Guarda todos los ajustes del televisor en este móvil y restáuralos más tarde o en otro televisor. Las fotos se quedan en el televisor.', 'Save backup': 'Guardar copia', 'Restore…': 'Restaurar…', 'This isn’t a Shore backup.': 'Esto no es una copia de Shore.', 'Replace the TV’s settings with this backup?': '¿Sustituir los ajustes del televisor por esta copia?', 'Restored': 'Restaurado', 'Photos': 'Fotos', 'TV settings': 'Ajustes de TV', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Abre Shore en el televisor para cambiar sus ajustes desde aquí.', 'Connecting to your TV…': 'Conectando con tu televisor…', 'Connected to your TV': 'Conectado a tu televisor', 'Your TV is not reachable': 'No se puede acceder al televisor',
      'Pair this phone': 'Vincular este móvil', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'En el televisor, abre Shore › Ajustes › Móvil y escanea el código con la cámara.',
      'Send to your TV': 'Enviar al televisor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Las fotos, GIF y vídeos cortos se convierten en fondos en Mis fotos. El formato horizontal llena mejor la pantalla.',
      'Choose photos': 'Elegir fotos', 'My photos': 'Mis fotos', 'Nothing here yet.': 'Aún no hay nada.', 'Remove all': 'Quitar todo', 'Weather place': 'Lugar del tiempo',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'El reloj muestra el tiempo de esta ciudad. Déjalo vacío para usar la zona horaria del televisor.',
      'Save': 'Guardar', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Solo funciona en tu Wi-Fi. Nada sale de tu red.',
      'Sending…': 'Enviando…', 'Sent': 'Enviado', 'Failed': 'Error', 'Saved': 'Guardado', 'Removed': 'Quitado', 'Remove all your photos from the TV?': '¿Quitar todas tus fotos del televisor?', 'Install as an app': 'Instalar como app', 'Remove this photo?': '¿Quitar esta foto?', 'Frame it for your TV': 'Encuádrala para el televisor', 'Drag to move. Pinch or use the slider to zoom.': 'Arrastra para mover. Pellizca o usa el control para hacer zoom.', 'Skip': 'Omitir', 'Whole photo': 'Foto entera', 'Send': 'Enviar', 'Skipped': 'Omitida', 'of': 'de' },
    nl: { "Keyboard": "Toetsenbord", "Type on the TV": "Typen op de tv", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Kies een tekstveld op de tv en typ dan hier. Zoeken in Shore werkt meteen; andere apps hebben ‘Shore phone keyboard’ nodig in de toegankelijkheidsinstellingen van de tv.", "Enter": "Enter", "Clear": "Wissen", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Zet ‘Shore phone keyboard’ aan op de tv: Instellingen › Toegankelijkheid.", "Select a text field on the TV first.": "Kies eerst een tekstveld op de tv.", "Pi-hole and AdGuard": "Pi-hole en AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "Het adres en wachtwoord van je Pi-hole of AdGuard Home. AdGuard Home heeft ook de gebruikersnaam nodig. Het wachtwoord blijft op de tv.", "User name (AdGuard Home)": "Gebruikersnaam (AdGuard Home)", "Password": "Wachtwoord", "The server refused the password.": "De server weigerde het wachtwoord.", "That doesn’t look like Pi-hole or AdGuard Home.": "Dat lijkt niet op Pi-hole of AdGuard Home.", "Disconnect the ad blocker from the TV?": "De adblocker loskoppelen van de tv?", 'Inputs': 'Ingangen', 'Give a device its own name. Leave it empty for the name the device sends.': 'Geef een apparaat een eigen naam. Laat leeg voor de naam die het apparaat stuurt.', 'Add-ons': 'Uitbreidingen', 'Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.': 'Het adres van je server en een langlevend toegangstoken, aangemaakt in je Home Assistant-profiel onder Beveiliging. Het token blijft op de tv.', 'Connect': 'Verbinden', 'Disconnect': 'Ontkoppelen', 'Paste a long-lived access token.': 'Plak een langlevend toegangstoken.', 'Home Assistant refused this token.': 'Home Assistant weigerde dit token.', 'The TV couldn’t reach this address.': 'De tv kon dit adres niet bereiken.', 'That doesn’t look like Home Assistant.': 'Dat lijkt niet op Home Assistant.', 'Saved on the TV': 'Opgeslagen op de tv', 'Long-lived access token': 'Langlevend toegangstoken', 'Connected': 'Verbonden', 'Checking…': 'Controleren…', 'Disconnect Home Assistant from the TV?': 'Home Assistant loskoppelen van de tv?', 'Calendar': 'Agenda', 'Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.': 'Plak het privé-iCal-adres van je agenda om je volgende afspraak onder de klok te zien. Google: Instellingen › je agenda › Geheim adres in iCal-indeling. Apple: deel de agenda openbaar. Outlook: Agenda publiceren › ICS. Zet het aan op de tv onder Instellingen › Klok.', 'News feed': 'Nieuwsfeed', 'Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.': 'Een opgeslagen RSS- of Atom-feed wordt de bron van de koppen onder de klok. Andere bronnen staan op de tv onder Instellingen › Nieuws.', 'That isn’t a web address.': 'Dat is geen webadres.', 'Backup': 'Back-up', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Bewaar alle tv-instellingen op deze telefoon en zet ze later of op een andere tv terug. Foto’s blijven op de tv.', 'Save backup': 'Back-up opslaan', 'Restore…': 'Terugzetten…', 'This isn’t a Shore backup.': 'Dit is geen Shore-back-up.', 'Replace the TV’s settings with this backup?': 'De instellingen van de tv vervangen door deze back-up?', 'Restored': 'Teruggezet', 'Photos': 'Foto’s', 'TV settings': 'Tv-instellingen', 'Apps': 'Apps', 'Open Shore on the TV to change its settings from here.': 'Open Shore op de tv om de instellingen hier te wijzigen.', 'Connecting to your TV…': 'Verbinden met je tv…', 'Connected to your TV': 'Verbonden met je tv', 'Your TV is not reachable': 'Je tv is niet bereikbaar',
      'Pair this phone': 'Deze telefoon koppelen', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Open op de tv Shore › Instellingen › Telefoon en scan de code met je camera.',
      'Send to your TV': 'Naar je tv sturen', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Foto’s, gifs en korte video’s worden achtergronden onder Mijn foto’s. Liggend vult het scherm het best.',
      'Choose photos': 'Foto’s kiezen', 'My photos': 'Mijn foto’s', 'Nothing here yet.': 'Nog niets.', 'Remove all': 'Alles verwijderen', 'Weather place': 'Plaats voor het weer',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'De klok toont het weer voor deze stad. Laat leeg om de tijdzone van de tv te gebruiken.',
      'Save': 'Opslaan', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Werkt alleen op je wifi thuis. Niets verlaat je netwerk.',
      'Sending…': 'Versturen…', 'Sent': 'Verstuurd', 'Failed': 'Mislukt', 'Saved': 'Opgeslagen', 'Removed': 'Verwijderd', 'Remove all your photos from the TV?': 'Al je foto’s van de tv verwijderen?', 'Install as an app': 'Als app installeren', 'Remove this photo?': 'Deze foto verwijderen?', 'Frame it for your TV': 'Uitsnijden voor je tv', 'Drag to move. Pinch or use the slider to zoom.': 'Sleep om te verplaatsen. Knijp of gebruik de schuifregelaar om te zoomen.', 'Skip': 'Overslaan', 'Whole photo': 'Hele foto', 'Send': 'Versturen', 'Skipped': 'Overgeslagen', 'of': 'van' },
    pl: { "Keyboard": "Klawiatura", "Type on the TV": "Pisz na TV", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Wybierz pole tekstowe na TV i pisz tutaj. Wyszukiwanie w Shore działa od razu; inne aplikacje wymagają włączenia „Shore phone keyboard” w ułatwieniach dostępu TV.", "Enter": "Enter", "Clear": "Wyczyść", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Włącz „Shore phone keyboard” na TV: Ustawienia › Ułatwienia dostępu.", "Select a text field on the TV first.": "Najpierw wybierz pole tekstowe na TV.", "Pi-hole and AdGuard": "Pi-hole i AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "Adres i hasło Twojego Pi-hole lub AdGuard Home. AdGuard Home potrzebuje też nazwy użytkownika. Hasło zostaje na telewizorze.", "User name (AdGuard Home)": "Nazwa użytkownika (AdGuard Home)", "Password": "Hasło", "The server refused the password.": "Serwer odrzucił hasło.", "That doesn’t look like Pi-hole or AdGuard Home.": "To nie wygląda na Pi-hole ani AdGuard Home.", "Disconnect the ad blocker from the TV?": "Odłączyć bloker reklam od telewizora?", 'Inputs': 'Wejścia', 'Give a device its own name. Leave it empty for the name the device sends.': 'Nadaj urządzeniu własną nazwę. Zostaw puste, aby użyć nazwy wysyłanej przez urządzenie.', 'Add-ons': 'Dodatki', 'Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.': 'Adres serwera i długoterminowy token dostępu utworzony w profilu Home Assistant w sekcji Bezpieczeństwo. Token zostaje na telewizorze.', 'Connect': 'Połącz', 'Disconnect': 'Odłącz', 'Paste a long-lived access token.': 'Wklej długoterminowy token dostępu.', 'Home Assistant refused this token.': 'Home Assistant odrzucił ten token.', 'The TV couldn’t reach this address.': 'Telewizor nie może połączyć się z tym adresem.', 'That doesn’t look like Home Assistant.': 'To nie wygląda na Home Assistant.', 'Saved on the TV': 'Zapisany na telewizorze', 'Long-lived access token': 'Długoterminowy token dostępu', 'Connected': 'Połączono', 'Checking…': 'Sprawdzanie…', 'Disconnect Home Assistant from the TV?': 'Odłączyć Home Assistant od telewizora?', 'Calendar': 'Kalendarz', 'Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.': 'Wklej prywatny adres iCal kalendarza, aby widzieć najbliższe wydarzenie pod zegarem. Google: Ustawienia › twój kalendarz › Adres prywatny w formacie iCal. Apple: udostępnij kalendarz publicznie. Outlook: Publikuj kalendarz › ICS. Włącz to na telewizorze w Ustawienia › Zegar.', 'News feed': 'Źródło wiadomości', 'Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.': 'Zapisany kanał RSS lub Atom staje się źródłem nagłówków pod zegarem. Inne źródła znajdziesz w Ustawienia › Wiadomości na telewizorze.', 'That isn’t a web address.': 'To nie jest adres internetowy.', 'Backup': 'Kopia zapasowa', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Zapisz wszystkie ustawienia telewizora na tym telefonie i przywróć je później lub na innym telewizorze. Zdjęcia zostają na telewizorze.', 'Save backup': 'Zapisz kopię', 'Restore…': 'Przywróć…', 'This isn’t a Shore backup.': 'To nie jest kopia Shore.', 'Replace the TV’s settings with this backup?': 'Zastąpić ustawienia telewizora tą kopią?', 'Restored': 'Przywrócono', 'Photos': 'Zdjęcia', 'TV settings': 'Ustawienia TV', 'Apps': 'Aplikacje', 'Open Shore on the TV to change its settings from here.': 'Otwórz Shore na telewizorze, aby zmieniać ustawienia stąd.', 'Connecting to your TV…': 'Łączenie z telewizorem…', 'Connected to your TV': 'Połączono z telewizorem', 'Your TV is not reachable': 'Telewizor jest niedostępny',
      'Pair this phone': 'Sparuj ten telefon', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'Na telewizorze otwórz Shore › Ustawienia › Telefon i zeskanuj kod aparatem.',
      'Send to your TV': 'Wyślij na telewizor', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Zdjęcia, GIF-y i krótkie filmy stają się tapetami w Moich zdjęciach. Poziome najlepiej wypełniają ekran.',
      'Choose photos': 'Wybierz zdjęcia', 'My photos': 'Moje zdjęcia', 'Nothing here yet.': 'Jeszcze nic tu nie ma.', 'Remove all': 'Usuń wszystkie', 'Weather place': 'Miejsce pogody',
      'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Zegar pokazuje pogodę dla tego miasta. Zostaw puste, aby użyć strefy czasowej telewizora.',
      'Save': 'Zapisz', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Działa tylko w domowej sieci Wi-Fi. Nic nie opuszcza Twojej sieci.',
      'Sending…': 'Wysyłanie…', 'Sent': 'Wysłano', 'Failed': 'Błąd', 'Saved': 'Zapisano', 'Removed': 'Usunięto', 'Remove all your photos from the TV?': 'Usunąć wszystkie Twoje zdjęcia z telewizora?', 'Install as an app': 'Zainstaluj jako aplikację', 'Remove this photo?': 'Usunąć to zdjęcie?', 'Frame it for your TV': 'Kadruj dla telewizora', 'Drag to move. Pinch or use the slider to zoom.': 'Przeciągnij, aby przesunąć. Uszczypnij lub użyj suwaka, aby powiększyć.', 'Skip': 'Pomiń', 'Whole photo': 'Całe zdjęcie', 'Send': 'Wyślij', 'Skipped': 'Pominięto', 'of': 'z' },
    uk: { "Keyboard": "Клавіатура", "Type on the TV": "Друк на телевізорі", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Виберіть текстове поле на телевізорі й друкуйте тут. Пошук у Shore працює одразу; іншим застосункам потрібна «Shore phone keyboard» у спеціальних можливостях телевізора.", "Enter": "Enter", "Clear": "Очистити", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Увімкніть «Shore phone keyboard» на телевізорі: Налаштування › Спеціальні можливості.", "Select a text field on the TV first.": "Спершу виберіть текстове поле на телевізорі.", "Pi-hole and AdGuard": "Pi-hole і AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "Адреса й пароль вашого Pi-hole або AdGuard Home. AdGuard Home також потребує імені користувача. Пароль залишається на телевізорі.", "User name (AdGuard Home)": "Ім’я користувача (AdGuard Home)", "Password": "Пароль", "The server refused the password.": "Сервер відхилив пароль.", "That doesn’t look like Pi-hole or AdGuard Home.": "Це не схоже на Pi-hole чи AdGuard Home.", "Disconnect the ad blocker from the TV?": "Від’єднати блокувальник реклами від телевізора?", 'Inputs': 'Входи', 'Give a device its own name. Leave it empty for the name the device sends.': 'Дайте пристрою власну назву. Залиште порожнім, щоб використовувати назву від пристрою.', 'Add-ons': 'Доповнення', 'Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.': 'Адреса вашого сервера й довгостроковий токен доступу, створений у профілі Home Assistant у розділі «Безпека». Токен залишається на телевізорі.', 'Connect': 'Під’єднати', 'Disconnect': 'Від’єднати', 'Paste a long-lived access token.': 'Вставте довгостроковий токен доступу.', 'Home Assistant refused this token.': 'Home Assistant відхилив цей токен.', 'The TV couldn’t reach this address.': 'Телевізор не зміг під’єднатися до цієї адреси.', 'That doesn’t look like Home Assistant.': 'Це не схоже на Home Assistant.', 'Saved on the TV': 'Збережено на телевізорі', 'Long-lived access token': 'Довгостроковий токен доступу', 'Connected': 'Підключено', 'Checking…': 'Перевірка…', 'Disconnect Home Assistant from the TV?': 'Від’єднати Home Assistant від телевізора?', 'Calendar': 'Календар', 'Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.': 'Вставте приватну iCal-адресу календаря, щоб бачити наступну подію під годинником. Google: Налаштування › ваш календар › Секретна адреса у форматі iCal. Apple: поділіться календарем публічно. Outlook: Опублікувати календар › ICS. Увімкніть це на телевізорі в Налаштування › Годинник.', 'News feed': 'Стрічка новин', 'Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.': 'Збережена RSS- або Atom-стрічка стає джерелом заголовків під годинником. Інші джерела — у Налаштування › Новини на телевізорі.', 'That isn’t a web address.': 'Це не веб-адреса.', 'Backup': 'Резервна копія', 'Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.': 'Збережіть усі налаштування телевізора на цьому телефоні й відновіть їх пізніше або на іншому телевізорі. Фото залишаються на телевізорі.', 'Save backup': 'Зберегти копію', 'Restore…': 'Відновити…', 'This isn’t a Shore backup.': 'Це не резервна копія Shore.', 'Replace the TV’s settings with this backup?': 'Замінити налаштування телевізора цією копією?', 'Restored': 'Відновлено', 'Photos': 'Фото', 'TV settings': 'Налаштування', 'Apps': 'Застосунки', 'Open Shore on the TV to change its settings from here.': 'Відкрийте Shore на телевізорі, щоб змінювати налаштування звідси.', 'Connecting to your TV…': 'Підключення до телевізора…', 'Connected to your TV': 'Підключено до телевізора', 'Your TV is not reachable': 'Телевізор недоступний', 'Pair this phone': 'З’єднайте цей телефон', 'On the TV, open Shore › Settings › Phone and scan the code with your camera.': 'На телевізорі відкрийте Shore › Налаштування › Телефон і відскануйте код камерою.', 'Send to your TV': 'Надіслати на телевізор', 'Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.': 'Фото, GIF і короткі відео стають шпалерами в «Моїх фото». Горизонтальні найкраще заповнюють екран.', 'Choose photos': 'Вибрати фото', 'My photos': 'Мої фото', 'Nothing here yet.': 'Тут поки нічого немає.', 'Remove all': 'Видалити всі', 'Weather place': 'Місце для погоди', 'The clock shows the weather for this city. Leave it empty to use the TV’s time zone.': 'Годинник показує погоду для цього міста. Залиште порожнім, щоб використовувати часовий пояс телевізора.', 'Save': 'Зберегти', 'Works on your home Wi-Fi only. Nothing leaves your network.': 'Працює лише в домашній мережі Wi-Fi. Нічого не виходить за межі вашої мережі.', 'Sending…': 'Надсилання…', 'Sent': 'Надіслано', 'Failed': 'Помилка', 'Saved': 'Збережено', 'Removed': 'Видалено', 'Remove all your photos from the TV?': 'Видалити всі ваші фото з телевізора?', 'Install as an app': 'Установити як застосунок', 'Remove this photo?': 'Видалити це фото?', 'Frame it for your TV': 'Обріжте для телевізора', 'Drag to move. Pinch or use the slider to zoom.': 'Перетягніть, щоб перемістити. Зведіть пальці або скористайтеся повзунком для масштабу.', 'Skip': 'Пропустити', 'Whole photo': 'Усе фото', 'Send': 'Надіслати', 'Skipped': 'Пропущено', 'of': 'з' },
    it: { "Keyboard": "Tastiera", "Type on the TV": "Scrivi sulla TV", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "Seleziona un campo di testo sulla TV, poi scrivi qui. La Ricerca di Shore funziona subito; le altre app richiedono Shore phone keyboard attivo nelle impostazioni di Accessibilità della TV.", "Enter": "Invio", "Clear": "Cancella", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "Attiva Shore phone keyboard sulla TV: Impostazioni › Accessibilità.", "Select a text field on the TV first.": "Prima seleziona un campo di testo sulla TV.", "Pi-hole and AdGuard": "Pi-hole e AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "Indirizzo e password del tuo Pi-hole o AdGuard Home. AdGuard Home richiede anche il nome utente. La password resta sulla TV.", "User name (AdGuard Home)": "Nome utente (AdGuard Home)", "Password": "Password", "The server refused the password.": "Il server ha rifiutato la password.", "That doesn’t look like Pi-hole or AdGuard Home.": "Non sembra Pi-hole o AdGuard Home.", "Disconnect the ad blocker from the TV?": "Scollegare il blocco pubblicità dalla TV?", "Inputs": "Ingressi", "Give a device its own name. Leave it empty for the name the device sends.": "Dai un nome a un dispositivo. Lascia vuoto per il nome inviato dal dispositivo.", "Add-ons": "Componenti aggiuntivi", "Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.": "L’indirizzo del server e un token di accesso a lunga durata, creato nel tuo profilo di Home Assistant alla voce Sicurezza. Il token resta sulla TV.", "Connect": "Collega", "Disconnect": "Scollega", "Paste a long-lived access token.": "Incolla un token di accesso a lunga durata.", "Home Assistant refused this token.": "Home Assistant ha rifiutato questo token.", "The TV couldn’t reach this address.": "La TV non riesce a raggiungere questo indirizzo.", "That doesn’t look like Home Assistant.": "Non sembra Home Assistant.", "Saved on the TV": "Salvato sulla TV", "Long-lived access token": "Token di accesso a lunga durata", "Connected": "Connesso", "Checking…": "Verifica…", "Disconnect Home Assistant from the TV?": "Scollegare Home Assistant dalla TV?", "Calendar": "Calendario", "Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.": "Incolla l’indirizzo iCal privato del calendario per vedere il prossimo evento sotto l’orologio. Google: Impostazioni › il tuo calendario › Indirizzo segreto in formato iCal. Apple: condividi il calendario pubblicamente. Outlook: Pubblica calendario › ICS. Attivalo in Impostazioni › Orologio sulla TV.", "News feed": "Feed di notizie", "Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.": "Salvando un feed RSS o Atom diventa la fonte dei titoli sotto l’orologio. Le altre fonti sono in Impostazioni › Notizie sulla TV.", "That isn’t a web address.": "Questo non è un indirizzo web.", "Backup": "Backup", "Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.": "Salva ogni impostazione della TV su questo telefono, poi ripristinala più tardi o su un’altra TV. Le foto restano sulla TV.", "Save backup": "Salva backup", "Restore…": "Ripristina…", "This isn’t a Shore backup.": "Questo non è un backup di Shore.", "Replace the TV’s settings with this backup?": "Sostituire le impostazioni della TV con questo backup?", "Restored": "Ripristinato", "Photos": "Foto", "TV settings": "Impostazioni TV", "Apps": "App", "Open Shore on the TV to change its settings from here.": "Apri Shore sulla TV per cambiarne le impostazioni da qui.", "Connecting to your TV…": "Connessione alla TV…", "Connected to your TV": "Connesso alla TV", "Your TV is not reachable": "La TV non è raggiungibile", "Pair this phone": "Abbina questo telefono", "On the TV, open Shore › Settings › Phone and scan the code with your camera.": "Sulla TV apri Shore › Impostazioni › Telefono e scansiona il codice con la fotocamera.", "Send to your TV": "Invia alla TV", "Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.": "Foto, GIF e brevi video diventano sfondi in Le mie foto. Le immagini orizzontali riempiono meglio lo schermo.", "Choose photos": "Scegli foto", "My photos": "Le mie foto", "Nothing here yet.": "Ancora niente qui.", "Remove all": "Rimuovi tutto", "Weather place": "Località meteo", "The clock shows the weather for this city. Leave it empty to use the TV’s time zone.": "L’orologio mostra il meteo di questa città. Lascia vuoto per usare il fuso orario della TV.", "Save": "Salva", "Works on your home Wi-Fi only. Nothing leaves your network.": "Funziona solo sul Wi-Fi di casa. Nulla esce dalla tua rete.", "Sending…": "Invio in corso…", "Sent": "Inviato", "Failed": "Non riuscito", "Saved": "Salvato", "Removed": "Rimosso", "Remove all your photos from the TV?": "Rimuovere tutte le foto dalla TV?", "Install as an app": "Installa come app", "Remove this photo?": "Rimuovere questa foto?", "Frame it for your TV": "Inquadrala per la TV", "Drag to move. Pinch or use the slider to zoom.": "Trascina per spostare. Pizzica o usa il cursore per lo zoom.", "Skip": "Salta", "Whole photo": "Foto intera", "Send": "Invia", "Skipped": "Saltata", "of": "di" },
    tr: { "Keyboard": "Klavye", "Type on the TV": "TV’de yaz", "Select a text field on the TV, then type here. Shore’s own Search works straight away; other apps need Shore phone keyboard turned on in the TV’s Accessibility settings.": "TV’de bir metin alanı seç, sonra buraya yaz. Shore’un kendi araması hemen çalışır; diğer uygulamalar için TV’nin Erişilebilirlik ayarlarında Shore phone keyboard açık olmalı.", "Enter": "Enter", "Clear": "Temizle", "Turn on Shore phone keyboard on the TV: Settings › Accessibility.": "TV’de Shore phone keyboard’u aç: Ayarlar › Erişilebilirlik.", "Select a text field on the TV first.": "Önce TV’de bir metin alanı seç.", "Pi-hole and AdGuard": "Pi-hole ve AdGuard", "Your Pi-hole or AdGuard Home address and password. AdGuard Home also needs the user name. The password stays on the TV.": "Pi-hole veya AdGuard Home adresin ve parolan. AdGuard Home için kullanıcı adı da gerekir. Parola TV’de kalır.", "User name (AdGuard Home)": "Kullanıcı adı (AdGuard Home)", "Password": "Parola", "The server refused the password.": "Sunucu parolayı reddetti.", "That doesn’t look like Pi-hole or AdGuard Home.": "Bu Pi-hole veya AdGuard Home gibi görünmüyor.", "Disconnect the ad blocker from the TV?": "Reklam engelleyicinin TV ile bağlantısı kesilsin mi?", "Inputs": "Girişler", "Give a device its own name. Leave it empty for the name the device sends.": "Bir cihaza kendi adını ver. Cihazın gönderdiği ad için boş bırak.", "Add-ons": "Eklentiler", "Your server’s address and a long-lived access token, made in your Home Assistant profile under Security. The token stays on the TV.": "Sunucunun adresi ve Home Assistant profilinde Güvenlik altında oluşturulan uzun ömürlü bir erişim token’ı. Token TV’de kalır.", "Connect": "Bağlan", "Disconnect": "Bağlantıyı kes", "Paste a long-lived access token.": "Uzun ömürlü bir erişim token’ı yapıştır.", "Home Assistant refused this token.": "Home Assistant bu token’ı reddetti.", "The TV couldn’t reach this address.": "TV bu adrese ulaşamadı.", "That doesn’t look like Home Assistant.": "Bu Home Assistant gibi görünmüyor.", "Saved on the TV": "TV’de kayıtlı", "Long-lived access token": "Uzun ömürlü erişim token’ı", "Connected": "Bağlı", "Checking…": "Kontrol ediliyor…", "Disconnect Home Assistant from the TV?": "Home Assistant’ın TV ile bağlantısı kesilsin mi?", "Calendar": "Takvim", "Paste your calendar’s private iCal address to see your next event under the clock. Google: Settings › your calendar › Secret address in iCal format. Apple: share the calendar publicly. Outlook: Publish calendar › ICS. Turn it on in Settings › Clock on the TV.": "Sıradaki etkinliğini saatin altında görmek için takviminin özel iCal adresini yapıştır. Google: Ayarlar › takvimin › iCal biçiminde gizli adres. Apple: takvimi herkese açık paylaş. Outlook: Takvimi yayımla › ICS. TV’de Ayarlar › Saat’ten aç.", "News feed": "Haber akışı", "Saving an RSS or Atom feed makes it the source of the headlines under the clock. Other sources are in Settings › News on the TV.": "Bir RSS veya Atom akışını kaydetmek onu saatin altındaki manşetlerin kaynağı yapar. Diğer kaynaklar TV’de Ayarlar › Haberler’de.", "That isn’t a web address.": "Bu bir web adresi değil.", "Backup": "Yedek", "Save every TV setting to this phone, then restore it later or on another TV. Photos stay on the TV.": "Tüm TV ayarlarını bu telefona kaydet, sonra daha sonra ya da başka bir TV’de geri yükle. Fotoğraflar TV’de kalır.", "Save backup": "Yedeği kaydet", "Restore…": "Geri yükle…", "This isn’t a Shore backup.": "Bu bir Shore yedeği değil.", "Replace the TV’s settings with this backup?": "TV’nin ayarları bu yedekle değiştirilsin mi?", "Restored": "Geri yüklendi", "Photos": "Fotoğraflar", "TV settings": "TV ayarları", "Apps": "Uygulamalar", "Open Shore on the TV to change its settings from here.": "Ayarları buradan değiştirmek için TV’de Shore’u aç.", "Connecting to your TV…": "TV’ye bağlanılıyor…", "Connected to your TV": "TV’ye bağlı", "Your TV is not reachable": "TV’ye ulaşılamıyor", "Pair this phone": "Bu telefonu eşle", "On the TV, open Shore › Settings › Phone and scan the code with your camera.": "TV’de Shore › Ayarlar › Telefon’u aç ve kodu kamerayla tara.", "Send to your TV": "TV’ye gönder", "Photos, GIFs and short videos become wallpapers under My photos. Landscape fills the screen best.": "Fotoğraflar, GIF’ler ve kısa videolar Fotoğraflarım altında duvar kâğıdı olur. Yatay görüntüler ekranı en iyi doldurur.", "Choose photos": "Fotoğraf seç", "My photos": "Fotoğraflarım", "Nothing here yet.": "Henüz bir şey yok.", "Remove all": "Tümünü kaldır", "Weather place": "Hava durumu konumu", "The clock shows the weather for this city. Leave it empty to use the TV’s time zone.": "Saat bu şehrin hava durumunu gösterir. TV’nin saat dilimini kullanmak için boş bırak.", "Save": "Kaydet", "Works on your home Wi-Fi only. Nothing leaves your network.": "Yalnızca ev Wi-Fi’nda çalışır. Hiçbir şey ağının dışına çıkmaz.", "Sending…": "Gönderiliyor…", "Sent": "Gönderildi", "Failed": "Başarısız", "Saved": "Kaydedildi", "Removed": "Kaldırıldı", "Remove all your photos from the TV?": "Tüm fotoğrafların TV’den kaldırılsın mı?", "Install as an app": "Uygulama olarak yükle", "Remove this photo?": "Bu fotoğraf kaldırılsın mı?", "Frame it for your TV": "TV için çerçevele", "Drag to move. Pinch or use the slider to zoom.": "Taşımak için sürükle. Yakınlaştırmak için iki parmakla sıkıştır ya da kaydırıcıyı kullan.", "Skip": "Atla", "Whole photo": "Fotoğrafın tamamı", "Send": "Gönder", "Skipped": "Atlandı", "of": "/" }
  };
  var lang = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase().split('-')[0];
  var dict = STR[lang] || {};
  function T(s) { return dict[s] || s; }
  function $(id) { return document.getElementById(id); }
  if (STR[lang]) document.documentElement.lang = lang;
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = T(el.getAttribute('data-t')); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-tp]'), function (el) { el.placeholder = T(el.getAttribute('data-tp')); });

  var KEY = 'shore.companion.key', key = '';
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var hash = /[#&]k=([A-Za-z0-9_-]{16,})/.exec(location.hash);
  try { if (hash) localStorage.setItem(KEY, hash[1]); key = localStorage.getItem(KEY) || ''; } catch (e) { key = hash ? hash[1] : ''; }
  if (hash) history.replaceState(null, '', location.pathname);

  var toastTimer = 0;
  function toast(text) { var t = $('toast'); t.textContent = text; t.className = 'toast show'; clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600); }
  function api(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['X-Shore-Key'] = key;
    return fetch('/api/' + path, options).then(function (r) {
      if (r.status === 401) { paired(false); throw new Error('pair'); }
      if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.status); });
      return r.json();
    });
  }
  function paired(on) { $('paired').hidden = !on; $('unpaired').hidden = on; }
  function show(info) {
    $('status').textContent = T('Connected to your TV');
    $('count').textContent = info.count + ' / ' + info.max;
    if (document.activeElement !== $('place')) $('place').value = info.place || '';
    if (document.activeElement !== $('feed')) $('feed').value = info.feed || '';
    showAddons(info.ha, info.adblock);
    if (document.activeElement !== $('cal')) $('cal').value = info.calendar || '';
    $('empty').hidden = info.photos.length > 0;
    $('clear').hidden = !info.photos.length;
    var grid = $('grid'); grid.innerHTML = '';
    info.photos.forEach(function (name) {
      var tile = document.createElement('div'), src = '/api/photo/' + name + '?k=' + encodeURIComponent(key), media, del;
      tile.className = 'tile';
      if (/\.mp4$/.test(name)) { media = document.createElement('video'); media.muted = true; media.loop = true; media.autoplay = true; media.playsInline = true; media.setAttribute('playsinline', ''); }
      else { media = document.createElement('img'); media.loading = 'lazy'; media.alt = ''; }
      media.src = src; tile.appendChild(media);
      del = document.createElement('button'); del.type = 'button'; del.textContent = '×'; del.setAttribute('aria-label', T('Remove this photo?'));
      del.onclick = function () { if (confirm(T('Remove this photo?'))) api('delete/' + name, { method: 'POST' }).then(function (i) { show(i); toast(T('Removed')); }); };
      tile.appendChild(del); grid.appendChild(tile);
    });
  }
  function load() {
    if (!key) { paired(false); $('status').textContent = T('Pair this phone'); return; }
    api('info').then(function (info) {
      paired(true); show(info);
      // This http page can't be installed; the HTTPS launcher on the website can, and brings the phone back here.
      if (info.install && /^https:\/\//.test(info.install) && !standalone) {
        $('installLink').href = info.install + '#tv=' + encodeURIComponent(location.origin) + '&k=' + encodeURIComponent(key);
        $('installLink').hidden = false;
      }
      var wall = $('wall'); wall.onload = function () { wall.className = 'ready'; }; wall.src = '/api/wallpaper?k=' + encodeURIComponent(key) + '&t=' + Date.now();
    }).catch(function (e) { if (e.message !== 'pair') $('status').textContent = T('Your TV is not reachable'); });
  }
  /* Crop: still photos open in a 16:9 frame (the TV's shape). Drag pans, pinch, wheel or the slider zoom.
     The crop is drawn at the photo's own resolution (at most 3840 px wide) and sent as JPEG. GIFs and videos go as they are. */
  var crop = { img: $('cropImg'), frame: $('cropFrame'), w: 0, h: 0, s: 1, min: 1, x: 0, y: 0, done: null, url: '' };
  function cropLayout() {
    var fw = crop.frame.clientWidth, fh = crop.frame.clientHeight;
    crop.s = Math.max(crop.min, Math.min(crop.min * 4, crop.s));
    crop.x = Math.min(0, Math.max(fw - crop.w * crop.s, crop.x));
    crop.y = Math.min(0, Math.max(fh - crop.h * crop.s, crop.y));
    crop.img.style.transform = 'translate(' + crop.x + 'px,' + crop.y + 'px) scale(' + crop.s + ')';
    $('cropZoom').value = String(crop.s / crop.min);
  }
  /* Zoom around a point in the frame, so what is under the fingers stays put. */
  function cropZoom(scale, px, py) {
    var old = crop.s;
    crop.s = Math.max(crop.min, Math.min(crop.min * 4, scale));
    crop.x = px - (px - crop.x) * crop.s / old; crop.y = py - (py - crop.y) * crop.s / old;
    cropLayout();
  }
  function cropFit() {
    var fw = crop.frame.clientWidth, fh = crop.frame.clientHeight;
    crop.min = Math.max(fw / crop.w, fh / crop.h); crop.s = crop.min;
    crop.x = (fw - crop.w * crop.s) / 2; crop.y = (fh - crop.h * crop.s) / 2;
    cropLayout();
  }
  function cropFinish(result) {
    var done = crop.done; crop.done = null;
    $('crop').hidden = true; document.body.style.overflow = '';
    if (crop.url) { URL.revokeObjectURL(crop.url); crop.url = ''; }
    if (done) done(result);
  }
  /* Resolves with a Blob (cropped), the File (whole photo) or null (skipped). */
  function askCrop(file, index, total, done) {
    crop.done = done; crop.url = URL.createObjectURL(file);
    $('cropCount').textContent = total > 1 ? (index + 1) + ' ' + T('of') + ' ' + total : '';
    crop.img.onload = function () {
      crop.w = crop.img.naturalWidth; crop.h = crop.img.naturalHeight;
      crop.img.style.width = crop.w + 'px'; crop.img.style.height = crop.h + 'px';
      $('crop').hidden = false; document.body.style.overflow = 'hidden';
      cropFit();
    };
    crop.img.onerror = function () { cropFinish(file); }; // the TV checks the file anyway
    crop.img.src = crop.url;
  }
  function cropBlob(file, done) {
    var fw = crop.frame.clientWidth, fh = crop.frame.clientHeight;
    var sx = -crop.x / crop.s, sy = -crop.y / crop.s, sw = fw / crop.s, sh = fh / crop.s;
    var out = Math.min(3840, Math.round(sw)), canvas = document.createElement('canvas');
    canvas.width = out; canvas.height = Math.round(out * 9 / 16);
    var g = canvas.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(crop.img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(function (blob) { done(blob || file); }, 'image/jpeg', 0.92);
  }
  (function () {
    var pts = {}, last = null;
    function list() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
    function local(e) { var r = crop.frame.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function gesture() {
      var p = list();
      if (p.length === 1) return { x: p[0].x, y: p[0].y, d: 0 };
      return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.sqrt(Math.pow(p[0].x - p[1].x, 2) + Math.pow(p[0].y - p[1].y, 2)) };
    }
    crop.frame.addEventListener('pointerdown', function (e) { crop.frame.setPointerCapture(e.pointerId); pts[e.pointerId] = local(e); last = gesture(); });
    crop.frame.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = local(e);
      var g = gesture();
      if (last && list().length === (last.d ? 2 : 1)) {
        crop.x += g.x - last.x; crop.y += g.y - last.y;
        if (g.d && last.d) cropZoom(crop.s * g.d / last.d, g.x, g.y); else cropLayout();
      }
      last = g;
    });
    function up(e) { delete pts[e.pointerId]; last = list().length ? gesture() : null; }
    crop.frame.addEventListener('pointerup', up);
    crop.frame.addEventListener('pointercancel', up);
    crop.frame.addEventListener('wheel', function (e) { e.preventDefault(); var p = local(e); cropZoom(crop.s * Math.pow(1.0015, -e.deltaY), p.x, p.y); }, { passive: false });
    $('cropZoom').addEventListener('input', function () { cropZoom(crop.min * +this.value, crop.frame.clientWidth / 2, crop.frame.clientHeight / 2); });
    window.addEventListener('resize', function () { if (!$('crop').hidden) cropFit(); });
  })();
  var cropFile = null;
  function cropBusy(on) { ['cropSend', 'cropWhole', 'cropSkip'].forEach(function (id) { $(id).disabled = on; }); }
  $('cropSend').onclick = function () { cropBusy(true); cropBlob(cropFile, function (blob) { cropBusy(false); cropFinish(blob); }); };
  $('cropWhole').onclick = function () { cropFinish(cropFile); };
  $('cropSkip').onclick = function () { cropFinish(null); };
  function cropable(f) { return /^image\/(jpeg|png|webp)$/.test(f.type) && window.HTMLCanvasElement && HTMLCanvasElement.prototype.toBlob; }

  $('files').onchange = function () {
    var files = Array.prototype.slice.call(this.files), queue = $('queue'), input = this;
    var rows = files.map(function (f) { var li = document.createElement('li'); li.innerHTML = '<span></span><span></span>'; li.firstChild.textContent = f.name; li.lastChild.textContent = '…'; queue.appendChild(li); return li; });
    var i = 0, stills = files.filter(cropable), still = 0;
    (function next() {
      if (i >= files.length) { input.value = ''; setTimeout(function () { queue.innerHTML = ''; }, 4000); return; }
      var li = rows[i], f = files[i++];
      function send(body) {
        if (!body) { li.lastChild.textContent = T('Skipped'); next(); return; }
        li.lastChild.textContent = T('Sending…');
        api('upload', { method: 'POST', body: body }).then(function (info) { li.className = 'done'; li.lastChild.textContent = T('Sent'); show(info); })
          .catch(function (e) { li.className = 'failed'; li.lastChild.textContent = e.message === 'pair' ? T('Failed') : String(e.message).slice(0, 60) || T('Failed'); })
          .then(next);
      }
      if (cropable(f)) { cropFile = f; askCrop(f, still++, stills.length, send); } else send(f);
    })();
  };
  $('clear').onclick = function () { if (confirm(T('Remove all your photos from the TV?'))) api('clear', { method: 'POST' }).then(function (i) { show(i); toast(T('Removed')); }); };
  $('feedForm').onsubmit = function (e) {
    e.preventDefault();
    var url = $('feed').value.trim();
    if (url && !/^https?:\/\/\S{4,500}$/i.test(url)) { toast(T('That isn’t a web address.')); return; }
    api('feed?url=' + encodeURIComponent(url), { method: 'POST' }).then(function (i) {
      show(i); toast(T('Saved'));
      // A saved feed becomes the news source; clearing it goes back to Google News.
      if (url) set('nsrc', 'phone'); else if (newsSource() === 'phone') set('nsrc', 'google');
    }).catch(function () { toast(T('Failed')); });
  };
  $('calForm').onsubmit = function (e) {
    e.preventDefault();
    var url = $('cal').value.trim();
    if (url && !/^(https?|webcal):\/\/\S{4,1000}$/i.test(url)) { toast(T('That isn’t a web address.')); return; }
    api('calendar?url=' + encodeURIComponent(url), { method: 'POST' }).then(function (i) {
      show(i); toast(T('Saved'));
      if (url) set('ccal', 'on');
    }).catch(function () { toast(T('Failed')); });
  };
  $('placeForm').onsubmit = function (e) {
    e.preventDefault();
    api('place?name=' + encodeURIComponent($('place').value.trim()), { method: 'POST' }).then(function (i) { show(i); toast(T('Saved')); }).catch(function () { toast(T('Failed')); });
  };
  /* Home Assistant add-on, in the Add-ons tab, which shows while it is switched on in Settings › Add-ons on the TV. The TV checks the
     address and token before keeping them, and never sends the token back, so the field stays empty. */
  var HA_ERRORS = { url: 'That isn’t a web address.', token: 'Paste a long-lived access token.', auth: 'Home Assistant refused this token.',
    network: 'The TV couldn’t reach this address.', server: 'That doesn’t look like Home Assistant.' };
  /* The Add-ons tab shows while any add-on is on, with a card for each one that is. */
  function showAddons(ha, ad) {
    var any = !!(ha && ha.enabled) || !!(ad && ad.enabled);
    document.querySelector('.tabs [data-tab="addons"]').hidden = !any;
    if (!any && tab === 'addons') setTab('photos');
    $('haCard').hidden = !(ha && ha.enabled); $('adCard').hidden = !(ad && ad.enabled);
    if (ha && ha.enabled) showHa(ha);
    if (ad && ad.enabled) showAd(ad);
  }
  var AD_ERRORS = { url: 'That isn’t a web address.', auth: 'The server refused the password.', network: 'The TV couldn’t reach this address.', server: 'That doesn’t look like Pi-hole or AdGuard Home.' };
  function showAd(ad) {
    if (document.activeElement !== $('adUrl')) $('adUrl').value = ad.url || '';
    if (document.activeElement !== $('adUser')) $('adUser').value = ad.user || '';
    $('adPass').placeholder = T(ad.configured ? 'Saved on the TV' : 'Password');
    $('adForget').hidden = !ad.configured;
    $('adStatus').textContent = !ad.configured ? '' : ad.status === 'error' ? T(AD_ERRORS[ad.error] || AD_ERRORS.server) : T('Connected') + ' · ' + (ad.kind === 'adguard' ? 'AdGuard Home' : 'Pi-hole');
  }
  $('adForm').onsubmit = function (e) {
    e.preventDefault();
    var url = $('adUrl').value.trim();
    if (!/^https?:\/\/\S{3,300}$/i.test(url)) { toast(T(AD_ERRORS.url)); return; }
    $('adStatus').textContent = T('Checking…');
    api('adblock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url, user: $('adUser').value.trim(), password: $('adPass').value }) }).then(function (i) {
      $('adPass').value = ''; show(i); toast(T('Connected'));
    }).catch(function (err) {
      var code = '';
      try { code = JSON.parse(err.message).error; } catch (x) { }
      $('adStatus').textContent = T(AD_ERRORS[code] || 'Failed');
    });
  };
  $('adForget').onclick = function () {
    if (confirm(T('Disconnect the ad blocker from the TV?'))) api('adblock/clear', { method: 'POST' }).then(function (i) { $('adPass').value = ''; show(i); toast(T('Removed')); });
  };
  function showHa(ha) {
    if (document.activeElement !== $('haUrl')) $('haUrl').value = ha.url || '';
    $('haToken').placeholder = T(ha.configured ? 'Saved on the TV' : 'Long-lived access token');
    $('haForget').hidden = !ha.configured;
    $('haStatus').textContent = !ha.configured ? '' : ha.status === 'error' ? T(HA_ERRORS[ha.error] || HA_ERRORS.server) : T('Connected');
  }
  $('haForm').onsubmit = function (e) {
    e.preventDefault();
    var url = $('haUrl').value.trim(), token = $('haToken').value.trim();
    if (!/^https?:\/\/\S{3,300}$/i.test(url)) { toast(T(HA_ERRORS.url)); return; }
    $('haStatus').textContent = T('Checking…');
    api('ha', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: url, token: token }) }).then(function (i) {
      $('haToken').value = ''; show(i); toast(T('Connected'));
    }).catch(function (err) {
      var code = '';
      try { code = JSON.parse(err.message).error; } catch (x) { }
      $('haStatus').textContent = T(HA_ERRORS[code] || 'Failed');
    });
  };
  $('haForget').onclick = function () {
    if (confirm(T('Disconnect Home Assistant from the TV?'))) api('ha/clear', { method: 'POST' }).then(function (i) { $('haToken').value = ''; show(i); toast(T('Removed')); });
  };
  /* ---------- Keyboard: sends the whole box after each change, one request at a time ---------- */
  var TYPE_ERRORS = { off: 'Turn on Shore phone keyboard on the TV: Settings › Accessibility.', field: 'Select a text field on the TV first.' };
  var typeTimer = 0, typeBusy = false, typeAgain = null;
  function typeSend(body) {
    if (typeBusy) { typeAgain = body; return; }
    typeBusy = true;
    api('type', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function () { $('typeStatus').textContent = ''; }).catch(function (err) {
      var code = '';
      try { code = JSON.parse(err.message).error; } catch (x) { }
      $('typeStatus').textContent = T(TYPE_ERRORS[code] || 'Failed');
    }).then(function () { var b = typeAgain; typeBusy = false; typeAgain = null; if (b) typeSend(b); });
  }
  $('typeText').oninput = function () { clearTimeout(typeTimer); typeTimer = setTimeout(function () { typeSend({ text: $('typeText').value }); }, 200); };
  $('typeForm').onsubmit = function (e) { e.preventDefault(); clearTimeout(typeTimer); typeSend({ text: $('typeText').value, enter: true }); };
  $('typeClear').onclick = function () { clearTimeout(typeTimer); $('typeText').value = ''; typeSend({ text: '' }); $('typeText').focus(); };
  /* ---------- TV settings and Apps: the same choices as on the TV, published by Shore itself ---------- */
  var model = null, modelText = '', tab = 'photos', pollTimer = 0, openGroups = {}, busy = 0;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function setTab(name) {
    tab = name;
    Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === name)); if (b.getAttribute('data-tab') === name && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }); // narrow phones scroll the tabs
    ['photos', 'tv', 'apps', 'keys', 'addons'].forEach(function (n) { $('tab-' + n).hidden = n !== name; });
    try { sessionStorage.setItem('shore.tab', name); } catch (e) { }
    if (name !== 'photos') refresh();
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.onclick = function () { setTab(b.getAttribute('data-tab')); }; });
  function refresh() {
    clearTimeout(pollTimer);
    if (tab === 'photos' || document.hidden || !key) return;
    api('settings').then(function (m) { var text = JSON.stringify(m); if (!busy && text !== modelText) { modelText = text; model = m; draw(); } }).catch(function () { }).then(function () { pollTimer = setTimeout(refresh, 5000); });
  }
  /* Sends one choice; the TV applies it and publishes the new state, which arrives with the next read. */
  function set(axis, value, note) {
    busy++;
    return api('set?axis=' + encodeURIComponent(axis) + '&value=' + encodeURIComponent(value), { method: 'POST' })
      .then(function () { if (note) toast(note); })
      .catch(function (e) { toast(e.message === 'pair' ? T('Failed') : T('Open Shore on the TV to change its settings from here.')); })
      .then(function () { setTimeout(function () { busy--; refresh(); }, 450); });
  }
  function newsSource() {
    var v = '';
    if (model) model.groups.forEach(function (g) { g.items.forEach(function (it) { if (it.id === 'nsrc') v = it.value; }); });
    return v;
  }
  function thumb(id) { return '/api/thumb/' + encodeURIComponent(id) + '?k=' + encodeURIComponent(key); }
  function control(item) {
    var row = el('div', 'set-row'), head = el('div', 'set-head'), opts;
    head.appendChild(el('span', 'set-name', item.name));
    row.appendChild(head);
    if (item.kind === 'toggle') {
      var sw = el('button', 'switch' + (item.value === 'on' ? ' on' : ''));
      sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', String(item.value === 'on')); sw.setAttribute('aria-label', item.name);
      sw.onclick = function () { var v = item.value === 'on' ? 'off' : 'on'; item.value = v; sw.className = 'switch' + (v === 'on' ? ' on' : ''); sw.setAttribute('aria-checked', String(v === 'on')); set(item.id, v); };
      head.appendChild(sw); row.className += ' is-toggle';
      return row;
    }
    if (item.kind === 'wall') {
      opts = el('div', 'walls');
      item.options.forEach(function (o) {
        var b = el('button', 'wall' + (o.value === item.value ? ' on' : '')), img = el('img');
        b.type = 'button'; b.setAttribute('aria-label', o.label); b.title = o.label;
        img.loading = 'lazy'; img.alt = ''; img.src = thumb(o.value); img.onerror = function () { img.remove(); b.classList.add('no-thumb'); };
        b.appendChild(img); b.appendChild(el('span', '', o.label));
        b.onclick = function () { Array.prototype.forEach.call(opts.children, function (c) { c.classList.remove('on'); }); b.classList.add('on'); item.value = o.value; set('wall', o.value); };
        opts.appendChild(b);
      });
      row.appendChild(opts);
      setTimeout(function () { var on = opts.querySelector('.on'); if (on) opts.scrollLeft = on.offsetLeft - 16; }, 0);
      return row;
    }
    if (item.kind === 'multi') {
      opts = el('div', 'chips is-list');
      item.options.forEach(function (o) {
        var on = item.value.indexOf(o.value) >= 0, b = el('button', 'chip check' + (on ? ' on' : ''), o.label);
        b.type = 'button'; b.setAttribute('aria-pressed', String(on));
        b.onclick = function () {
          var i = item.value.indexOf(o.value);
          if (i >= 0 && item.value.length === 1) return; // at least one source stays
          if (i >= 0) item.value.splice(i, 1); else item.value.push(o.value);
          b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', String(i < 0));
          set('source', o.value);
        };
        opts.appendChild(b);
      });
      row.appendChild(opts);
      return row;
    }
    opts = el('div', 'chips' + (item.kind === 'list' ? ' is-list' : ''));
    item.options.forEach(function (o) {
      var b = el('button', 'chip' + (o.value === item.value ? ' on' : ''), o.label);
      b.type = 'button'; b.setAttribute('aria-pressed', String(o.value === item.value));
      b.onclick = function () {
        if (o.value === item.value) return;
        Array.prototype.forEach.call(opts.children, function (c) { c.classList.remove('on'); c.setAttribute('aria-pressed', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); item.value = o.value; set(item.id, o.value);
      };
      opts.appendChild(b);
    });
    row.appendChild(opts);
    return row;
  }
  /* Backup: the TV's saved preferences as a file on this phone; restoring sends one back for the TV to check and apply. */
  $('backupSave').onclick = function () {
    api('backup').then(function (b) {
      var d = new Date(), name = 'shore-settings-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
      var url = URL.createObjectURL(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' })), a = el('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast(T('Saved'));
    }).catch(function () { toast(T('Open Shore on the TV to change its settings from here.')); });
  };
  $('backupFile').onchange = function () {
    var file = this.files && this.files[0], input = this;
    if (!file) return;
    if (file.size > 512 * 1024) { toast(T('This isn’t a Shore backup.')); input.value = ''; return; }
    file.text().then(function (text) {
      var b;
      try { b = JSON.parse(text); } catch (e) { b = null; }
      if (!b || b.shore !== 'backup' || !b.settings) { toast(T('This isn’t a Shore backup.')); return; }
      if (!confirm(T('Replace the TV’s settings with this backup?'))) return;
      return api('restore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text }).then(function () { toast(T('Restored')); setTimeout(refresh, 1500); });
    }).catch(function () { toast(T('Failed')); }).then(function () { input.value = ''; });
  };
  function draw() {
    var offline = !model || model.offline;
    $('tvOffline').hidden = !offline;
    $('backupCard').hidden = offline;
    var box = $('tvGroups'); box.innerHTML = '';
    if (offline) { $('homeList').innerHTML = ''; $('otherList').innerHTML = ''; return; }
    var start = el('button', 'button primary saver-start', model.labels.start);
    start.type = 'button'; start.onclick = function () { set('action', 'saver', T('Sent')); };
    box.appendChild(start);
    model.groups.forEach(function (g, gi) {
      var d = el('details', 'card group'), sum = el('summary', '', g.name);
      d.open = !!openGroups[g.name] || (gi === 0 && openGroups[g.name] === undefined);
      d.ontoggle = function () { openGroups[g.name] = d.open; };
      d.appendChild(sum);
      g.items.forEach(function (item) { d.appendChild(control(item)); });
      box.appendChild(d);
    });
    $('appsTitle').textContent = model.labels.apps; $('othersTitle').textContent = model.labels.more;
    $('appsCount').textContent = model.home.length + ' / ' + model.cap;
    var home = $('homeList'); home.innerHTML = '';
    model.home.forEach(function (a, i) {
      var li = el('li'), name = el('span', 'app-name', a.name), tools = el('span', 'app-tools');
      [['↑', 'home.up', i === 0], ['↓', 'home.down', i === model.home.length - 1], ['−', 'home.remove', model.home.length <= 1]].forEach(function (t) {
        var b = el('button', 'icon-button', t[0]); b.type = 'button'; b.disabled = t[2]; b.setAttribute('aria-label', t[1].slice(5) + ' ' + a.name);
        b.onclick = function () { set(t[1], a.id); };
        tools.appendChild(b);
      });
      li.appendChild(name); li.appendChild(tools); home.appendChild(li);
    });
    var inputs = $('inputList'), focused = document.activeElement && document.activeElement.getAttribute('data-input');
    $('inputsCard').hidden = !(model.inputs && model.inputs.length); $('inputsTitle').textContent = model.labels.inputs || T('Inputs');
    if (!focused) { // don't redraw under someone typing
      inputs.innerHTML = '';
      (model.inputs || []).forEach(function (a) {
        var li = el('li'), f = el('form', 'inline'), field = el('input'), b = el('button', 'button', T('Save'));
        field.type = 'text'; field.maxLength = 40; field.value = a.name === a.cec ? '' : a.name; field.placeholder = a.cec || a.name; field.setAttribute('data-input', a.id);
        field.setAttribute('aria-label', a.cec || a.name); b.type = 'submit';
        f.onsubmit = function (e) {
          e.preventDefault();
          api('inputname?id=' + encodeURIComponent(a.id) + '&name=' + encodeURIComponent(field.value.trim()), { method: 'POST' }).then(function () { toast(T('Saved')); field.blur(); refresh(); }).catch(function () { toast(T('Failed')); });
        };
        f.appendChild(field); f.appendChild(b); li.appendChild(f); inputs.appendChild(li);
      });
    }
    var others = $('otherList'); others.innerHTML = '';
    model.others.forEach(function (a) {
      var li = el('li'), name = el('span', 'app-name', a.name), b = el('button', 'icon-button', '+');
      b.type = 'button'; b.disabled = model.home.length >= model.cap; b.setAttribute('aria-label', 'add ' + a.name);
      b.onclick = function () { set('home.add', a.id); };
      li.appendChild(name); li.appendChild(b); others.appendChild(li);
    });
  }
  try { var saved = sessionStorage.getItem('shore.tab'); if (saved && $('tab-' + saved)) setTab(saved); } catch (e) { }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { load(); refresh(); } });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(function () { });
  load();
})();
