export default function OperationalGap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden paper-grid bg-[#f0e8d0] px-[7vw] py-[8vh]">
      <div className="absolute right-0 top-0 h-full w-[28vw] bg-[#0c0c0c]" />
      <div className="relative z-10 max-w-[67vw]">
        <div className="font-body text-[1.5vw] uppercase tracking-[0.25em] text-[#c94a00]">01 / THE CONTEXT</div>
        <h1 className="mt-[4vh] font-display text-[5vw] font-bold leading-[0.95] tracking-[-0.06em]">The operational gap</h1>
        <p className="mt-[4vh] max-w-[52vw] font-body text-[2.2vw] leading-relaxed text-[#6d6658]">Trademark work becomes harder to trust when records, status changes, and team context live in different places.</p>
      </div>
      <div className="absolute bottom-[12vh] left-[7vw] right-[34vw] grid grid-cols-3 gap-[1.2vw]">
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#e8dfc7] p-[1.5vw]"><div className="font-display text-[3.5vw] font-bold">01</div><div className="mt-[2vh] font-body text-[1.6vw] leading-relaxed">A sheet that changes constantly.</div></div>
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#e8dfc7] p-[1.5vw]"><div className="font-display text-[3.5vw] font-bold">02</div><div className="mt-[2vh] font-body text-[1.6vw] leading-relaxed">A workflow that needs stages.</div></div>
        <div className="border-[0.2vw] border-[#0c0c0c] bg-[#d4a800] p-[1.5vw]"><div className="font-display text-[3.5vw] font-bold">03</div><div className="mt-[2vh] font-body text-[1.6vw] leading-relaxed">A team that is not always at a desk.</div></div>
      </div>
    </div>
  );
}