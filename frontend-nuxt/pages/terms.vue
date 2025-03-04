<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <main class="terms-container mx-auto max-w-4xl p-6">
    <button
      @click="router.push('/')"
      type="submit"
      class="bg-greenBG cursor-pointer hover:bg-greenLightBG mb-[30px] mt-[10px] w-[150px] rounded-lg p-2 font-semibold text-white transition"
    >
      Go Back
    </button>
    <h1 class="mb-6 text-3xl font-bold">Terms and Conditions</h1>
    <p class="mb-6"><strong>Last Updated:</strong> December 24th, 2024</p>

    <section class="mb-8">
      <p class="mb-4">
        Please read these terms and conditions carefully before using our
        service.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">
        Interpretation and Definitions
      </h2>
      <h3 class="mb-2 text-xl font-semibold">Interpretation</h3>
      <p class="mb-4">
        Words with capitalized initials have specific meanings as defined below.
        These definitions apply regardless of whether they appear in singular or
        plural form.
      </p>

      <h3 class="mb-2 text-xl font-semibold">Definitions</h3>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li><strong>Company:</strong> BrandCraft, owned by Vsevolod Leonov.</li>
        <li>
          <strong>Service:</strong> The BrandCraft platform and its features.
        </li>
        <li>
          <strong>Website:</strong> BrandCraft, accessible through our domain.
        </li>
        <li>
          <strong>You:</strong> The individual or entity accessing or using the
          Service.
        </li>
        <li>
          <strong>Social Media Services:</strong> Third-party platforms that can
          be connected to our Service.
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Acknowledgment</h2>
      <p class="mb-4">
        These Terms and Conditions govern your use of our Service. By accessing
        or using the Service, you agree to be bound by these Terms. If you
        disagree with any part of these terms, you may not access the Service.
      </p>
      <p class="mb-4">
        You represent that you are over the age of 18. The Company does not
        permit those under 18 to use the Service.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">User Accounts</h2>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>
          You are responsible for maintaining the confidentiality of your
          account credentials.
        </li>
        <li>
          You are responsible for all activities that occur under your account.
        </li>
        <li>
          You must immediately notify us of any unauthorized use of your
          account.
        </li>
        <li>You may not use another person's account without permission.</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Acceptable Use</h2>
      <p class="mb-4">When using our Service, you agree not to:</p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>Violate any applicable laws or regulations</li>
        <li>Infringe upon intellectual property rights</li>
        <li>Transmit harmful code or malware</li>
        <li>Interfere with the proper functioning of the Service</li>
        <li>Use the Service for any illegal or unauthorized purpose</li>
        <li>Harass, abuse, or harm others</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Social Media Integration</h2>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>
          You must comply with the terms of service of connected social media
          platforms
        </li>
        <li>
          We are not responsible for changes in third-party platform APIs or
          services
        </li>
        <li>
          You grant us necessary permissions to post content on your behalf
        </li>
        <li>You retain ownership of your content and social media accounts</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Termination</h2>
      <p class="mb-4">
        We may terminate or suspend your account immediately, without prior
        notice or liability, for any reason, including without limitation if you
        breach these Terms and Conditions.
      </p>
      <p class="mb-4">
        Upon termination, your right to use the Service will cease immediately.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Limitation of Liability</h2>
      <p class="mb-4">
        To the maximum extent permitted by law, we shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages, or
        any loss of profits or revenues, whether incurred directly or
        indirectly, or any loss of data, use, goodwill, or other intangible
        losses resulting from:
      </p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>Your use or inability to use our Service</li>
        <li>
          Any unauthorized access to or use of our servers and/or personal
          information
        </li>
        <li>
          Any interruption or cessation of transmission to or from the Service
        </li>
        <li>
          Any bugs, viruses, or other harmful code that may be transmitted
          through the Service
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Disclaimer</h2>
      <p class="mb-4">
        The Service is provided "AS IS" and "AS AVAILABLE" without any warranty
        of any kind. We do not guarantee that the Service will be uninterrupted,
        timely, secure, or error-free.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Changes to These Terms</h2>
      <p class="mb-4">
        We reserve the right to modify or replace these terms at any time. If a
        revision is material, we will provide at least 30 days' notice before
        the new terms take effect. What constitutes a material change will be
        determined at our sole discretion.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Contact Us</h2>
      <p class="mb-4">
        If you have any questions about these Terms and Conditions, please
        contact us through our website's contact form or email.
      </p>
    </section>
    <button
      @click="router.push('/')"
      type="submit"
      class="bg-greenBG cursor-pointer mt-[10px] w-[150px] rounded-lg p-2 font-semibold text-white transition hover:bg-[#047f58df]"
    >
      Go Back
    </button>
  </main>
</template>

<style scoped>
.terms-container {
  color: #f3f4f6;
  line-height: 1.6;
}

.terms-container p {
  margin-bottom: 1rem;
}

.terms-container ul {
  margin-bottom: 1rem;
}

.terms-container li {
  margin-bottom: 0.5rem;
}
</style>
