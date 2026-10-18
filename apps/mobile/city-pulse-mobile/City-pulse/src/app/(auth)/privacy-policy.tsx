import { InfoPage, InfoSection, InfoSectionHeader, InfoSubtitle, InfoParagraph, InfoList } from '@/components/info-page';

export default function PrivacyPolicyScreen() {
  return (
    <InfoPage title="Privacy Policy">
      <InfoSection>
        <InfoSectionHeader>OVERVIEW</InfoSectionHeader>
        <InfoParagraph>
          City Pulse respects your privacy and is committed to protecting the personal information
          you share with us. This Privacy Policy explains what data we collect, how we use it,
          and your rights regarding that data.
        </InfoParagraph>
        <InfoSubtitle>What we collect</InfoSubtitle>
        <InfoParagraph>
          We collect only the information necessary to provide and improve our services:
        </InfoParagraph>
        <InfoList
          items={[
            'Account information you provide during registration (name, phone number).',
            'Profile data you choose to share (avatar, business name).',
            'Your selected neighborhood area for localized results.',
            'Report submissions you make about service statuses.',
          ]}
        />
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>HOW WE USE YOUR DATA</InfoSectionHeader>
        <InfoSubtitle>Service delivery</InfoSubtitle>
        <InfoParagraph>
          We use your information to authenticate your account, display your profile, and deliver
          location-based neighborhood services.
        </InfoParagraph>
        <InfoSubtitle>Community reports</InfoSubtitle>
        <InfoParagraph>
          Submitted reports are reviewed by the community. We reserve the right to verify, remove,
          or disregard any report that violates these Terms.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>LOCATION DATA</InfoSectionHeader>
        <InfoParagraph>
          We use your device location only to sort nearby services by distance. Location data is
          processed on-device and is never stored or transmitted to our servers. You may also
          choose your neighborhood area manually at any time.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>DATA SHARING AND RETENTION</InfoSectionHeader>
        <InfoParagraph>
          We do not sell, rent, or share your personal information with third parties for marketing
          purposes. We retain your data for as long as your account is active, or as needed to
          provide our services. You may request account deletion at any time.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>UNPUBLISHING YOUR BUSINESS</InfoSectionHeader>
        <InfoParagraph>
          If you are a service provider, you can unpublish your business listing at any time from the
          Listings tab. While unpublished, your listing is removed from search results and is not
          shown to other users, though you can still see and edit it yourself.
        </InfoParagraph>
        <InfoParagraph>
          Unpublishing does not delete anything. Your business details and photos stay on your
          account and become visible again as soon as you choose to publish, so unpublishing is a
          display control rather than a deletion. To have your information removed permanently,
          request account deletion instead.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>YOUR RIGHTS</InfoSectionHeader>
        <InfoList
          items={[
            'Access and update your profile information at any time.',
            'Unpublish your business listing from other users at any time.',
            'Request deletion of your account and associated data.',
            'Control location permissions through your device settings.',
            'Export or remove your submitted reports.',
          ]}
        />
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>CHANGES TO THIS POLICY</InfoSectionHeader>
        <InfoParagraph>
          We may update this Privacy Policy from time to time. Significant changes will be
          communicated within the app. This policy was last updated September 2026.
        </InfoParagraph>
      </InfoSection>
    </InfoPage>
  );
}
