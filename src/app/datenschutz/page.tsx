import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Zurück
      </Link>
      <Card className="mt-4">
        <CardTitle>Datenschutzhinweis</CardTitle>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground">
          <p className="rounded-md border border-warning/30 bg-warning-soft px-4 py-3 text-warning">
            Hinweis: Dieser Text beschreibt, welche Daten die Anwendung technisch verarbeitet. Er
            ersetzt keine rechtliche Prüfung. Verantwortlicher, Kontaktdaten, Rechtsgrundlagen und
            Auftragsverarbeitungsverträge sind vom Betreiber zu ergänzen, bevor die Plattform
            produktiv mit echten Nutzerdaten betrieben wird.
          </p>

          <section>
            <h3 className="font-semibold">Verantwortlicher</h3>
            <p>[Name, Anschrift und Kontaktdaten des Betreibers hier ergänzen]</p>
          </section>

          <section>
            <h3 className="font-semibold">Welche Daten werden gespeichert?</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Kontodaten: Benutzername, optionale E-Mail-Adresse, Passwort-Hash, Rolle, Status.</li>
              <li>Lernfortschritt: bearbeitete Fragen, Selbsteinschätzung, Lesezeichen, Wiederholungstermine.</li>
              <li>Prüfungssimulationen: eingegebene Antworten und Zeitpunkt der Bearbeitung.</li>
              <li>Technische Protokolle: Sitzungs-Token (gehasht gespeichert), IP-Adresse und Browser-Kennung zum Zeitpunkt der Anmeldung (zur Absicherung gegen Missbrauch).</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold">Spracherkennung (Mikrofon-Funktion)</h3>
            <p>
              Wenn Sie die Mikrofon-Funktion nutzen, verarbeitet die vom Browser bereitgestellte
              Spracherkennung (z. B. in Chrome) die Audiodaten über die Server des jeweiligen
              Browser-Anbieters, um sie in Text umzuwandeln. Die Anwendung selbst speichert keine
              Audioaufnahmen, nur den editierbaren Text, den Sie absenden. Die Nutzung des
              Mikrofons ist optional; die Texteingabe über die Tastatur steht immer zur Verfügung.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Keine öffentliche Einsicht</h3>
            <p>
              Lernfortschritt und Prüfungsantworten einzelner Nutzer sind ausschließlich für den
              jeweiligen Nutzer und für Administratoren (in aggregierter Form) sichtbar.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Ihre Rechte</h3>
            <p>
              Sie können Ihre gespeicherten Daten unter „Konto&nbsp;→&nbsp;Meine Daten
              exportieren&quot; als Datei herunterladen und Ihr Konto samt Lerndaten unter
              „Konto&nbsp;→&nbsp;Konto löschen&quot; selbst entfernen.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
