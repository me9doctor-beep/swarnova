import PropTypes from "prop-types";
import Button from "../../../../components/ui/Button.jsx";
import TextLink from "../../../../components/ui/TextLink.jsx";
import Eyebrow from "../../../../components/ui/Eyebrow.jsx";
import AsyncBoundary from "../../../../components/ui/AsyncBoundary.jsx";
import { useActiveCampaign } from "../../../../hooks/useActiveCampaign.js";

/** Wide promotional campaign banner — CMS-driven, with an unavailable state. */
export default function CampaignSection({ content }) {
  const { status, data: campaign, error, retry } = useActiveCampaign();

  return (
    <section aria-label="Current campaign" className="relative overflow-hidden bg-cream h-[340px]">
      <AsyncBoundary
        status={status}
        error={error}
        onRetry={retry}
        isEmpty={status === "success" && !campaign}
        emptyMessage={content.emptyMessage}
        className="shell py-24 text-center"
      >
        {campaign && (
          <>
            <div className="absolute inset-0" aria-hidden="true">
              <img
                src={campaign.image.src}
                alt={campaign.image.alt}
                loading="lazy"
                className="h-full w-full object-cover object-[72%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 to-cream/25 lg:via-cream/70" />
            </div>
            <div className="shell relative h-full flex items-center">
              <div className="max-w-lg">
                <Eyebrow>{campaign.eyebrow}</Eyebrow>
                <h2 className="mt-4 font-serif text-[34px] font-medium leading-[1.15] text-ink sm:text-[42px]">
                  {campaign.title}
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-ash">{campaign.body}</p>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Button href={campaign.cta.href}>{campaign.cta.label}</Button>
                  {campaign.secondaryCta && (
                    <TextLink href={campaign.secondaryCta.href}>
                      {campaign.secondaryCta.label}
                    </TextLink>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </AsyncBoundary>
    </section>
  );
}

CampaignSection.propTypes = {
  content: PropTypes.shape({
    campaignId: PropTypes.string,
    emptyMessage: PropTypes.string,
  }).isRequired,
};
