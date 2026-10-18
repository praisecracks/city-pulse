import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { CATEGORY_META, type Category, type Listing } from '@/data/product';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

/**
 * The category-specific facts a provider entered, read off `details`.
 *
 * This blob is captured during onboarding and stored on the Pulse, but until now
 * the detail screen rendered none of it — the customer saw a one-line price
 * summary and nothing else, so a gas provider's delivery offer, a food vendor's
 * menu prices, and a house agent's rent range were all invisible.
 *
 * Everything here is defensive: a listing created before a field existed, or by
 * the API directly, simply omits that row rather than rendering "undefined".
 */
function getDeliveryInfo(listing: Listing): { enabled: boolean; charge?: number } | null {
  const details = listing.details;
  if (!details) return null;

  const rawEnabled = details.homeDeliveryEnabled;
  if (typeof rawEnabled !== 'boolean') return null;

  const rawCharge = details.deliveryCharge;
  const charge = typeof rawCharge === 'number' && Number.isFinite(rawCharge) ? rawCharge : undefined;

  return { enabled: rawEnabled, charge };
}

type DetailRow = {
  icon: string;
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'muted';
};

function getCategoryDetails(listing: Listing): DetailRow[] {
  const details = listing.details || {};
  const rows: DetailRow[] = [];

  const delivery = getDeliveryInfo(listing);
  if (delivery) {
    if (delivery.enabled) {
      rows.push({
        icon: 'bicycle-outline',
        label: 'Home delivery',
        value:
          delivery.charge !== undefined
            ? `Available — ₦${delivery.charge.toLocaleString()} delivery charge`
            : 'Available',
        tone: 'positive',
      });
    } else {
      rows.push({
        icon: 'bicycle-outline',
        label: 'Home delivery',
        value: 'Not available',
        tone: 'muted',
      });
    }
  }

  switch (listing.category) {
    case 'pos': {
      if (typeof details.feePer10000 === 'number') {
        rows.push({
          icon: 'card-outline',
          label: 'Fee per ₦10,000',
          value: `₦${details.feePer10000.toLocaleString()}`,
        });
      }
      if (typeof details.maxCashLimit === 'number') {
        rows.push({
          icon: 'cash-outline',
          label: 'Maximum cash limit',
          value: `₦${details.maxCashLimit.toLocaleString()}`,
        });
      }
      if (Array.isArray(details.acceptedCardBrands) && details.acceptedCardBrands.length > 0) {
        rows.push({
          icon: 'card-outline',
          label: 'Cards accepted',
          value: details.acceptedCardBrands.join(', '),
        });
      }
      break;
    }

    case 'gas': {
      if (typeof details.pricePerCylinder === 'number') {
        rows.push({
          icon: 'flame-outline',
          label: 'Price per cylinder',
          value: `₦${details.pricePerCylinder.toLocaleString()}`,
        });
      }
      break;
    }

    case 'food': {
      if (Array.isArray(details.menuItems) && details.menuItems.length > 0) {
        // The menu is the product for a food vendor, so it is shown as a list
        // rather than collapsed into the "N items on the menu" card summary.
        rows.push({
          icon: 'restaurant-outline',
          label: 'Menu',
          value: details.menuItems
            .map((item) => {
              const name = typeof item?.name === 'string' ? item.name : '';
              const price = typeof item?.price === 'number' ? `₦${item.price.toLocaleString()}` : '';
              return name && price ? `${name} — ${price}` : name || price;
            })
            .filter(Boolean)
            .join('\n'),
        });
      }
      break;
    }

    case 'house': {
      if (typeof details.rentRangeMin === 'number' && typeof details.rentRangeMax === 'number') {
        rows.push({
          icon: 'home-outline',
          label: 'Rent range',
          value: `₦${details.rentRangeMin.toLocaleString()} – ₦${details.rentRangeMax.toLocaleString()}`,
        });
      } else if (typeof details.rentRangeMin === 'number') {
        rows.push({
          icon: 'home-outline',
          label: 'Rent from',
          value: `₦${details.rentRangeMin.toLocaleString()}`,
        });
      }
      if (Array.isArray(details.coveredAreas) && details.coveredAreas.length > 0) {
        rows.push({
          icon: 'map-outline',
          label: 'Areas covered',
          value: details.coveredAreas.join(', '),
        });
      }
      break;
    }
  }

  return rows;
}

export function ProviderDetailsList({ listing }: { listing: Listing }) {
  const theme = useTheme();
  const styles = getStyles(theme);

  const categoryMeta = CATEGORY_META[listing.category as Category];
  const categoryRows = getCategoryDetails(listing);

  const contactRows: DetailRow[] = [];
  if (listing.address) {
    contactRows.push({ icon: 'map-outline', label: 'Address', value: listing.address });
  }
  if (listing.email) {
    contactRows.push({ icon: 'mail-outline', label: 'Email', value: listing.email });
  }

  // Nothing to show for a listing that has no category detail and no address or
  // email — an empty card is worse than no card.
  if (categoryRows.length === 0 && contactRows.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText style={[styles.cardTitle, { color: theme.textSecondary }]}>
        {(categoryMeta?.label || 'SERVICE').toUpperCase()} DETAILS
      </ThemedText>

      {categoryRows.map((row) => (
        <View key={`${row.label}-${row.value}`} style={styles.row}>
          <Ionicons
            name={row.icon as any}
            size={16}
            color={row.tone === 'positive' ? theme.accent : theme.textSecondary}
          />
          <View style={styles.rowCopy}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>{row.label}</ThemedText>
            <ThemedText
              style={[
                styles.rowValue,
                { color: row.tone === 'muted' ? theme.textSecondary : theme.textBody },
              ]}
            >
              {row.value}
            </ThemedText>
          </View>
        </View>
      ))}

      {contactRows.length > 0 && categoryRows.length > 0 && (
        <View style={[styles.divider, { borderTopColor: theme.border }]} />
      )}

      {contactRows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Ionicons name={row.icon as any} size={16} color={theme.textSecondary} />
          <View style={styles.rowCopy}>
            <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>{row.label}</ThemedText>
            <ThemedText style={[styles.rowValue, { color: theme.textBody }]}>{row.value}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );
}

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
    cardTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    rowCopy: { flex: 1 },
    rowLabel: { fontSize: 11, fontWeight: '600' },
    rowValue: { fontSize: 14, lineHeight: 20, fontWeight: '600', marginTop: 1 },
    divider: { borderTopWidth: 1, marginTop: 2 },
  });
