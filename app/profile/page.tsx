import ProfileEditor from "./ProfileEditor";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="label">Local to your browser only</p>
        <h1 className="text-3xl font-medium tracking-tight">
          Business profile
        </h1>
        <p className="text-subtle text-sm max-w-prose">
          This data stays in your browser storage. It is sent to the draft
          generator only when you hit Generate and is never saved on our
          server. Export the JSON any time.
        </p>
      </header>
      <ProfileEditor />
    </div>
  );
}
