import { BibleStudyForm } from "../BibleStudyForm";
import { createBibleStudy } from "../actions";
import { BackLink } from "@/components/BackLink";

export default function NewBibleStudyPage() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <BackLink href="/website/bible-studies" label="Back to Bible Studies" />
        <h1 className="font-display text-2xl text-clay-900">New Bible Study</h1>
      </div>
      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-clay-900/5 sm:p-8">
        <BibleStudyForm action={createBibleStudy} />
      </div>
    </div>
  );
}
