import { importPeople } from "../actions";

export default function ImportPeoplePage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">Add Multiple People</h1>
      <p className="mt-1 text-sm text-clay-700">
        Paste one person per line. Just a name is fine (e.g. typed up from a screenshot or
        email) -- add email and/or phone after a comma if you have them.
      </p>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <form action={importPeople} className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-clay-700">People</span>
            <textarea
              name="people_text"
              required
              rows={12}
              placeholder={"Jane Smith\nJohn Doe, john@email.com\nMary Jones, , 555-123-4567"}
              className="w-full rounded-xl border border-clay-900/12 bg-cream px-4 py-3 font-mono text-sm text-clay-900 outline-none transition-shadow placeholder:text-clay-500 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
            />
          </label>

          <div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream shadow-sm shadow-sage/20 transition-colors hover:bg-sage-dark"
            >
              Add everyone
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
