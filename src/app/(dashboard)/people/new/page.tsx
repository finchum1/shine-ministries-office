import { PersonForm } from "../PersonForm";
import { createPerson } from "../actions";

export default function NewPersonPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-clay-900">New Person</h1>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <PersonForm action={createPerson} />
      </div>
    </div>
  );
}
