export default function DesktopCommandCenter() {
  return (
    <div className="relative w-screen h-screen overflow-hidden paper-grid bg-[#f0e8d0] px-[7vw] py-[8vh]">
      <div className="font-body text-[1.5vw] uppercase tracking-[0.25em] text-[#c94a00]">03 / DESKTOP</div>
      <h1 className="mt-[3vh] font-display text-[5vw] font-bold leading-[0.95] tracking-[-0.06em]">Desktop command center</h1>
      <div className="mt-[5vh] grid grid-cols-[1.15fr_0.85fr] gap-[2vw]">
        <div className="border-[0.25vw] border-[#0c0c0c] bg-[#0c0c0c] p-[1.5vw] text-[#f0e8d0]">
          <div className="flex items-center justify-between border-b-[0.15vw] border-[#6d6658] pb-[1vw]"><div className="font-body text-[1.5vw]">BRANDEX / REGISTRY</div><div className="bg-[#d4a800] px-[1vw] py-[0.5vw] font-body text-[1.2vw] text-[#0c0c0c]">SYNC G-SHEETS</div></div>
          <div className="mt-[2vh] grid grid-cols-3 gap-[1vw]"><div className="bg-[#c94a00] p-[1.2vw]"><div className="font-body text-[1.2vw]">TOTAL</div><div className="mt-[1vh] font-display text-[3.3vw] font-bold">1,652</div></div><div className="bg-[#e8dfc7] p-[1.2vw] text-[#0c0c0c]"><div className="font-body text-[1.2vw]">STAGES</div><div className="mt-[1vh] font-display text-[3.3vw] font-bold">04</div></div><div className="bg-[#d4a800] p-[1.2vw] text-[#0c0c0c]"><div className="font-body text-[1.2vw]">AUDIT</div><div className="mt-[1vh] font-display text-[3.3vw] font-bold">ON</div></div></div>
          <div className="mt-[2vh] h-[14vh] border-[0.15vw] border-[#6d6658] p-[1.2vw]"><div className="font-body text-[1.4vw] text-[#d4a800]">LATEST RECORDS</div><div className="mt-[2vh] grid grid-cols-3 gap-[1vw] font-body text-[1.4vw]"><span>TM NO.</span><span>APP NAME</span><span>STAGE</span></div></div>
        </div>
        <div className="flex flex-col justify-between border-[0.25vw] border-[#0c0c0c] bg-[#e8dfc7] p-[2vw]"><div><div className="font-body text-[1.5vw] uppercase text-[#c94a00]">What the browser adds</div><div className="mt-[3vh] font-display text-[3vw] font-bold leading-tight">A clear view of the work in motion.</div></div><div className="font-body text-[1.7vw] leading-relaxed">Dashboard totals<br />Stage and substage breakdowns<br />Search, create, edit, and delete<br />One-click sheet sync</div></div>
      </div>
    </div>
  );
}