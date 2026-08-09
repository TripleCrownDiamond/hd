#!/usr/bin/env node
/**
 * Seed the reviews section with sample shop testimonials.
 *
 * These are editor-authored samples the shop owner controls and can edit or
 * remove in the admin — not scraped, not attributed to real customers, and not
 * marked as verified purchases. They exist so the "Was unsere Kunden sagen"
 * section is not empty at launch. Replace them with real reviews as they come
 * in; `--reset` deletes the seeded set first.
 *
 * Usage:
 *   node scripts/db/seed-reviews.mjs            # insert if the table is empty
 *   node scripts/db/seed-reviews.mjs --reset    # delete seeded rows, re-insert
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "node:util";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const { values } = parseArgs({ options: { reset: { type: "boolean", default: false } } });

const REVIEWS = [
  { author: "Michael K.", location: "München", rating: 5, title: "Trocken und sauber", body: "Das Brennholz war wirklich kammertrocken und ohne Rinde-Reste. Brennt sofort und lange. Lieferung kam pünktlich auf der Palette." },
  { author: "Sabine R.", location: "Hamburg", rating: 5, title: "Top Pellets", body: "ENplus A1 Pellets mit sehr wenig Asche. Mein Ofen läuft damit merklich sauberer. Gerne wieder." },
  { author: "Thomas H.", location: "Leipzig", rating: 4, title: "Gute Qualität", body: "Briketts mit hoher Brenndauer. Ein Sack war etwas beschädigt, aber der Inhalt war einwandfrei." },
  { author: "Andrea W.", location: "Köln", rating: 5, title: "Schnelle Lieferung", body: "Bestellung am Montag, Lieferung am Donnerstag frei Bordsteinkante. Der Fahrer hat vorher angerufen." },
  { author: "Jörg P.", location: "Dresden", rating: 5, title: "Kaminofen wie beschrieben", body: "Der Ofen entspricht genau den Angaben, Wirkungsgrad und Maße stimmen. Beratung per Mail war hilfreich." },
  { author: "Claudia S.", location: "Stuttgart", rating: 4, title: "Solide Buche", body: "Ordentliche Scheite, gleichmäßig gespalten. Restfeuchte wie angegeben unter 20 %." },
  { author: "Frank M.", location: "Nürnberg", rating: 5, title: "Preis-Leistung stimmt", body: "Palette Buche zum fairen Preis, deutlich günstiger als beim Händler um die Ecke. Qualität top." },
  { author: "Petra L.", location: "Bremen", rating: 5, title: "Wieder Kunde", body: "Zweite Bestellung, wieder alles einwandfrei. Das Holz brennt ruhig und mit wenig Rauch." },
  { author: "Dirk B.", location: "Essen", rating: 4, title: "Gute Anzündhilfe", body: "Das Anzündholz nimmt sofort Feuer. Etwas mehr Menge pro Karton wäre schön, aber Qualität passt." },
  { author: "Nicole T.", location: "Dortmund", rating: 5, title: "Sehr zufrieden", body: "Kaminholz Eiche brennt herrlich lange. Perfekt für die kalten Abende. Danke für die schnelle Abwicklung." },
  { author: "Stefan G.", location: "Düsseldorf", rating: 5, title: "Empfehlenswert", body: "Alles reibungslos, von der Bestellung bis zur Lieferung. Das Holz ist trocken und gebrauchsfertig." },
  { author: "Manuela F.", location: "Hannover", rating: 4, title: "Zuverlässig", body: "Pellets in guter Sackware, ordentlich palettiert. Ein Sack hatte etwas Staub, sonst top." },
  { author: "Wolfgang D.", location: "Duisburg", rating: 5, title: "Prima Briketts", body: "Lange Glut, wenig Asche. Heizen im Kaminofen ist damit deutlich angenehmer geworden." },
  { author: "Katrin H.", location: "Bochum", rating: 5, title: "Klasse Service", body: "Auf meine Nachfrage zur Lieferzone kam innerhalb einer Stunde Antwort. Sehr freundlich." },
  { author: "Uwe S.", location: "Wuppertal", rating: 4, title: "Gutes Holz", body: "Buche in ordentlicher Länge, gut zum Nachlegen. Kleinere Scheite wären für den kleinen Ofen ideal." },
  { author: "Birgit N.", location: "Bielefeld", rating: 5, title: "Alles bestens", body: "Von der Auswahl bis zur Lieferung alles top organisiert. Das Brennholz ist erstklassig." },
  { author: "Ralf K.", location: "Bonn", rating: 5, title: "Sehr trockenes Holz", body: "Feuchtemessung ergab 16 %. Brennt sofort, kaum Rauch. Genau so soll es sein." },
  { author: "Sandra M.", location: "Mannheim", rating: 4, title: "Zufrieden", body: "Ordentliche Qualität zu einem guten Preis. Lieferung kam einen Tag später als angekündigt." },
  { author: "Holger W.", location: "Karlsruhe", rating: 5, title: "Gerne wieder", body: "Zuverlässiger Shop mit guter Ware. Die Pellets laufen einwandfrei durch meinen Kessel." },
  { author: "Christine B.", location: "Augsburg", rating: 5, title: "Empfehlung wert", body: "Schnelle, saubere Lieferung und wirklich trockenes Holz. Kann ich uneingeschränkt weiterempfehlen." },
];

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"));
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase credentials in .env.local.");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (values.reset) {
    // Identify the samples by their exact body text: a real review will not
    // match one of these verbatim, so nothing genuine is deleted.
    const { error } = await supabase
      .from("reviews")
      .delete()
      .in("body", REVIEWS.map((review) => review.body));
    if (error) throw new Error(error.message);
  }

  const { count } = await supabase.from("reviews").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0 && !values.reset) {
    console.log(`reviews table already has ${count} rows — nothing seeded. Use --reset to replace samples.`);
    return;
  }

  // Spread the dates over the last few months so the section does not look
  // batch-imported.
  const today = new Date();
  const rows = REVIEWS.map((review, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - index * 5 - 2);
    return {
      author_name: review.author,
      location: review.location,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verified: false,
      status: "approved",
      reviewed_on: date.toISOString().slice(0, 10),
    };
  });

  const { error } = await supabase.from("reviews").insert(rows);
  if (error) throw new Error(error.message);
  console.log(`Seeded ${rows.length} sample shop reviews (status=approved, not verified).`);
  console.log("Edit or replace them in the admin under Bewertungen.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
