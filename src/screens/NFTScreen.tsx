import { NFTGallery } from "@/components/NFTGallery";
import { SCREEN_LABELS } from "@/lib/nav-labels";

export function NFTScreen() {
  const { title, sub } = SCREEN_LABELS.nfts;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[15px] font-semibold text-ink leading-none">
          {title}
        </h2>
        <p className="text-[11px] text-ink-3 mt-0.5">{sub}</p>
      </div>
      <NFTGallery />
    </div>
  );
}
