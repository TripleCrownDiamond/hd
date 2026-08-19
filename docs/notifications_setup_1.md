# E-Mail (Resend) und Telegram einrichten

Bestellbestätigungen, Händler-Benachrichtigungen und Status-Updates laufen über
**Resend** (E-Mail) und einen **Telegram-Bot**. Beide Kanäle sind optional und
best-effort: Fehlt ein Schlüssel, wird der Kanal übersprungen — eine Bestellung
geht trotzdem durch. Alle Werte gehören in `.env.local` (nicht committen).

## Resend (E-Mail)

1. Konto auf <https://resend.com> anlegen.
2. **Domain verifizieren**: Dashboard → *Domains* → *Add Domain*, die
   angezeigten DNS-Einträge (SPF, DKIM, `MX`) bei Ihrem DNS-Anbieter setzen.
   Ohne verifizierte Domain darf Resend nur an die eigene Konto-Adresse senden.
3. **API-Key erzeugen**: Dashboard → *API Keys* → *Create* (Berechtigung
   *Sending access* genügt). Der Key wird nur einmal angezeigt.

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx      # geheim, nur Server
RESEND_FROM_EMAIL="HOLZKRAFT <bestellung@ihre-domain.de>"  # Adresse auf der verifizierten Domain
RESEND_REPLY_TO=support@ihre-domain.de      # optional
RESEND_ADMIN_EMAIL=bestellungen@ihre-domain.de  # Kopie jeder Bestellung an den Shop
```

`RESEND_FROM_EMAIL` **muss** auf der in Schritt 2 verifizierten Domain liegen,
sonst lehnt Resend den Versand ab.

## Telegram (Bot-Benachrichtigung)

1. In Telegram **@BotFather** öffnen → `/newbot` → Namen und Benutzernamen
   vergeben. BotFather antwortet mit dem **Token**
   (`123456789:AAE…`).
2. **Chat-ID ermitteln**: dem neuen Bot eine Nachricht schreiben (oder ihn in
   eine Gruppe einladen), dann aufrufen:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`.
   In der Antwort steht `"chat":{"id":...}` — das ist die Chat-ID (für Gruppen
   negativ, z. B. `-1001234567890`).

```bash
TELEGRAM_BOT_TOKEN=123456789:AAE...          # geheim, nur Server
TELEGRAM_ADMIN_CHAT_ID=123456789             # Ziel-Chat für Bestellungen
```

## Testen

Nach dem Setzen der Variablen den Dev-Server neu starten (Env wird beim Start
gelesen) und eine Testbestellung an der Kasse auslösen. Erwartet:

- Kunde: **Bestellbestätigung** per E-Mail.
- Shop: **E-Mail** an `RESEND_ADMIN_EMAIL` **und** eine **Telegram-Nachricht**.
- Bei Statusänderung im Admin (bezahlt, versandt …): **Status-E-Mail** an den
  Kunden und eine Telegram-Nachricht.

Ist etwas nicht konfiguriert, erscheint im Server-Log ein Hinweis, aber die
Bestellung wird normal angelegt.

## Zahlungsanbieter (separat)

- **Karte (Stripe/Mollie/Adyen)**: im Admin unter *Zahlungen* den Publishable
  Key hinterlegen; der Secret Key gehört in die Server-Umgebung
  (`STRIPE_SECRET_KEY`). Erst dann wird die Kartenzahlung aktiv.
- **Krypto (BTCPay/Coinbase/Bitpay)**: Anbieter-URL und API-Schlüssel des
  Anbieters in der Server-Umgebung; im Admin die akzeptierten Währungen wählen.
