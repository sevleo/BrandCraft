<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <main class="privacy-policy-container mx-auto max-w-4xl p-6">
    <button
      @click="router.push('/')"
      type="submit"
      class="bg-greenBG cursor-pointer hover:bg-greenLightBG mb-[30px] mt-[10px] w-[150px] rounded-lg p-2 font-semibold text-white transition"
    >
      Go Back
    </button>
    <h1 class="mb-6 text-3xl font-bold">Privacy Policy</h1>
    <p class="mb-6"><strong>Last Updated:</strong> January 3rd, 2025</p>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Overview</h2>
      <p class="mb-4">
        At BrandCraft, we value and respect your privacy. We are committed to
        protecting your personal information and being transparent about how we
        handle it. This Privacy Policy explains our practices for collecting,
        using, and safeguarding your data when you use our Service.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">
        YouTube API Services & Google Privacy Policy
      </h2>
      <p class="mb-4">
        Our Service uses YouTube API Services. By using our Service, you
        acknowledge and agree to be bound by the
        <a
          href="https://www.youtube.com/t/terms"
          target="_blank"
          class="text-green underline hover:text-greenLight"
          >YouTube Terms of Service</a
        >.
      </p>
      <p class="mb-4">
        Additionally, our use of YouTube API Services is subject to Google's
        Privacy Policy, which you can review at
        <a
          href="http://www.google.com/policies/privacy"
          target="_blank"
          class="text-green underline hover:text-greenLight"
          >Google Privacy Policy</a
        >.
      </p>
      <p class="mb-4">
        We collect and use user data in accordance with our Privacy Policy,
        including but not limited to personal information and social media data
        necessary for providing our services. This may include accessing,
        collecting, storing, and processing data such as email addresses, social
        media profiles, and post content for scheduling purposes.
      </p>
      <p class="mb-4">
        If we store, access, or collect data on users' devices using cookies or
        similar technologies, this will be disclosed in our policy.
        Additionally, if we allow third parties to serve content, including
        advertisements, such disclosures will also be made available in this
        document.
      </p>
      <p class="mb-4">
        Users can revoke access to their data at any time through the
        <a
          href="https://security.google.com/settings/"
          target="_blank"
          class="text-green underline hover:text-greenLight"
          >Google security settings page</a
        >.
      </p>
      <p class="mb-4">
        If you have any questions or concerns regarding our privacy practices or
        data usage, please contact us through our website’s contact form or
        email: contact@sleo.dev
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Key Points</h2>
      <p class="mb-4">
        Before diving into the full details of our policy, here are some of the
        key principles we adhere to:
      </p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>
          <strong>Data Protection:</strong> Your social media data is handled
          with utmost care and security.
        </li>
        <li>
          <strong>No Data Selling:</strong> We do not sell your data to third
          parties.
        </li>
        <li>
          <strong>Transparent Usage:</strong> We are clear about how we use your
          data to provide our services.
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Definitions</h2>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>
          <strong>Account:</strong> Your unique account created to access our
          Service.
        </li>
        <li><strong>Company:</strong> BrandCraft, owned by Vsevolod Leonov.</li>
        <li>
          <strong>Service:</strong> The BrandCraft platform and its features.
        </li>
        <li><strong>Website:</strong> BrandCraft, accessible at our domain.</li>
        <li>
          <strong>You:</strong> The individual or entity accessing or using our
          Service.
        </li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Information We Collect</h2>
      <h3 class="mb-2 text-xl font-semibold">Personal Data</h3>
      <p class="mb-4">While using our Service, we may collect:</p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>Email address</li>
        <li>Name</li>
        <li>Social media account information</li>
        <li>Content you create and post through our Service</li>
      </ul>

      <h3 class="mb-2 text-xl font-semibold">Social Media Data</h3>
      <p class="mb-4">
        When you connect your social media accounts, we access:
      </p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>Profile information from connected platforms</li>
        <li>Post content and media for scheduling</li>
        <li>Account statistics and analytics</li>
      </ul>

      <h3 class="mb-2 text-xl font-semibold">Usage Data</h3>
      <p class="mb-4">We automatically collect:</p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>IP address</li>
        <li>Browser type and version</li>
        <li>Pages visited and time spent</li>
        <li>Device information</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">How We Use Your Information</h2>
      <p class="mb-4">We use your data to:</p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>Provide and maintain our social media management service</li>
        <li>
          Schedule and publish content to your connected social media accounts
        </li>
        <li>Analyze performance and provide insights</li>
        <li>Communicate with you about service updates and features</li>
        <li>Improve our service based on usage patterns</li>
        <li>Ensure security and prevent fraud</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Data Sharing and Security</h2>
      <p class="mb-4">We share your information only:</p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>
          With connected social media platforms as necessary for the service
        </li>
        <li>With service providers who assist in operating our platform</li>
        <li>When required by law or to protect our rights</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">
        Requests from Public Authorities
      </h2>
      <p class="mb-4">
        We may receive requests from public authorities (e.g., law enforcement
        agencies) for access to personal data. In such cases, we take the
        following steps to ensure compliance with legal and privacy obligations:
      </p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>
          <strong>Legality Review:</strong> We review the legality of all
          requests before responding.
        </li>
        <li>
          <strong>Challenging Unlawful Requests:</strong> We challenge requests
          that we believe to be unlawful or invalid.
        </li>
        <li>
          <strong>Data Minimization:</strong> We disclose only the minimum data
          necessary to comply with the request.
        </li>
        <li>
          <strong>Documentation:</strong> We maintain detailed records of all
          requests, including the data provided, the legal basis for the
          request, and our response.
        </li>
      </ul>
      <p class="mb-4">
        Our approach ensures that your personal data is handled responsibly and
        transparently in accordance with applicable laws and our commitment to
        user privacy.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Your Rights</h2>
      <p class="mb-4">You have the right to:</p>
      <ul class="mb-4 ml-6 list-disc space-y-2">
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Disconnect social media accounts</li>
        <li>Object to certain data processing</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Changes to This Policy</h2>
      <p class="mb-4">
        We may update this Privacy Policy periodically. Changes will be posted
        on this page with an updated date. You are encouraged to review this
        policy regularly to stay informed about how we protect your information.
      </p>
    </section>

    <section class="mb-8">
      <h2 class="mb-4 text-2xl font-semibold">Contact Us</h2>
      <p class="mb-4">
        If you have questions about this Privacy Policy or our privacy
        practices, please contact us through our website's contact form or
        email: contact@sleo.dev
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
.privacy-policy-container {
  color: #374151;
  line-height: 1.6;
}

.privacy-policy-container p {
  margin-bottom: 1rem;
}

.privacy-policy-container ul {
  margin-bottom: 1rem;
}

.privacy-policy-container li {
  margin-bottom: 0.5rem;
}
</style>
