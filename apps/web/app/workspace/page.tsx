"use client";

export default function WorkspacePage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <iframe
        src="http://localhost:7777"
        className="w-full h-full border-0"
        title="Hermes Workspace"
      />
    </div>
  );
}
