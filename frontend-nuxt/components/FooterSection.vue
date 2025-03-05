<script setup lang="ts"></script>

<template>
  <footer
    class="privacy justify-center items-center flex flex-col pt-[60px] px-[50px] w-full bg-[#191919]"
  >
    <div
      class="w-full max-w-[1000px] flex gap-4 flex-col lg:flex-row lg:w-[80%]"
    >
      <div
        class="flex h-full w-full lg:justify-center items-start justify-center"
      >
        <div class="flex flex-col justify-center items-start">
          <img
            src="@/public/perfect_logo_full_white.svg"
            alt="BrandCraft Logo"
            class="w-[200px] mb-[10px] self-center lg:self-start"
          />
          <p
            class="text-gray-400 text-[14px] leading-relaxed w-[300px] text-center lg:text-start"
          >
            Open-source social media scheduler.
          </p>
          <p
            class="text-gray-400 text-[14px] leading-relaxed w-[300px] text-center lg:text-start"
          >
            Join us on
            <a
              @click=""
              href="https://discord.gg/KYZGsH7Mfb"
              class="underline"
              target="_blank"
              >Discord</a
            >.
          </p>
          <p
            class="text-gray-400 text-[14px] leading-relaxed w-[300px] text-center lg:text-start"
          >
            Submit a bug or request a feature
            <a
              @click=""
              href="https://insigh.to/b/brandcraftart"
              class="underline"
              target="_blank"
              >here</a
            >.
          </p>

          <!-- <div class="flex mt-[20px]">
        <div>github link</div>
        <div>discord link</div>
        <div>twitter link</div>
      </div> -->
        </div>
      </div>

      <div
        class="flex h-full w-full lg:justify-center items-start justify-center"
      >
        <div
          class="flex flex-col w-[120px] justify-center items-center lg:items-start gap-1 mt-[15px]"
        >
          <p
            class="text-[16px] text-gray-500 tracking-wider font-medium mb-[10px]"
          >
            RESOURCES
          </p>
          <a href="/blog" class="hover:underline">Blog</a>
          <a href="https://discord.gg/KYZGsH7Mfb" class="hover:underline"
            >Discord</a
          >
          <a href="mailto:sev@brandcraft.art" class="hover:underline">Email</a>
        </div>
      </div>
      <div
        class="flex h-full w-full lg:justify-center items-start justify-center"
      >
        <div
          class="flex w-[120px] flex-col justify-center items-center lg:items-start gap-1 mt-[15px]"
        >
          <p
            class="text-[16px] text-gray-500 tracking-wider font-medium mb-[10px]"
          >
            CHANNELS
          </p>
          <NuxtLink href="/instagram" class="hover:underline"
            >Instagram</NuxtLink
          >
          <NuxtLink href="/tiktok" class="hover:underline">TikTok</NuxtLink>
          <NuxtLink href="/youtube" class="hover:underline">YouTube</NuxtLink>
          <NuxtLink href="/facebook" class="hover:underline">Facebook</NuxtLink>
          <NuxtLink href="/threads" class="hover:underline">Threads</NuxtLink>
          <NuxtLink href="/bluesky" class="hover:underline">Bluesky</NuxtLink>
          <NuxtLink href="/x" class="hover:underline">X (Twitter)</NuxtLink>
          <NuxtLink href="/mastodon" class="hover:underline">Mastodon</NuxtLink>
          <NuxtLink href="/linkedin" class="hover:underline">LinkedIn</NuxtLink>
        </div>
      </div>
      <div
        class="flex h-full w-full lg:justify-center items-start justify-center"
      >
        <div
          class="flex flex-col w-[120px] justify-center items-center lg:items-start gap-1 mt-[15px]"
        >
          <p
            class="text-[16px] text-gray-500 tracking-wider font-medium mb-[10px]"
          >
            LEGAL
          </p>
          <NuxtLink
            href="/terms"
            class="hover:underline lg:text-start text-center"
            >Terms and Conditions</NuxtLink
          >
          <NuxtLink href="/privacy" class="hover:underline"
            >Privacy Policy</NuxtLink
          >
        </div>
      </div>
    </div>
    <div class="flex justify-center items-start w-full mt-[50px] mb-[20px]">
      <p class="privacy mt-[10px] text-[14px] text-gray-500">
        @ 2025 Brandcraft All rights reserved.
      </p>
    </div>
  </footer>
</template>
