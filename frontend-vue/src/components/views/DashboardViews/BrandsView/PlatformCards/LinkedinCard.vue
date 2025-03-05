<script setup lang="ts">
  import { X } from 'lucide-vue-next';

  import connectionsDataStore from '@/utils/connectionsDataStore';
  import { connectLinkedin } from '@/api/linkedinApi';
  import { disconnectConnectedAccount } from '@/api/connectedAccountsApi';

  const connect = async () => {
    connectionsDataStore.isConnectingLinkedin.value = true;
    const { authUrl } = await connectLinkedin();
    console.log(authUrl);
    window.location.href = authUrl;
  };

  const disconnect = async (platformId: string) => {
    await disconnectConnectedAccount(platformId);

    connectionsDataStore.linkedinAccount.value =
      connectionsDataStore.linkedinAccount.value.filter(
        (record: any) => record.platformId !== platformId
      );
  };
</script>

<template>
  <div class="linkedin-card w-full max-w-2xl">
    <h2 class="mb-6 text-[20px] text-gray-900">LinkedIn</h2>
    <p class="mb-6 text-2xl text-gray-900">
      Connect with professionals and grow your network on LinkedIn.
    </p>

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
          connectionsDataStore.linkedinAccount.value &&
          connectionsDataStore.linkedinAccount.value.length > 0
        "
        class="mt-[50px] text-2xl text-gray-900"
      >
        Connected LinkedIn Accounts
      </h2>

      <div class="w-fit" v-if="connectionsDataStore.linkedinAccount.value">
        <div
          v-for="connection in connectionsDataStore.linkedinAccount.value"
          class="mt-[10px] flex w-fit items-center justify-start gap-3 rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium transition-colors duration-200 dark:border-[#313131] dark:bg-[#121212]"
        >
          <div class="w-[30px]">
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
      <h2 class="mb-6 text-2xl text-gray-900">Connect LinkedIn</h2>
      <div class="space-y-6">
        <div class="rounded-lg bg-blue-50 p-6 dark:bg-gray-800">
          <div class="items-start space-y-4">
            <p class="text-sm leading-relaxed text-gray-900">
              To connect, make sure you're logged in to the proper LinkedIn
              profile on your browser so BrandCraft can pick it up.
            </p>
          </div>
        </div>
        <div class="mt-8 flex justify-start space-x-4">
          <button
            type="button"
            @click="connect"
            :disabled="connectionsDataStore.isConnectingLinkedin.value"
            class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span v-if="connectionsDataStore.isConnectingLinkedin.value"
              >Connecting...</span
            >
            <span v-else>Connect</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
