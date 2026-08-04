export default function Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0c0c] text-[#f0e8d0]">
      <div className="absolute inset-0 paper-grid opacity-10" />
      <div className="absolute right-[8vw] top-[9vh] h-[64vh] w-[34vw] rotate-6 border-[0.35vw] border-[#f0e8d0] bg-[#c94a00] p-[2vw]">
        <div className="flex h-full w-full items-center justify-center border-[0.2vw] border-[#0c0c0c] bg-[#f0e8d0] text-center font-display text-[5vw] font-bold leading-[0.85] tracking-[-0.08em] text-[#0c0c0c]">TM<br />TRACKER</div>
      </div>
      <div className="absolute left-[7vw] top-[10vh] font-body text-[1.5vw] uppercase tracking-[0.25em] text-[#d4a800]">BRANDEX LAW ASSOICATE / PRODUCT BRIEF</div>
      <div className="absolute left-[7vw] top-[27vh] max-w-[60vw] font-display text-[7vw] font-bold leading-[0.88] tracking-[-0.07em]">TRADEMARK<br />TRACKER</div>
      <div className="absolute bottom-[12vh] left-[7vw] max-w-[43vw] font-body text-[2vw] leading-relaxed text-[#e8dfc7]">One live registry across desktop and mobile.</div>
      <div className="absolute bottom-[6vh] left-[7vw] font-body text-[1.5vw] text-[#8f897b]">A shared API. A shared database. A clearer day.</div>
      <div className="absolute bottom-[8vh] right-[8vw] h-[2.2vw] w-[2.2vw] bg-[#d4a800]" />
    </div>
  );
}