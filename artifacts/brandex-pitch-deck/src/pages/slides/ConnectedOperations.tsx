export default function ConnectedOperations() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#c94a00] px-[7vw] py-[8vh] text-[#f0e8d0]">
      <div className="font-body text-[1.5vw] uppercase tracking-[0.25em] text-[#0c0c0c]">06 / THE OPERATING LAYER</div>
      <h1 className="mt-[3vh] max-w-[68vw] font-display text-[5vw] font-bold leading-[0.95] tracking-[-0.06em]">Connected operations</h1>
      <div className="mt-[6vh] grid grid-cols-2 gap-[1.5vw]">
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#f0e8d0] p-[1.7vw] text-[#0c0c0c]"><div className="font-display text-[2.8vw] font-bold">SYNC</div><div className="mt-[2vh] font-body text-[1.7vw] leading-relaxed">Live Google Sheets API import with one action from desktop or mobile.</div></div>
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#d4a800] p-[1.7vw] text-[#0c0c0c]"><div className="font-display text-[2.8vw] font-bold">WRITE-BACK</div><div className="mt-[2vh] font-body text-[1.7vw] leading-relaxed">Apps Script forwards saved trademark changes and audit entries to the sheet.</div></div>
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#0c0c0c] p-[1.7vw]"><div className="font-display text-[2.8vw] font-bold text-[#d4a800]">PROGRESSION</div><div className="mt-[2vh] font-body text-[1.7vw] leading-relaxed">Forward-only stage movement protects workflow order.</div></div>
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#e8dfc7] p-[1.7vw] text-[#0c0c0c]"><div className="font-display text-[2.8vw] font-bold">HISTORY</div><div className="mt-[2vh] font-body text-[1.7vw] leading-relaxed">A persistent change log records what moved and when.</div></div>
      </div>
    </div>
  );
}