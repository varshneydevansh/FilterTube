import { Mascot } from "@/components/mascot";
import { Reveal } from "@/components/reveal";

export function MeetMascots() {
  return (
    <section aria-labelledby="meet-title" className="px-4 py-16 md:px-6 md:py-24" id="kriti-and-uljhan">
      <div className="mx-auto max-w-[1180px]">
        <Reveal>
          <div className="ft-paper ft-paper-ruled grid gap-8 rounded-[2.2rem] p-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-end md:gap-10 md:p-10">
            <Mascot className="mx-auto h-40 w-auto md:h-52" describe pose="kritiWave" />
            <div>
              <h2 className="font-display text-4xl font-semibold tracking-[-0.06em] text-[#1d1b18] md:text-5xl" id="meet-title">
                Meet Kriti and Uljhan
              </h2>
              <p className="mt-5 max-w-[60ch] text-base leading-8 text-[#3f3a34]">
                <strong className="font-semibold text-[#1d1b18]">Kriti</strong> is the creator’s sister. She stands
                for the care and protection she gave him growing up, and FilterTube passes that care on, so you can
                look after yourself and the people you love.
              </p>
              <p className="mt-4 max-w-[60ch] text-base leading-8 text-[#3f3a34]">
                <strong className="font-semibold text-[#1d1b18]">Uljhan</strong> means a tangle. It’s the clutter
                we’d rather not see: not something to hate, just not what you want in your feed. Kriti clears it
                gently, and Uljhan hops off happily.
              </p>
            </div>
            <Mascot className="mx-auto h-32 w-auto md:h-40" describe pose="uljhanHop" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
