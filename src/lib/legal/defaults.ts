/**
 * The shop's default legal and information texts.
 *
 * These are seeds, not the source of truth. Every one of them can be copied
 * into `content_entries` from Admin → Seiten & Artikel and edited from there;
 * a published CMS entry with the same slug always wins. What lives here is the
 * text the shop falls back to before anyone has touched the CMS, so a fresh
 * install is never missing an Impressum.
 *
 * Company details are written as `[shortcodes]` and filled at render time from
 * site_settings (falling back to `COMPANY`), so an address change lands in
 * every page at once. Never write a company detail literally into this file.
 */

export interface LegalDefault {
  slug: string;
  /** `legal` gets the sidebar layout at /(legal); `page` renders standalone. */
  kind: "legal" | "page";
  title: string;
  excerpt: string;
  seoDescription: string;
  body: string;
}

// A trailing backslash is a CommonMark hard break. Preferred over two trailing
// spaces, which editors and formatters strip — collapsing an address into one
// run-on line.
const IMPRESSUM = `## Anbieter

[company_name]\\
Online-Shop [trading_name]\\
[street]\\
[postal_code] [city]\\
[country]

## Vertreten durch

Geschäftsführung: [managing_director]

## Kontakt

Telefon: [phone]\\
E-Mail: [email]

## Registereintrag

Registergericht: [register_court]\\
Registernummer: [commercial_register]\\
Sitz der Gesellschaft: [state], [country]

## Umsatzsteuer

Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: [vat_id]

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

[managing_director]\\
[address]

## Verbraucherstreitbeilegung

Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:
<https://ec.europa.eu/consumers/odr>

Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
Verbraucherschlichtungsstelle teilzunehmen.

## Bildnachweise und Produktangaben

Produktabbildungen, technische Daten und Zertifikatsangaben stammen von den jeweiligen
Herstellern und Lieferanten und werden mit deren Zustimmung wiedergegeben. Die Rechte
verbleiben bei den jeweiligen Rechteinhabern.`;

const AGB = `## § 1 Geltungsbereich und Vertragspartner

1. Diese Bedingungen gelten für alle Verträge, die über den Online-Shop [trading_name] zwischen
   [company_name], [address], und dem Kunden geschlossen werden.
2. Verbraucher ist jede natürliche Person, die das Geschäft zu Zwecken abschließt, die überwiegend
   weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden
   können (§ 13 BGB). Unternehmer ist, wer in Ausübung einer gewerblichen oder selbständigen
   beruflichen Tätigkeit handelt (§ 14 BGB).
3. Abweichende Bedingungen des Kunden werden nicht Vertragsbestandteil, es sei denn, wir stimmen
   ihrer Geltung ausdrücklich in Textform zu.

## § 2 Vertragsschluss

1. Die Darstellung der Produkte im Shop ist kein bindendes Angebot, sondern eine Aufforderung zur
   Bestellung.
2. Mit dem Klick auf die Schaltfläche **„Zahlungspflichtig bestellen“** gibt der Kunde ein
   verbindliches Angebot ab. Vor dem Absenden können alle Eingaben über die Korrekturfunktionen im
   Bestellablauf geprüft und geändert werden.
3. Der Eingang der Bestellung wird unverzüglich per E-Mail bestätigt. Diese Eingangsbestätigung
   stellt noch keine Annahme dar. Der Vertrag kommt zustande, sobald wir die Annahme gesondert
   erklären, die Ware versenden oder — bei Vorkasse — den Zahlungsbetrag anfordern.
4. Der Vertragstext wird gespeichert und dem Kunden in Textform zugesandt. Die Vertragssprache ist
   Deutsch.
5. Produkte, die mit **„Auf Anfrage“** statt eines Preises ausgezeichnet sind, können nicht
   unmittelbar bestellt werden. Für sie kommt ein Vertrag erst durch ein gesondertes Angebot und
   dessen Annahme zustande.

## § 3 Preise, Mengenangaben und Grundpreis

1. Alle Preise sind Endpreise in Euro und enthalten die gesetzliche Umsatzsteuer. Versandkosten
   werden im Bestellablauf gesondert ausgewiesen und vor dem Absenden angezeigt.
2. Bei Brennstoffen, die nach Gewicht verkauft werden, wird zusätzlich der Grundpreis je Tonne
   angegeben (§ 4 PAngV). Bei Scheitholz beziehen sich Mengenangaben auf Schüttraummeter (SRM),
   Raummeter (RM) oder Festmeter (FM); die maßgebliche Einheit steht beim Produkt.
3. Bei Holzbrennstoffen sind produktionsbedingte Abweichungen der Liefermenge von bis zu 5 %
   handelsüblich. Restfeuchteangaben beziehen sich auf den Zeitpunkt der Auslieferung; Holz nimmt
   bei unsachgemäßer Lagerung wieder Feuchtigkeit auf.
4. Maßgeblich ist der zum Zeitpunkt der Bestellung angezeigte Preis. Offensichtliche Preisfehler
   berechtigen uns zur Anfechtung nach § 119 BGB.

## § 4 Zahlung

1. Es gelten die im Bestellablauf angebotenen Zahlungsarten; eine Übersicht steht unter
   [Zahlungsarten](/zahlung).
2. Bei Vorkasse per Banküberweisung ist der Betrag innerhalb von zehn Tagen nach Vertragsschluss
   unter Angabe der Zahlungsreferenz zu überweisen. Wir versenden nach vollständigem
   Zahlungseingang.
3. Bei Zahlungsverzug gelten die gesetzlichen Verzugszinsen. Die Geltendmachung eines
   weitergehenden Schadens bleibt vorbehalten.
4. Ein Zurückbehaltungsrecht steht dem Kunden nur zu, soweit es auf demselben Vertragsverhältnis
   beruht. Aufrechnen kann der Kunde nur mit unbestrittenen oder rechtskräftig festgestellten
   Forderungen.

## § 5 Lieferung, Anlieferstelle und Gefahrübergang

1. Es gelten die Bedingungen unter [Versand und Lieferung](/versand). Lieferungen erfolgen nur
   innerhalb der dort genannten Liefergebiete.
2. Brennstoffe auf Paletten und Kaminöfen werden per Spedition geliefert. Die Anlieferung erfolgt
   bis zur ersten verschlossenen Tür beziehungsweise bis zur Bordsteinkante, wenn nicht ausdrücklich
   eine weitergehende Leistung gebucht wurde. Der Kunde stellt sicher, dass die Anlieferstelle mit
   einem LKW von bis zu 40 Tonnen erreichbar ist und dass zum vereinbarten Termin eine
   empfangsberechtigte Person anwesend ist.
3. Verursacht ein vom Kunden zu vertretender Umstand eine erfolglose Anfahrt, trägt der Kunde die
   Kosten der erneuten Zustellung.
4. Beim Verbrauchsgüterkauf geht die Gefahr des zufälligen Untergangs erst mit Übergabe an den
   Kunden über. Gegenüber Unternehmern geht die Gefahr mit Übergabe an den Frachtführer über.
5. Teillieferungen sind zulässig, soweit sie für den Kunden zumutbar sind; zusätzliche Versandkosten
   entstehen dadurch nicht.

## § 6 Widerrufsrecht

1. Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten und Folgen ergeben sich aus
   der [Widerrufsbelehrung](/widerruf). Das [Muster-Widerrufsformular](/widerrufsformular) steht
   bereit, seine Verwendung ist nicht vorgeschrieben.
2. Das Widerrufsrecht besteht nicht bei Waren, die nach Kundenspezifikation gefertigt oder eindeutig
   auf persönliche Bedürfnisse zugeschnitten sind — etwa auf ein gewünschtes Maß zugeschnittenes
   Scheitholz — sowie bei loser Ware, die nach der Lieferung untrennbar mit anderen Gütern vermischt
   wurde, etwa in ein Silo geblasene Pellets (§ 312g Abs. 2 Nr. 1 und Nr. 4 BGB).

## § 7 Eigentumsvorbehalt

Die gelieferte Ware bleibt bis zur vollständigen Bezahlung unser Eigentum. Gegenüber Unternehmern
behalten wir uns das Eigentum bis zum Ausgleich aller Forderungen aus der laufenden
Geschäftsbeziehung vor.

## § 8 Gewährleistung

1. Es gilt das gesetzliche Mängelhaftungsrecht. Für Verbraucher beträgt die Verjährungsfrist bei
   neuen Sachen zwei Jahre ab Ablieferung.
2. Bei gebrauchten Sachen und Ausstellungsstücken beträgt die Verjährungsfrist gegenüber
   Verbrauchern ein Jahr, sofern dies vor Vertragsschluss ausdrücklich und gesondert vereinbart
   wurde. Gegenüber Unternehmern beträgt sie ein Jahr ab Ablieferung.
3. Transportschäden sind bei erkennbaren Schäden gegenüber dem Zusteller zu vermerken und uns
   unverzüglich mitzuteilen. Eine unterlassene Anzeige lässt die gesetzlichen
   Gewährleistungsansprüche des Verbrauchers unberührt, hilft uns aber, unsere Ansprüche gegen den
   Frachtführer zu wahren.
4. Natürliche Eigenschaften von Holz — Farbunterschiede, Risse, Rindenanteile, Verzug — sind kein
   Mangel. Gleiches gilt für Asche- und Feinanteil innerhalb der für die jeweilige Zertifizierung
   zulässigen Grenzwerte.

## § 9 Haftung

1. Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit, bei Verletzung von Leben, Körper
   oder Gesundheit, nach dem Produkthaftungsgesetz und im Umfang einer übernommenen Garantie.
2. Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung einer Pflicht, deren Erfüllung die
   ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der
   Kunde vertrauen darf, begrenzt auf den bei Vertragsschluss vorhersehbaren, vertragstypischen
   Schaden.
3. Für den ordnungsgemäßen Anschluss, die Abnahme durch den zuständigen Bezirksschornsteinfeger und
   den bestimmungsgemäßen Betrieb einer Feuerstätte ist der Kunde verantwortlich. Hinweise dazu
   unter [Montage und Inbetriebnahme](/montage-und-inbetriebnahme).

## § 10 Schlussbestimmungen

1. Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber
   Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht der Schutz zwingender Vorschriften
   des Staates entzogen wird, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.
2. Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches
   Sondervermögen, ist Gerichtsstand der Sitz von [company_name]: [city].
3. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.`;

const WIDERRUF = `## Widerrufsrecht

Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.

Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter
Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Bei einer
Bestellung mehrerer Waren, die getrennt geliefert werden, läuft die Frist ab dem Tag, an dem Sie die
letzte Ware in Besitz genommen haben.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns — [company_name], [address], E-Mail: [email],
Telefon: [phone] — mittels einer eindeutigen Erklärung (zum Beispiel ein mit der Post versandter
Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können
dafür das [Muster-Widerrufsformular](/widerrufsformular) verwenden, das jedoch nicht vorgeschrieben
ist.

Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.

## Folgen des Widerrufs

Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten
haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus
ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste
Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.

Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen
Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in
keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.

Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie
den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere
Zeitpunkt ist.

Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an
dem Sie uns über den Widerruf unterrichten, an uns zurückzusenden oder zu übergeben.

## Rücksendekosten bei Speditionsware

Waren, die nicht paketversandfähig sind — Paletten mit Brennstoffen, Kaminöfen — werden per
Spedition abgeholt. Sie tragen die unmittelbaren Kosten der Rücksendung. Diese Kosten werden auf
höchstens etwa 250 € je Sendung geschätzt; maßgeblich ist der tatsächliche Speditionstarif für Ihre
Anlieferstelle.

Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser auf einen zur Prüfung
der Beschaffenheit, Eigenschaften und Funktionsweise nicht notwendigen Umgang zurückzuführen ist.
Bei Brennstoffen heißt das insbesondere: angebrochene, entleerte oder bereits verfeuerte Gebinde.

## Ausschluss des Widerrufsrechts

Das Widerrufsrecht besteht nicht bei Verträgen über

- Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder
  Bestimmung durch den Verbraucher maßgeblich ist — etwa auf ein Wunschmaß zugeschnittenes
  Scheitholz (§ 312g Abs. 2 Nr. 1 BGB);
- Waren, die nach der Lieferung aufgrund ihrer Beschaffenheit untrennbar mit anderen Gütern
  vermischt wurden — etwa lose in ein Silo eingeblasene Pellets (§ 312g Abs. 2 Nr. 4 BGB).`;

const WIDERRUFSFORMULAR = `Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es
zurück. Die Verwendung ist nicht vorgeschrieben — eine formlose eindeutige Erklärung genügt.

\`\`\`
An:
[company_name]
[address]
E-Mail: [email]

Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag
über den Kauf der folgenden Waren (*) / die Erbringung der folgenden
Dienstleistung (*):

____________________________________________________________________

Bestellt am (*) / erhalten am (*):  __________________________________

Bestellnummer:                      __________________________________

Name des/der Verbraucher(s):        __________________________________

Anschrift des/der Verbraucher(s):   __________________________________

____________________________________________________________________

Unterschrift des/der Verbraucher(s)
(nur bei Mitteilung auf Papier):    __________________________________

Datum:                              __________________________________

(*) Unzutreffendes streichen.
\`\`\`

## Wohin senden

Per E-Mail an [email] oder per Post an [company_name], [address]. Zur Wahrung der Frist genügt die
rechtzeitige Absendung.

Voraussetzungen, Fristen und Folgen des Widerrufs stehen in der
[Widerrufsbelehrung](/widerruf). Bitte beachten Sie die dort genannten Ausnahmen für
zugeschnittenes Scheitholz und lose eingeblasene Pellets.`;

const DATENSCHUTZ = `## Verantwortlicher

[company_name]\\
[address]\\
E-Mail: [email]

Ein Datenschutzbeauftragter ist nicht bestellt; eine Bestellpflicht nach § 38 BDSG besteht erst ab
20 ständig mit automatisierter Verarbeitung beschäftigten Personen. Anfragen richten Sie bitte an
die oben genannte Adresse.

## Verarbeitungen im Einzelnen

**Aufruf der Website.** Beim Abruf werden IP-Adresse, Zeitpunkt, aufgerufene Seite, Referrer und
Browserkennung in Server-Logs verarbeitet. Rechtsgrundlage ist unser berechtigtes Interesse an
Betrieb und Sicherheit (Art. 6 Abs. 1 lit. f DSGVO). Löschung nach spätestens 30 Tagen.

**Bestellung und Vertragsabwicklung.** Name, Anschrift, E-Mail, Telefonnummer, Bestell- und
Zahlungsdaten verarbeiten wir zur Erfüllung des Kaufvertrags (Art. 6 Abs. 1 lit. b DSGVO). Die
Telefonnummer geben wir an die Spedition weiter, weil eine Palettenlieferung ohne telefonische
Avisierung nicht zustellbar ist.

**Kundenkonto.** Freiwillig. Ermöglicht Bestellübersicht, Rechnungsabruf und Merkliste
(Art. 6 Abs. 1 lit. b DSGVO). Sie können das Konto jederzeit löschen lassen; steuerlich
aufbewahrungspflichtige Belege bleiben davon unberührt.

**Liefergebietsprüfung.** Die eingegebene Postleitzahl wird gegen ein lokales Verzeichnis geprüft,
um Zone und Versandkosten zu bestimmen, und im Browser gespeichert.

**Newsletter.** Nur nach ausdrücklicher Einwilligung im Double-Opt-in-Verfahren
(Art. 6 Abs. 1 lit. a DSGVO). Widerruf jederzeit über den Abmeldelink, mit Wirkung für die Zukunft.

**Rechnungen und Buchhaltung.** Rechnungs- und Bestelldaten bewahren wir aufgrund handels- und
steuerrechtlicher Pflichten auf (Art. 6 Abs. 1 lit. c DSGVO, §§ 147 AO, 257 HGB): zehn Jahre für
Rechnungen, sechs Jahre für Handelsbriefe.

## Empfänger und Auftragsverarbeiter

Mit allen Dienstleistern, die personenbezogene Daten in unserem Auftrag verarbeiten, bestehen
Verträge nach Art. 28 DSGVO.

| Dienst | Zweck | Daten |
| --- | --- | --- |
| Supabase | Datenbank, Authentifizierung, Dateispeicher | Konto-, Bestell-, Rechnungs- und Adressdaten |
| Cloudinary / ImageKit | Ausliefern und Umrechnen der Produktbilder | IP-Adresse, Browserkennung beim Bildabruf |
| Resend | Versand von Bestell-, Versand- und Rechnungs-E-Mails | E-Mail-Adresse, Name, Bestellinhalt |
| Telegram | Interne Benachrichtigung über neue Bestellungen | Bestellnummer und Status |
| Speditionen und Paketdienste | Zustellung und telefonische Avisierung | Name, Lieferanschrift, Telefonnummer |
| Zahlungsdienstleister | Abwicklung der gewählten Zahlungsart | Zahlungsdaten, Betrag, Referenz |

Soweit dabei Daten in ein Drittland außerhalb der EU übermittelt werden, stützen wir die
Übermittlung auf einen Angemessenheitsbeschluss oder auf Standardvertragsklauseln nach
Art. 46 Abs. 2 lit. c DSGVO.

## Cookies und Speicherung im Endgerät

Wir setzen ausschließlich technisch notwendige Speicherung ein: Sitzung des Kundenkontos,
Warenkorb, Merkliste und Postleitzahl. Diese Speicherung ist nach § 25 Abs. 2 Nr. 2 TDDDG
einwilligungsfrei. Analyse- oder Marketing-Tracking findet nicht statt. Einzelheiten und eine
Löschmöglichkeit unter [Cookie-Einstellungen](/cookie-einstellungen).

## Ihre Rechte

Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17),
Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch gegen
Verarbeitungen auf Grundlage eines berechtigten Interesses (Art. 21) sowie auf Widerruf erteilter
Einwilligungen mit Wirkung für die Zukunft (Art. 7 Abs. 3).

Außerdem können Sie sich bei einer Aufsichtsbehörde beschweren (Art. 77 DSGVO). Für [company_name]
mit Sitz in [state] ist das die Landesbeauftragte für Datenschutz und Informationsfreiheit
Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf.

## Pflicht zur Bereitstellung

Die für Vertragsschluss und Lieferung erforderlichen Angaben sind verpflichtend — ohne sie können
wir den Vertrag nicht erfüllen. Alle übrigen Angaben sind freiwillig.`;

const BARRIEREFREIHEIT = `[company_name] ist bemüht, [trading_name] für alle Nutzerinnen und Nutzer bedienbar zu halten.
Grundlage sind das Barrierefreiheitsstärkungsgesetz (BFSG), die BFSGV und die harmonisierte Norm
EN 301 549, die für Webangebote auf WCAG 2.1 Stufe AA verweist.

## Angestrebter Stand

Wir entwickeln gegen **WCAG 2.2 Stufe AA** — eine Stufe über der gesetzlich geforderten Fassung.
Konkret bedeutet das:

- jede Funktion ist ohne Maus mit der Tastatur erreichbar, mit sichtbarem Fokusrahmen;
- Text erfüllt mindestens 4,5:1 Kontrast, große Schrift und Bedienelemente 3:1;
- Bedienflächen sind mindestens 24 × 24 CSS-Pixel groß, auf Mobilgeräten größer;
- Formularfelder haben dauerhaft sichtbare Beschriftungen und benannte Fehler;
- Statusänderungen werden Screenreadern angesagt;
- Animationen respektieren die Systemeinstellung \`prefers-reduced-motion\`;
- die Seiten funktionieren bis 400 % Zoom ohne horizontales Scrollen.

## Bekannte Einschränkungen

Produktbilder, technische Datenblätter und PDF-Dokumente stammen von Herstellern und Lieferanten.
Auf deren Barrierefreiheit haben wir keinen Einfluss; insbesondere sind nicht alle PDF-Prospekte
getaggt. Benötigen Sie eine Information aus einem solchen Dokument in zugänglicher Form, fordern Sie
sie bitte an — wir stellen sie als Text bereit.

Diese Erklärung beschreibt den angestrebten und laufend geprüften Stand. Eine abgeschlossene externe
Konformitätsprüfung liegt noch nicht vor.

## Barrieren melden

Ist Ihnen etwas nicht zugänglich, schreiben Sie an [email] oder an [company_name], [address].
Bitte nennen Sie die Seite, das Problem und Ihre Hilfsmittel. Wir antworten so schnell wie möglich
und nennen dabei einen Termin für die Behebung.

## Marktüberwachung

Führt unsere Antwort nicht weiter, können Sie sich an die Marktüberwachungsstelle der Länder für die
Barrierefreiheit von Produkten und Dienstleistungen (MLBF) wenden, Bundesallee 100,
38116 Braunschweig.`;

const MONTAGE = `Ein Kaminofen ist eine Feuerstätte. Ob und wie er bei Ihnen betrieben werden darf, entscheidet
nicht der Shop, sondern die zuständige Bezirksschornsteinfegerin oder der zuständige
Bezirksschornsteinfeger. Diese Seite fasst zusammen, was vor und nach der Lieferung zu tun ist.

## Vor der Bestellung

1. **Schornstein prüfen lassen.** Querschnitt, Höhe und Zug müssen zum Ofen passen. Der
   Bezirksschornsteinfeger sagt Ihnen, welche Nennwärmeleistung Ihr Schornstein trägt und ob eine
   Mehrfachbelegung zulässig ist.
2. **Verbrennungsluft klären.** In dichten Gebäuden mit kontrollierter Wohnraumlüftung ist in der
   Regel ein raumluftunabhängiger Ofen mit externer Luftzufuhr erforderlich.
3. **Aufstellort messen.** Sicherheitsabstände zu brennbaren Bauteilen, Bodenbelastbarkeit und die
   Größe der Bodenplatte vor der Feuerraumöffnung stehen im Datenblatt des jeweiligen Ofens.

## Nach der Lieferung

1. **Anschluss** durch einen Fachbetrieb, entsprechend der Montageanleitung des Herstellers.
2. **Abnahme** durch den Bezirksschornsteinfeger. Erst danach darf der Ofen in Betrieb gehen.
   Halten Sie die Konformitätserklärung und das Datenblatt bereit — beides liegt dem Ofen bei.
3. **Erstes Anheizen** nach Herstellerangabe. Geruchsbildung beim Einbrennen der Lackierung ist
   normal; lüften Sie gut.

## Rechtlicher Rahmen

Alle von uns angebotenen Öfen erfüllen die Grenzwerte der 1. BImSchV Stufe 2 und die
Ökodesign-Anforderungen (EU) 2015/1185, die seit dem 1. Januar 2022 gelten. Die konkreten Emissions-
und Wirkungsgradwerte stehen bei jedem Produkt.

Für Anschluss, Abnahme und bestimmungsgemäßen Betrieb ist der Betreiber verantwortlich.
Wir liefern das Gerät und die Unterlagen; eine Montageleistung ist im Kaufpreis nicht enthalten.

## Fragen

Wenn Sie unsicher sind, ob ein bestimmter Ofen zu Ihrem Schornstein passt, schreiben Sie uns vor der
Bestellung über die [Kontaktseite](/kontakt) — mit Baujahr des Hauses, Schornsteinquerschnitt und
gewünschter Leistung. Verbindlich ist am Ende immer die Aussage Ihres Bezirksschornsteinfegers.`;

const KONTAKT = `## So erreichen Sie uns

**E-Mail:** [email]\\
**Support:** [support_email]\\
**Telefon:** [phone]\\
**Erreichbarkeit:** [support_hours]

**Postanschrift**\\
[company_name]\\
[address]

## Was wir schnell beantworten können

- Welche Menge und welcher Grundpreis hinter einem Produkt stehen
- Ob wir an Ihre Postleitzahl liefern und was der Versand kostet — schneller geht die
  [Liefergebietsprüfung](/liefergebiet)
- Ob ein Ofen zu Ihrem Schornstein passt, siehe
  [Montage und Inbetriebnahme](/montage-und-inbetriebnahme)
- Status einer laufenden Bestellung — am schnellsten über
  [Bestellung verfolgen](/bestellung/verfolgen)

## Bestellung, Widerruf, Reklamation

Für einen Widerruf nutzen Sie bitte das [Muster-Widerrufsformular](/widerrufsformular) oder eine
formlose Erklärung an [email]. Nennen Sie in jedem Fall Ihre Bestellnummer — damit ist der Vorgang
sofort zuzuordnen.

Bei einem Transportschaden vermerken Sie diesen bitte direkt auf dem Ablieferbeleg der Spedition und
schicken uns Fotos. Das hilft uns, den Schaden gegenüber dem Frachtführer geltend zu machen; Ihre
gesetzlichen Gewährleistungsrechte bestehen unabhängig davon.

## Rechtliches

Die vollständige Anbieterkennzeichnung steht im [Impressum](/impressum).`;

const VERSAND = `## Liefergebiet

Wir liefern an jede der [postcode_count] deutschen Postleitzahlen. Ihre Adresse wird im Warenkorb
und an der Kasse gegen das Postleitzahlenverzeichnis geprüft; Lieferungen ins Ausland sind derzeit
nicht möglich.

Deutsche Inseln ohne Straßenanbindung — unter anderem Sylt, Föhr, Amrum, Helgoland, die
Ostfriesischen Inseln und Hiddensee — werden per Fähre oder Autozug beliefert. Rügen, Usedom,
Fehmarn und Poel sind über Brücke oder Damm angebunden und gelten als Festland.

## Lieferfristen

Die Lieferfrist steht bei jedem Produkt und gilt ab Zahlungseingang. Ist bei einem Produkt keine
Frist angegeben, liefern wir unverzüglich, spätestens jedoch innerhalb von 30 Tagen nach
Vertragsschluss (§ 271 BGB).

Speditionssendungen werden vor der Zustellung telefonisch avisiert, um einen Termin abzustimmen.
Halten Sie die bei der Bestellung angegebene Telefonnummer bitte erreichbar — ohne Avis kann die
Spedition nicht zustellen.

## Ablade- und Zufahrtsbedingungen

Die Lieferung erfolgt bis zur Bordsteinkante. Der Kunde stellt eine befahrbare Zufahrt für einen
LKW von bis zu 40 Tonnen sowie eine Ablademöglichkeit sicher. Abweichungen — Kran, Silobefüllung,
Palettenhub — sind vorab zu vereinbaren.

## Versandkosten

Pauschale je Bestellung, nicht je Position: eine Bestellung ist eine Sendung und zahlt den höchsten
enthaltenen Satz einmal.

| Versandart | Kosten |
| --- | --- |
| Paketversand (Zubehör, Anzündholz) | [shipping_parcel] |
| Speditionsversand Palette, frei Bordsteinkante (Brennholz, Pellets, Briketts, Kohle) | [shipping_freight] |
| Speditionsversand mit Hebebühne (Kaminöfen) | [shipping_bulky] |
| Inselzuschlag für Speditionssendungen (Pakete ohne Zuschlag) | [island_surcharge] |

Ab einem Bestellwert von **[free_shipping_from]** liefern wir versandkostenfrei bis zur Haustür —
Inselzuschlag eingeschlossen.`;

const ZAHLUNG = `Welche Zahlungsarten tatsächlich zur Auswahl stehen, sehen Sie im Bestellablauf. Freigeschaltet
werden sie unter Admin → Zahlungen; die folgenden Angaben beschreiben die Konditionen.

## Vorkasse per Banküberweisung

Sie erhalten Bankverbindung und Zahlungsreferenz mit der Bestellbestätigung. Wir versenden nach
vollständigem Zahlungseingang.

**Kontoinhaber:** [bank_account_holder]\\
**Bank:** [bank_name]\\
**IBAN:** [bank_iban]\\
**BIC:** [bank_bic]

Bitte geben Sie die Zahlungsreferenz an — ohne sie lässt sich Ihre Zahlung nicht zuordnen und die
Lieferung verzögert sich.

## Kartenzahlung

Die Kartendaten werden direkt im Browser an den Zahlungsdienstleister übertragen und erreichen
unsere Server nicht. Es gilt die starke Kundenauthentifizierung (3-D Secure) nach § 55 ZAG.

## Fälligkeit und Verzug

Bei Vorkasse ist der Betrag innerhalb von zehn Tagen nach Vertragsschluss zu überweisen. Bei
Kartenzahlung wird der Betrag mit Abschluss der Bestellung belastet. Bei Zahlungsverzug gelten die
gesetzlichen Verzugszinsen nach § 288 BGB.

## Sicherheit

[trading_name] speichert weder Kartennummern noch Prüfziffern oder PINs. Welche Daten die
Zahlungsdienstleister verarbeiten, steht in der [Datenschutzerklärung](/datenschutz).`;

const UEBER_UNS = `[trading_name] ist der Online-Shop der [company_name] aus [state]. Wir verkaufen Brennholz,
Stammholz, Holzpellets, Holzbriketts, Anzündholz und Kohle sowie geprüfte Kaminöfen — an alle
[postcode_count] Postleitzahlen in Deutschland.

## Warum es uns gibt

Brennstoffpreise sind schwer zu vergleichen, weil fast jeder Anbieter eine andere Bezugsgröße nennt.
Ein Sack, eine Palette, ein Schüttraummeter, eine Tonne — dieselbe Ware, vier Zahlen, keine davon
direkt gegen die andere zu halten. Wer heizen will, rechnet also erst einmal um, oder kauft im
Zweifel zu teuer.

Wir haben den Shop um diese eine Sache herum gebaut: neben jedem Preis steht, welche Menge er
abdeckt und was die Tonne kostet. Das ist zugleich Pflicht nach § 4 PAngV und der schnellste Weg,
ein überteuertes Angebot zu erkennen — auch unser eigenes.

Dasselbe gilt für die technischen Angaben. Wir übernehmen sie aus den Datenblättern der Hersteller
und kennzeichnen die Quelle. Wo eine Angabe fehlt, bleibt das Feld leer, statt mit einem plausiblen
Wert gefüllt zu werden.

## Woran wir uns halten

**Mengen, die vergleichbar sind.** Jeder Brennstoff trägt die Menge, die der Preis abdeckt, und den
Grundpreis je Tonne. Eine Palette und ein Einzelsack lassen sich damit direkt vergleichen.

**Angaben aus der Quelle, nicht aus dem Marketing.** Heizwert, Restfeuchte, Ascheanteil,
Wirkungsgrad und Zertifizierung stammen aus den Unterlagen der Hersteller. Was ein Lieferant nicht
erklärt hat, schreiben wir nicht hin.

**Lieferkosten vor der Bestellung.** Die Postleitzahl bestimmt Zone und Preis, bevor Sie in die
Kasse gehen. Ab [free_shipping_from] liefern wir versandkostenfrei, Inselzuschlag eingeschlossen.

**Sortiment aus einer Hand.** Scheitholz, Stammholz, Pellets, Briketts, Anzündholz, Kohle und die
Öfen dazu. Wer den Ofen bei uns kauft, findet den passenden Brennstoff im selben Warenkorb.

## Das Unternehmen

| | |
| --- | --- |
| Firma | [company_name] |
| Sitz | [postal_code] [city], [state] |
| Registergericht | [register_court] |
| Handelsregister | [commercial_register] |
| Geschäftsführung | [managing_director] |

Vollständige Anbieterkennzeichnung im [Impressum](/impressum). Fragen zum Sortiment beantworten wir
über die [Kontaktseite](/kontakt).`;

export const LEGAL_DEFAULTS: LegalDefault[] = [
  {
    slug: "impressum",
    kind: "legal",
    title: "Impressum",
    excerpt: "Angaben gemäß § 5 DDG.",
    seoDescription: "Anbieterkennzeichnung nach § 5 DDG.",
    body: IMPRESSUM,
  },
  {
    slug: "agb",
    kind: "legal",
    title: "Allgemeine Geschäftsbedingungen",
    excerpt: "Für alle Bestellungen über [trading_name], betrieben von [company_name].",
    seoDescription: "Geltende Vertragsbedingungen für Bestellungen.",
    body: AGB,
  },
  {
    slug: "datenschutz",
    kind: "legal",
    title: "Datenschutzerklärung",
    excerpt: "Informationen gemäß Art. 13 und 14 DSGVO.",
    seoDescription: "Informationen zur Verarbeitung personenbezogener Daten nach DSGVO.",
    body: DATENSCHUTZ,
  },
  {
    slug: "widerruf",
    kind: "legal",
    title: "Widerrufsbelehrung",
    excerpt: "Für Verbraucher. Muster nach Anlage 1 zu Artikel 246a § 1 Abs. 2 Satz 2 EGBGB.",
    seoDescription: "Ihr Widerrufsrecht als Verbraucher:in.",
    body: WIDERRUF,
  },
  {
    slug: "widerrufsformular",
    kind: "legal",
    title: "Muster-Widerrufsformular",
    excerpt: "Nach Anlage 2 zu Artikel 246a § 1 Abs. 2 Satz 1 Nr. 1 EGBGB.",
    seoDescription: "Formular zur Ausübung des Widerrufsrechts.",
    body: WIDERRUFSFORMULAR,
  },
  {
    slug: "barrierefreiheit",
    kind: "legal",
    title: "Erklärung zur Barrierefreiheit",
    excerpt: "Stand der Barrierefreiheit dieses Shops nach BFSG und EN 301 549.",
    seoDescription: "Barrierefreiheitserklärung nach BFSG.",
    body: BARRIEREFREIHEIT,
  },
  {
    slug: "versand",
    kind: "legal",
    title: "Versand und Lieferung",
    excerpt: "Lieferzonen, Fristen, Abladebedingungen und Kosten.",
    seoDescription: "Lieferbedingungen, Zonen, Fristen und Kosten.",
    body: VERSAND,
  },
  {
    slug: "zahlung",
    kind: "legal",
    title: "Zahlungsarten",
    excerpt: "Konditionen der angebotenen Zahlungsmethoden.",
    seoDescription: "Übersicht der akzeptierten Zahlungsmethoden.",
    body: ZAHLUNG,
  },
  {
    slug: "ueber-uns",
    kind: "page",
    title: "Über uns",
    excerpt: "Wer hinter [trading_name] steht und woran wir uns halten.",
    seoDescription: "Das Unternehmen hinter dem Shop, Sortiment und Grundsätze.",
    body: UEBER_UNS,
  },
  {
    slug: "kontakt",
    kind: "page",
    title: "Kontakt",
    excerpt: "Wie Sie uns erreichen und was wir schnell beantworten können.",
    seoDescription: "Kontaktmöglichkeiten und Zuständigkeiten.",
    body: KONTAKT,
  },
  {
    slug: "montage-und-inbetriebnahme",
    kind: "page",
    title: "Montage und Inbetriebnahme",
    excerpt: "Was vor und nach der Lieferung eines Kaminofens zu tun ist.",
    seoDescription: "Schornsteinprüfung, Anschluss und Abnahme eines Kaminofens.",
    body: MONTAGE,
  },
];

export function legalDefaultFor(slug: string): LegalDefault | null {
  return LEGAL_DEFAULTS.find((entry) => entry.slug === slug) ?? null;
}
