import SubmitForm from "./SubmitForm";

export default function SubmitPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <header className="space-y-2">
        <p className="label">New RFP</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Submit an RFP to parse
        </h1>
        <p className="text-subtle text-sm">
          Paste a public URL to the solicitation PDF, or upload the file
          directly. The parser extracts required sections, qualifications, and
          evaluation criteria. You can then generate a draft response against
          your profile.
        </p>
      </header>
      <SubmitForm />
    </div>
  );
}
