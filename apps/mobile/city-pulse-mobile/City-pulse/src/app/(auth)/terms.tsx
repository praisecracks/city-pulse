import { InfoPage, InfoSection, InfoSectionHeader, InfoSubtitle, InfoParagraph, InfoList } from '@/components/info-page';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

const COLOR_PRIMARY = '#129E9E';

export default function TermsScreen() {
  return (
    <InfoPage title="Terms of Service">
      {/* Top Legal Notice Banner */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeRow}>
          <Ionicons name="document-text-outline" size={18} color={COLOR_PRIMARY} />
          <ThemedText style={styles.noticeTitle}>Legal Agreement</ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.noticeText}>
          Please read these terms carefully before accessing or utilizing the City Pulse network. Last updated September 2026.
        </ThemedText>
      </View>

      <InfoSection>
        <InfoSectionHeader>AGREEMENT TO TERMS</InfoSectionHeader>
        <InfoParagraph>
          These Terms of Service constitute a legally binding agreement between you and City Pulse regarding your access to and use of the City Pulse mobile application and related services. By accessing or using the app, you agree to be bound by these Terms. If you do not agree, please do not use the app.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>ELIGIBILITY</InfoSectionHeader>
        <InfoParagraph>
          You must be at least 13 years old to use this service. If you are under 18, you represent that you have parental or guardian consent to use the app.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>USER OBLIGATIONS</InfoSectionHeader>
        <InfoSubtitle>Accurate information</InfoSubtitle>
        <InfoParagraph>
          You agree to provide accurate and complete information during registration and to keep your profile information up to date.
        </InfoParagraph>
        <InfoSubtitle>Community standards</InfoSubtitle>
        <InfoParagraph>
          You are responsible for maintaining the accuracy and integrity of your reports. Prohibited activities include:
        </InfoParagraph>
        <InfoList
          items={[
            'Submitting false, misleading, or fraudulent service status reports.',
            'Posting spam, promotional content, or unsolicited messages.',
            'Harassing, impersonating, or threatening other users.',
            'Attempting to disrupt the app or compromise its security.',
          ]}
        />
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>REPORTING AND VERIFICATION</InfoSectionHeader>
        <InfoParagraph>
          When you submit a report, you affirm that the information is true and accurate to the best of your knowledge. Reports are reviewed by the community. We reserve the right to verify, remove, or disregard any report that violates these Terms.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>FRESHNESS AND CONFIRMED STATUS</InfoSectionHeader>
        <InfoSubtitle>The three hour confirmation window</InfoSubtitle>
        <InfoParagraph>
          A status you set on City Pulse is a claim about what is true right now, so it goes stale. Every
          listing carries a three hour window. Confirming your status restarts the clock, and it resets
          whenever you change your status or edit your listing.
        </InfoParagraph>
        <InfoParagraph>
          If the window passes without a confirmation, the listing is automatically marked
          Unconfirmed. Unconfirmed is not a penalty and does not remove your listing. It tells customers
          the information may be out of date and that they should check before making the trip. The
          timer and the automatic downgrade are applied by the City Pulse service, not by your device.
        </InfoParagraph>
        <InfoSubtitle>Why this exists</InfoSubtitle>
        <InfoParagraph>
          The window protects customers from relying on information that is hours out of date, and it
          protects you from customers arriving at a closed shop with no explanation. It is the mechanism
          that makes a listing worth trusting in the first place.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>UNPUBLISHING YOUR LISTING</InfoSectionHeader>
        <InfoParagraph>
          You can unpublish your listing at any time from the Listings tab. An unpublished listing is
          removed from City Pulse search results, so customers can no longer find you, and it is no
          longer shown on the public feed.
        </InfoParagraph>
        <InfoParagraph>
          Unpublishing is completely reversible and deletes nothing. Your business details, photos,
          prices and status are all kept, and you remain responsible for keeping them accurate while
          unpublished. You can publish your listing again at any time, and when you do it returns to
          search exactly as you left it. You are not required to register again.
        </InfoParagraph>
        <InfoParagraph>
          We distinguish unpublishing from deletion deliberately. Deleting your listing permanently
          removes it and the information attached to it, and cannot be undone.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>TRUST SCORE</InfoSectionHeader>
        <InfoParagraph>
          Every provider begins with a trust score of 3.0. The score reflects reports filed by
          neighbours about that provider over the preceding seven days, and it can only decrease. It
          is never increased, and updating your status more often does not raise it.
        </InfoParagraph>
        <InfoParagraph>
          A lower score lowers a listing&apos;s prominence and is a visible signal to customers that
          others have reported problems. Reaching the lowest score is a serious and lasting
          consequence, and sustained reports against a provider will be reviewed under the Community
          Standards.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>INTELLECTUAL PROPERTY</InfoSectionHeader>
        <InfoParagraph>
          The app, including all content, graphics, logos, and software, is the property of City Pulse and protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our prior written consent.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>DISCLAIMER OF WARRANTIES</InfoSectionHeader>
        <InfoParagraph>
          THE APP IS PROVIDED ON AN AS IS AND AS AVAILABLE BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>LIMITATION OF LIABILITY</InfoSectionHeader>
        <InfoParagraph>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, CITY PULSE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA OR PROFITS, WHETHER FORESEEABLE OR NOT, ARISING OUT OF YOUR USE OF THE APP.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>TERMINATION</InfoSectionHeader>
        <InfoParagraph>
          We may suspend or terminate your account at any time, with or without cause, without notice, and without liability. Upon termination, your right to use the app will cease immediately.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>CHANGES TO TERMS</InfoSectionHeader>
        <InfoParagraph>
          We may revise these Terms from time to time. We will notify you of any material changes by posting the new Terms in the app. Your continued use of the app after such changes constitutes acceptance of the revised Terms.
        </InfoParagraph>
      </InfoSection>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  noticeCard: {
    backgroundColor: '#E8F6F6',
    borderWidth: 1,
    borderColor: '#BFEEE5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR_PRIMARY,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
});