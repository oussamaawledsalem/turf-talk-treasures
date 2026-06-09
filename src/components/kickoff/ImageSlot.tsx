import type { CSSProperties } from "react";
import { ImageIcon } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  slotName: string;
  width?: string;
  height?: string;
  objectFit?: CSSProperties["objectFit"];
  className?: string;
  rounded?: boolean;
};

export function ImageSlot({
  src,
  alt,
  slotName,
  width = "100%",
  height = "200px",
  objectFit = "cover",
  className = "",
  rounded = false,
}: Props) {
  return (
    <div
      className={`relative overflow-hidden ${rounded ? "rounded-full" : ""} ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center border border-dashed border-turf-line bg-turf-mid text-chalk-dim">
        <ImageIcon className="size-6 mb-1" />
        <div className="text-[10px] font-bold uppercase tracking-widest">{slotName}</div>
        <div className="text-[10px]">Drop your photo here</div>
      </div>
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}