<script setup lang="ts">
  import { ref } from 'vue';
  import { X } from 'lucide-vue-next';

  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { connectBluesky } from '@/api/blueskyApi';
  import { disconnectConnectedAccount } from '@/api/connectedAccountsApi';

  async function disconnect(platformId: string) {
    await disconnectConnectedAccount(platformId);

    connectionsDataStore.blueskyAccount.value =
      connectionsDataStore.blueskyAccount.value.filter(
        (record: any) => record.platformId !== platformId
      );
  }

  const blueskyHandle = ref('');
  const blueskyPassword = ref('');
  const blueskyError = ref('');

  async function submitBlueskyLogin() {
    try {
      connectionsDataStore.isConnectingBluesky.value = true;
      blueskyError.value = '';
      const response = await connectBluesky({
        identifier: blueskyHandle.value,
        password: blueskyPassword.value,
      });

      if (response.success) {
        blueskyHandle.value = '';
        blueskyPassword.value = '';
        connectionsDataStore.blueskyAccount.value = response.data;
        connectionsDataStore.getAllAccounts();
      } else {
        blueskyError.value = response.message || 'Failed to connect';
      }
    } catch (error) {
      console.error('Failed to connect Bluesky account:', error);
      blueskyError.value = 'An unexpected error occurred';
    } finally {
      connectionsDataStore.isConnectingBluesky.value = false;
    }
  }
</script>

<template>
  <div class="w-full max-w-2xl">
    <h3 class="mb-6 text-[20px] text-gray-900">Bluesky</h3>
    <h2 class="mb-6 text-2xl text-gray-900">
      Stay ahead of competitors who are still navigating the ins and outs of
      Bluesky
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
      <h2
        v-if="
          connectionsDataStore.blueskyAccount.value &&
          connectionsDataStore.blueskyAccount.value.length > 0
        "
        class="mt-[50px] text-2xl text-gray-900"
      >
        Connected Bluesky
      </h2>

      <div v-if="connectionsDataStore.blueskyAccount.value">
        <div
          v-for="connection in connectionsDataStore.blueskyAccount.value"
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
      <h2 class="mb-6 text-2xl text-gray-900">Connect Bluesky</h2>
      <form @submit.prevent="submitBlueskyLogin" class="space-y-6">
        <div class="rounded-lg bg-blue-50 p-6 dark:bg-gray-800">
          <div class="text-sm text-gray-600">
            <p class="text-sm text-gray-900">
              To connect your account, you'll need to generate an app password
              from your
              <a
                href="https://bsky.app/settings/app-passwords"
                target="_blank"
                class="font-medium !text-blue-600 hover:text-blue-700 hover:underline"
              >
                Bluesky App Passwords</a
              >
              settings page. This is not your account password.
            </p>
          </div>
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">
            Bluesky Handle
          </label>
          <input
            v-model="blueskyHandle"
            type="text"
            required
            class="block w-full rounded-lg border border-gray-300 bg-[white] px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-[#1a1a1a]"
            placeholder="e.g. yourname.bsky.social"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">
            App Password
          </label>
          <input
            v-model="blueskyPassword"
            type="password"
            required
            class="block w-full rounded-lg border border-gray-300 bg-[white] px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-[#1a1a1a]"
            placeholder="Enter your app password"
          />
        </div>

        <div v-if="blueskyError" class="rounded-lg bg-red-50 p-4 text-red-700">
          {{ blueskyError }}
        </div>

        <div class="mt-8 flex justify-start space-x-4">
          <button
            type="submit"
            :disabled="connectionsDataStore.isConnectingBluesky.value"
            class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="connectionsDataStore.isConnectingBluesky.value">
              Connecting...
            </span>
            <span v-else>Connect</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
