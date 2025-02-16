import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

/* Import specific icons */
import {
  faXTwitter,
  faFacebook,
  faLinkedin,
  faInstagram,
  faTiktok,
  faYoutube,
  faThreads,
  faBluesky,
  faMastodon,
  faPinterest,
} from "@fortawesome/free-brands-svg-icons";
import {
  faCheck,
  faCalendar,
  faRocket,
  faShareNodes,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

export default defineNuxtPlugin((nuxtApp) => {
  // Add icons to the library
  library.add(
    faXTwitter,
    faFacebook,
    faLinkedin,
    faInstagram,
    faTiktok,
    faYoutube,
    faThreads,
    faBluesky,
    faMastodon,
    faPinterest,
    faCheck,
    faCalendar,
    faRocket,
    faShareNodes,
    faUser
  );

  // Register FontAwesome globally
  nuxtApp.vueApp.component("font-awesome-icon", FontAwesomeIcon);
});
