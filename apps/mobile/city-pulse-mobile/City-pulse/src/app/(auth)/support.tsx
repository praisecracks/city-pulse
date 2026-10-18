import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { InfoPage, InfoSection, InfoSectionHeader, InfoSubtitle, InfoParagraph, InfoList } from '@/components/info-page';
import { useTheme } from '@/hooks/use-theme';

const COLOR_PRIMARY = '#129E9E';

const faqItems = [
  {
    q: 'How do I report a service issue?',
    a: 'Go to the listing on your home feed or search, then tap the Report status button. Select a reason, add an optional note, and submit.',
  },
  {
    q: 'What happens after I submit a report?',
    a: 'Your report is reviewed by the community. Once verified, it helps keep neighborhood information accurate for everyone.',
  },
  {
    q: 'Can I verify my account?',
    a: 'Verified accounts unlock additional features like reporting and priority support. You can request verification in your profile under Account and Profile.',
  },
  {
    q: 'How do I become a service provider?',
    a: 'Select Become a Service Provider from your profile. Complete the registration flow and we will review your submission.',
  },
  {
    q: 'How do I unpublish my listing?',
    a: 'Go to the Listings tab and tap Unpublish listing, then confirm. Your listing is taken out of City Pulse search results straight away, so customers can no longer find you.',
  },
  {
    q: 'Does unpublishing delete my listing?',
    a: 'No. It is completely reversible. Your business details, photos, prices and status are all kept exactly as they are, and you can publish it again at any time from the same Listings tab. Nothing is lost, and you do not have to register again.',
  },
  {
    q: 'Can I still edit my listing while it is unpublished?',
    a: 'Yes. An unpublished listing is still fully yours. You can open the Listings tab at any time to view it, change your rates or photos, and publish it again when you are ready.',
  },
  {
    q: 'How do I publish my listing again?',
    a: 'Open the Listings tab and tap Publish listing again. Your listing returns to search results immediately, with every detail and photo still in place.',
  },
  {
    q: 'What does the 3 hour timer on a listing mean?',
    a: 'It shows how long the provider has left to confirm they are still open. Confirming your status restarts the timer. This protects you from walking to a POS point, gas refill or bukka that closed hours ago without telling anyone.',
  },
  {
    q: 'What happens if a provider does not update in time?',
    a: 'When the timer runs out the listing is automatically marked Unconfirmed, so customers know to double-check before making the trip. It is not deleted and the provider keeps their trust score history, so updating regularly is the best way to stay useful to your neighbors.',
  },
  {
    q: 'Why do some listings show as Unconfirmed?',
    a: 'That means the provider has not confirmed their status within the last 3 hours. It is a signal to check before you set off, not a judgement about the business. Confirmed listings are the ones we recommend you rely on.',
  },
  {
    q: 'What is a Trust Score?',
    a: 'A Trust Score reflects how neighbours have reported on a provider over the past 7 days. Every provider starts at 3.0, and it can only go down, never up, so a good score means an unbroken record. Keeping your status up to date does not raise it — only reports against a provider change it.',
  },
];

function FaqAccordion({ items }: { items: typeof faqItems }) {
  const theme = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.faqList}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <View 
            key={index} 
            style={[
              styles.faqCard, 
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              isOpen && styles.faqCardOpen
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              onPress={() => setOpenIndex(isOpen ? null : index)}
              style={({ pressed }) => [styles.faqQuestion, pressed && styles.pressed]}
            >
              <ThemedText style={[styles.faqQuestionText, { color: theme.textBody }]}>{item.q}</ThemedText>
              <Ionicons
                name={isOpen ? 'chevron-down' : 'chevron-forward'}
                size={16}
                color={isOpen ? COLOR_PRIMARY : theme.textTertiary}
              />
            </Pressable>
            {isOpen && (
              <View style={styles.faqAnswerWrapper}>
                <ThemedText themeColor="textSecondary" style={styles.faqAnswerText}>
                  {item.a}
                </ThemedText>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function SupportScreen() {
  const theme = useTheme();

  return (
    <InfoPage title="Help & Guidelines">
      {/* Quick Support Hero Banner */}
      <View style={styles.heroCard}>
        <Ionicons name="chatbubbles-outline" size={20} color={COLOR_PRIMARY} />
        <View style={styles.heroContent}>
          <ThemedText style={styles.heroTitle}>We are here to help your neighborhood</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.heroText}>
            Explore our guidelines, look through frequent questions, or contact our team directly below.
          </ThemedText>
        </View>
      </View>

      <InfoSection>
        <InfoSectionHeader>GETTING HELP</InfoSectionHeader>
        <InfoParagraph>
          Need assistance? Browse the frequently asked questions below, or reach out through the in-app support channel for direct help from our team.
        </InfoParagraph>
        <InfoList
          items={[
            'Report a service status issue directly from any listing.',
            'Use your profile to contact support for account or billing questions.',
            'Check our FAQ for quick answers to common questions.',
          ]}
        />
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>COMMUNITY GUIDELINES</InfoSectionHeader>
        <InfoSubtitle>Respect your neighbors</InfoSubtitle>
        <InfoParagraph>
          City Pulse is built on trust. Every contribution should be honest, helpful, and respectful. Report only real status changes and provide accurate details.
        </InfoParagraph>
        <InfoList
          items={[
            'Report truthfully — your reports directly affect neighbors who depend on this info.',
            'Be kind — harassment, hate speech, and personal attacks are not tolerated.',
            'Keep it local — focus on neighborhood-relevant information.',
            'Respect privacy — do not share personal details about others.',
          ]}
        />
        <InfoSubtitle>Content standards</InfoSubtitle>
        <InfoParagraph>
          Do not post spam, promotional content, or anything that violates local laws. Repeated violations may result in restricted access to reporting features.
        </InfoParagraph>
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>FREQUENTLY ASKED QUESTIONS</InfoSectionHeader>
        <FaqAccordion items={faqItems} />
      </InfoSection>

      <InfoSection>
        <InfoSectionHeader>CONTACT US</InfoSectionHeader>
        <View style={[styles.contactCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.contactIconWrap}>
            <Ionicons name="mail" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.contactDetails}>
            <ThemedText style={styles.contactLabel}>Direct Email Support</ThemedText>
            <ThemedText style={styles.contactText}>support@citypulse.app</ThemedText>
          </View>
        </View>
      </InfoSection>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#E8F6F6',
    borderWidth: 1,
    borderColor: '#BFEEE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR_PRIMARY,
    marginBottom: 2,
  },
  heroText: {
    fontSize: 12,
    lineHeight: 18,
  },
  faqList: {
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  faqCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqCardOpen: {
    borderColor: '#BFEEE5',
    backgroundColor: '#FAFDFD',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  faqAnswerWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLOR_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: '#888888',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  contactText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLOR_PRIMARY,
    marginTop: 2,
  },
});