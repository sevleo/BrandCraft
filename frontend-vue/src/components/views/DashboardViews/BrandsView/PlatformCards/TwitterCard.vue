<script setup lang="ts">
  import { X } from 'lucide-vue-next';

  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { connectTwitter } from '@/api/twitterApi';
  import { disconnectConnectedAccount } from '@/api/connectedAccountsApi';

  async function connect() {
    connectionsDataStore.isConnectingTwitter.value = true;
    const { authUrl } = await connectTwitter();
    window.location.href = authUrl;
  }

  async function disconnect(platformId: string) {
    await disconnectConnectedAccount(platformId);

    connectionsDataStore.twitterAccount.value =
      connectionsDataStore.twitterAccount.value.filter(
        (record: any) => record.platformId !== platformId
      );
  }
</script>

<template>
  <div class="w-full max-w-2xl">
    <h3 class="mb-6 text-[20px] text-gray-900">Twitter</h3>
    <h2 class="mb-6 text-2xl text-gray-900">
      Streamline your X content management with our powerful scheduling tools
    </h2>
    <div>
      <div>
        <p class="mb-4 leading-relaxed text-gray-900"></p>
        <ul class="list-disc space-y-2 pl-5 text-gray-900">
          <li>Schedule text posts and threads for optimal posting times</li>
          <li>Plan and queue your video content in advance</li>
          <li>
            Maintain a consistent posting schedule to keep your audience engaged
          </li>
        </ul>
      </div>
      <div class="mt-[50px] rounded-lg bg-blue-50 p-6 dark:bg-gray-800">
        <div class="items-start space-y-4">
          <p class="text-sm leading-relaxed text-gray-900">
            Please note that there might be some limitations on the number of
            posts due to API restrictions.
          </p>
          <p class="text-sm leading-relaxed text-gray-900">
            Don't worry though - we're working on upgrading our plan to
            accommodate more posts soon! Thanks for being part of our early
            community.
          </p>
        </div>
      </div>
      <h2
        v-if="
          connectionsDataStore.twitterAccount.value &&
          connectionsDataStore.twitterAccount.value.length > 0
        "
        class="mt-[50px] text-2xl text-gray-900"
      >
        Connected Twitter
      </h2>

      <div v-if="connectionsDataStore.twitterAccount.value">
        <div
          v-for="connection in connectionsDataStore.twitterAccount.value"
          class="mt-[10px] flex w-[250px] items-center justify-start gap-3 rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
        >
          <div>
            <img
              :src="connection.profileImageUrl"
              :alt="connection.username"
              class="h-[30px] w-[30px] rounded-full object-cover"
            />
          </div>
          <div class="mr-auto flex h-full flex-col justify-between">
            <div class="text-xs text-gray-500">Account</div>
            <div class="text-sm font-bold text-gray-900">
              {{ connection.username }}
            </div>
          </div>
          <div
            @click="() => disconnect(connection.platformId)"
            class="cursor-pointer rounded-md p-[3px] transition-all duration-300 hover:bg-gray-100 dark:hover:bg-[#d9d9d9]/10"
          >
            <X />
          </div>
        </div>
      </div>
    </div>
    <div class="mt-[50px]">
      <h2 class="mb-6 text-2xl text-gray-900">Connect Twitter</h2>
      <div class="space-y-6">
        <div class="mt-8 flex justify-start space-x-4">
          <button
            type="button"
            @click="connect"
            :disabled="connectionsDataStore.isConnectingTwitter.value"
            class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="connectionsDataStore.isConnectingTwitter.value"
              >Connecting...</span
            >
            <span v-else>Connect</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
