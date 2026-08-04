export default function SourceOfTruth() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#c94a00] px-[7vw] py-[8vh] text-[#f0e8d0]">
      <div className="absolute -right-[8vw] -top-[12vh] h-[48vw] w-[48vw] rounded-full border-[0.35vw] border-[#f0e8d0] opacity-30" />
      <div className="relative z-10 font-body text-[1.5vw] uppercase tracking-[0.25em] text-[#0c0c0c]">02 / THE SYSTEM</div>
      <h1 className="relative z-10 mt-[4vh] max-w-[65vw] font-display text-[5vw] font-bold leading-[0.95] tracking-[-0.06em]">One source of truth</h1>
      <p className="relative z-10 mt-[3vh] max-w-[49vw] font-body text-[2.1vw] leading-relaxed text-[#f5dfb8]">The live sheet feeds a shared API and database, so desktop and mobile read from the same operational record.</p>
      <div className="absolute bottom-[13vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <div className="flex h-[17vh] w-[17vw] flex-col justify-between border-[0.25vw] border-[#0c0c0c] bg-[#f0e8d0] p-[1.5vw] text-[#0c0c0c]"><div className="font-body text-[1.5vw] uppercase">INPUT</div><div className="font-display text-[2.2vw] font-bold">GOOGLE<br />SHEETS</div></div>
        <div className="h-[0.3vw] w-[11vw] bg-[#0c0c0c]" />
        <div className="flex h-[17vh] w-[17vw] flex-col justify-between border-[0.25vw] border-[#0c0c0c] bg-[#d4a800] p-[1.5vw] text-[#0c0c0c]"><div className="font-body text-[1.5vw] uppercase">ENGINE</div><div className="font-display text-[2.2vw] font-bold">API +<br />DATABASE</div></div>
        <div className="h-[0.3vw] w-[11vw] bg-[#0c0c0c]" />
        <div className="flex h-[17vh] w-[17vw] flex-col justify-between border-[0.25vw] border-[#0c0c0c] bg-[#f0e8d0] p-[1.5vw] text-[#0c0c0c]"><div className="font-body text-[1.5vw] uppercase">OUTPUT</div><div className="font-display text-[2.2vw] font-bold">DESKTOP<br />+ MOBILE</div></div>
      </div>
    </div>
  );
}