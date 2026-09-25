import Image from "next/image";
import { TEAM_MOMENTS } from "@/lib/team-moments";

export function TeamMoments() {
  return (
    <div className="hm-team-gallery" role="region" aria-label="Foto kebersamaan tim Hairmagic" tabIndex={0}>
      {TEAM_MOMENTS.map((moment) => (
        <figure className="hm-team-card" key={moment.src}>
          <div className="hm-team-photo">
            <Image
              src={moment.src}
              alt={moment.alt}
              fill
              sizes="(max-width: 767px) 80vw, (max-width: 1279px) 44vw, 37rem"
              loading="lazy"
              style={{ objectPosition: moment.position ?? "center" }}
            />
          </div>
          <figcaption>
            <span>{moment.category}</span>
            <strong>{moment.title}</strong>
            <p>{moment.caption}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
