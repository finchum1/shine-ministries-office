import type { VerseContent, FounderContent, ContactContent, FooterContent } from "@/lib/supabase-types";
import { updateSiteContent } from "./actions";

const inputClass =
  "w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-clay-900/8 pb-8 last:border-b-0 last:pb-0">
      <h2 className="font-display text-lg text-clay-900">{title}</h2>
      {hint && <p className="mt-1 text-sm text-clay-700">{hint}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ContentForm({
  verse,
  verses,
  founder,
  contact,
  footer,
}: {
  verse: VerseContent;
  verses: VerseContent[];
  founder: FounderContent;
  contact: ContactContent;
  footer: FooterContent;
}) {
  const [v1, v2, v3] = [verses[0], verses[1], verses[2]];

  return (
    <form action={updateSiteContent} className="space-y-8">
      <Section title="Verse callout" hint="Shown on the homepage, above the upcoming events.">
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Verse text</span>
          <textarea
            name="verse_text"
            rows={2}
            defaultValue={verse.text}
            className={`${inputClass} resize-none`}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Reference</span>
          <input name="verse_reference" defaultValue={verse.reference} className={inputClass} />
        </label>
      </Section>

      <Section
        title="Words We Hold Onto"
        hint="The three verse cards on the About page — fill in all three."
      >
        {[v1, v2, v3].map((v, i) => (
          <div key={i} className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-clay-700">
                Verse {i + 1} text
              </span>
              <textarea
                name={`verse${i + 1}_text`}
                rows={2}
                defaultValue={v?.text ?? ""}
                className={`${inputClass} resize-none`}
              />
            </label>
            <label>
              <span className="mb-1.5 block text-sm font-medium text-clay-700">
                Verse {i + 1} reference
              </span>
              <input
                name={`verse${i + 1}_reference`}
                defaultValue={v?.reference ?? ""}
                className={inputClass}
              />
            </label>
          </div>
        ))}
      </Section>

      <Section title="Founder bio" hint="Shown on the About page's Meet the Founder section.">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Name</span>
          <input name="founder_name" defaultValue={founder.name} className={inputClass} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Role</span>
          <input name="founder_role" defaultValue={founder.role} className={inputClass} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-clay-700">
            Bio <span className="text-clay-500">(separate paragraphs with a blank line)</span>
          </span>
          <textarea
            name="founder_bio"
            rows={8}
            defaultValue={founder.bio.join("\n\n")}
            className={`${inputClass} resize-y`}
          />
        </label>
      </Section>

      <Section title="Contact & social" hint="Shown in the footer and on the About page.">
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Email</span>
          <input
            name="contact_email"
            type="email"
            defaultValue={contact.email}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Age note</span>
          <input
            name="contact_age_note"
            defaultValue={contact.ageNote}
            className={inputClass}
            placeholder="All women welcome, ages 17+"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-clay-700">
            Service area cities <span className="text-clay-500">(comma-separated)</span>
          </span>
          <input
            name="contact_service_area"
            defaultValue={contact.serviceArea.join(", ")}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Instagram URL</span>
          <input
            name="social_instagram"
            type="url"
            defaultValue={contact.social.instagram}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-medium text-clay-700">Facebook URL</span>
          <input
            name="social_facebook"
            type="url"
            defaultValue={contact.social.facebook}
            className={inputClass}
          />
        </label>
      </Section>

      <Section title="Footer tagline" hint="The short line under the logo in the site footer.">
        <label className="sm:col-span-2">
          <textarea
            name="footer_tagline"
            rows={2}
            defaultValue={footer.tagline}
            className={`${inputClass} resize-none`}
          />
        </label>
      </Section>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
      >
        Save changes
      </button>
    </form>
  );
}
