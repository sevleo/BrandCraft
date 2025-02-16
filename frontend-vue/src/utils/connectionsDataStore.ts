import { ref, computed, watch } from 'vue';
import { getAllConnectedAccounts } from '@/api/connectedAccountsApi';

const twitterAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_twitter_account') || 'null')
);
const threadsAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_threads_account') || 'null')
);
const blueskyAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_bluesky_account') || 'null')
);
const tiktokAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_tiktok_account') || 'null')
);
const youtubeAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_youtube_account') || 'null')
);
const instagramAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_instagram_account') || 'null')
);
const mastodonAccount = ref<any>(
  JSON.parse(localStorage.getItem('brandcraft_mastodon_account') || 'null')
);

const isConnectingTwitter = ref<boolean>(false);
const isConnectingThreads = ref<boolean>(false);
const isConnectingBluesky = ref<boolean>(false);
const isConnectingTikTok = ref<boolean>(false);
const isConnectingYoutube = ref<boolean>(false);
const isConnectingInstagram = ref<boolean>(false);
const isConnectingMastodon = ref<boolean>(false);

// Watch for changes and update localStorage
watch(twitterAccount, (newValue) => {
  localStorage.setItem('brandcraft_twitter_account', JSON.stringify(newValue));
});

watch(threadsAccount, (newValue) => {
  localStorage.setItem('brandcraft_threads_account', JSON.stringify(newValue));
});

watch(blueskyAccount, (newValue) => {
  localStorage.setItem('brandcraft_bluesky_account', JSON.stringify(newValue));
});

watch(tiktokAccount, (newValue) => {
  localStorage.setItem('brandcraft_tiktok_account', JSON.stringify(newValue));
});

watch(youtubeAccount, (newValue) => {
  localStorage.setItem('brandcraft_youtube_account', JSON.stringify(newValue));
});

watch(instagramAccount, (newValue) => {
  localStorage.setItem(
    'brandcraft_instagram_account',
    JSON.stringify(newValue)
  );
});

watch(mastodonAccount, (newValue) => {
  localStorage.setItem('brandcraft_mastodon_account', JSON.stringify(newValue));
});

async function getAllAccounts() {
  try {
    const { accounts } = await getAllConnectedAccounts();

    // Group accounts by platform and transform to match expected format
    const accountsByPlatform = accounts.reduce((acc: any, account: any) => {
      if (!acc[account.platform]) {
        acc[account.platform] = [];
      }
      // Transform the account data to match the format expected by the frontend
      const transformedAccount = {
        ...account,
        id: account.platformId,
        avatar: account.profileImageUrl,
        name: account.displayName || account.username,
      };
      acc[account.platform].push(transformedAccount);
      return acc;
    }, {});

    // Update refs with the grouped accounts
    twitterAccount.value = accountsByPlatform.twitter || null;
    threadsAccount.value = accountsByPlatform.threads || null;
    blueskyAccount.value = accountsByPlatform.bluesky || null;
    tiktokAccount.value = accountsByPlatform.tiktok || null;
    youtubeAccount.value = accountsByPlatform.youtube || null;
    instagramAccount.value = accountsByPlatform.instagram || null;
    mastodonAccount.value = accountsByPlatform.mastodon || null;
  } catch (error) {
    console.error('Error fetching accounts:', error);
  }
}

// Function to clear account data (useful for logout)
function clearAccountData() {
  // Clear all refs
  twitterAccount.value = null;
  threadsAccount.value = null;
  blueskyAccount.value = null;
  tiktokAccount.value = null;
  youtubeAccount.value = null;
  instagramAccount.value = null;
  mastodonAccount.value = null;

  // Clear localStorage
  localStorage.removeItem('brandcraft_twitter_account');
  localStorage.removeItem('brandcraft_threads_account');
  localStorage.removeItem('brandcraft_bluesky_account');
  localStorage.removeItem('brandcraft_tiktok_account');
  localStorage.removeItem('brandcraft_youtube_account');
  localStorage.removeItem('brandcraft_instagram_account');
  localStorage.removeItem('brandcraft_mastodon_account');
}

const connectedAccounts = computed(() => {
  const accounts = [];
  if (twitterAccount.value) {
    for (const account of twitterAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'twitter',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'x-twitter'],
      });
    }
  }
  if (threadsAccount.value) {
    for (const account of threadsAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'threads',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'threads'],
      });
    }
  }

  if (blueskyAccount.value) {
    for (const account of blueskyAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'bluesky',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'bluesky'],
      });
    }
  }
  if (tiktokAccount.value) {
    for (const account of tiktokAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'tiktok',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'tiktok'],
      });
    }
  }
  if (instagramAccount.value) {
    for (const account of instagramAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'instagram',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'instagram'],
      });
    }
  }
  if (mastodonAccount.value) {
    for (const account of mastodonAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'mastodon',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'mastodon'],
      });
    }
  }
  if (youtubeAccount.value) {
    for (const account of youtubeAccount.value) {
      accounts.push({
        id: account.platformId,
        platform: 'youtube',
        username: account.username,
        profileImageUrl: account.profileImageUrl,
        platformIcon: ['fab', 'youtube'],
      });
    }
  }

  return accounts;
});

export default {
  twitterAccount,
  threadsAccount,
  blueskyAccount,
  tiktokAccount,
  youtubeAccount,
  instagramAccount,
  mastodonAccount,
  isConnectingTwitter,
  isConnectingThreads,
  isConnectingBluesky,
  isConnectingTikTok,
  isConnectingYoutube,
  isConnectingInstagram,
  isConnectingMastodon,
  getAllAccounts,
  clearAccountData,
  connectedAccounts,
};
