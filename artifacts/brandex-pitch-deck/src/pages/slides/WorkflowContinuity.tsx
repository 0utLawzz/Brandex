export default function WorkflowContinuity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden paper-grid bg-[#f0e8d0] px-[7vw] py-[8vh]">
      <div className="font-body text-[1.5vw] uppercase tracking-[0.25em] text-[#c94a00]">05 / THE FLOW</div>
      <h1 className="mt-[3vh] max-w-[70vw] font-display text-[5vw] font-bold leading-[0.95] tracking-[-0.06em]">Workflow continuity</h1>
      <p className="mt-[3vh] max-w-[55vw] font-body text-[2vw] leading-relaxed text-[#6d6658]">One record. Multiple surfaces. No duplicate handoff.</p>
      <div className="absolute bottom-[15vh] left-[7vw] right-[7vw] flex items-center gap-[1.4vw]">
        <div className="w-[22vw] border-[0.25vw] border-[#0c0c0c] bg-[#0c0c0c] p-[1.6vw] text-[#f0e8d0]"><div className="font-body text-[1.3vw] text-[#d4a800]">01 / FIELD ACTION</div><div className="mt-[2vh] font-display text-[2.6vw] font-bold">CREATE OR UPDATE</div><div className="mt-[2vh] font-body text-[1.5vw] leading-relaxed">Capture the latest trademark detail wherever the work happens.</div></div>
        <div className="font-display text-[3vw] font-bold text-[#c94a00]">→</div>
        <div className="w-[22vw] border-[0.25vw] border-[#0c0c0c] bg-[#d4a800] p-[1.6vw]"><div className="font-body text-[1.3vw] text-[#0c0c0c]">02 / SHARED RECORD</div><div className="mt-[2vh] font-display text-[2.6vw] font-bold">API + DATABASE</div><div className="mt-[2vh] font-body text-[1.5vw] leading-relaxed">The same record, persisted with change history.</div></div>
        <div className="font-display text-[3vw] font-bold text-[#c94a00]">→</div>
        <div className="w-[22vw] border-[0.25vw] border-[#0c0c0c] bg-[#c94a00] p-[1.6vw] text-[#f0e8d0]"><div className="font-body text-[1.3vw] text-[#0c0c0c]">03 / DESKTOP REVIEW</div><div className="mt-[2vh] font-display text-[2.6vw] font-bold">SEE THE LATEST</div><div className="mt-[2vh] font-body text-[1.5vw] leading-relaxed">The command center stays current for the next decision.</div></div>
      </div>
    </div>
  );
}